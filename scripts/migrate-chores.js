/**
 * One-time migration: Combine old chore titles/templates into streamlined list.
 * Run: node scripts/migrate-chores.js
 */
const { PrismaClient } = require('@prisma/client');

let CHORE_MIGRATION_MAP, TEMPLATE_KEY_MIGRATION_MAP, PREDEFINED_CHORES;

async function loadMappings() {
  const mod = await import('../lib/boardChores.js');
  CHORE_MIGRATION_MAP = mod.CHORE_MIGRATION_MAP;
  TEMPLATE_KEY_MIGRATION_MAP = mod.TEMPLATE_KEY_MIGRATION_MAP;
  PREDEFINED_CHORES = mod.PREDEFINED_CHORES;
}

const prisma = new PrismaClient();

function getChoreMapping(title) {
  return CHORE_MIGRATION_MAP[title] || null;
}

function getNewTemplateKey(oldKey) {
  return TEMPLATE_KEY_MIGRATION_MAP[oldKey] ?? oldKey;
}

async function migrateChores() {
  console.log('Migrating Chore records...');
  const chores = await prisma.chore.findMany({ orderBy: { createdAt: 'asc' } });

  const groups = new Map();

  for (const chore of chores) {
    const mapping = getChoreMapping(chore.title);
    const newTitle = mapping ? mapping.newTitle : chore.title;
    const newDesc = mapping?.defaultDescription;
    const key = `${chore.familyId}|${chore.dueDay}|${chore.assignedTo}|${newTitle}`;

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({
      ...chore,
      _newTitle: newTitle,
      _newDesc: chore.description || newDesc
    });
  }

  let updated = 0;
  let deleted = 0;

  for (const [, group] of groups) {
    if (group.length === 1) {
      const c = group[0];
      if (c.title !== c._newTitle || (c._newDesc && c.description !== c._newDesc)) {
        await prisma.chore.update({
          where: { id: c.id },
          data: {
            title: c._newTitle,
            ...(c._newDesc != null && { description: c._newDesc })
          }
        });
        updated++;
      }
      continue;
    }

    const [keep, ...remove] = group;
    const descriptions = [keep._newDesc, keep.description, ...remove.map(r => r._newDesc || r.description)].filter(Boolean);
    const mergedDesc = [...new Set(descriptions)].join('; ');

    await prisma.chore.update({
      where: { id: keep.id },
      data: {
        title: keep._newTitle,
        description: mergedDesc || null
      }
    });
    updated++;

    for (const c of remove) {
      await prisma.chore.delete({ where: { id: c.id } });
      deleted++;
    }
  }

  console.log(`Chores: ${updated} updated, ${deleted} deleted (merged)`);
}

async function migrateChoreBoard() {
  console.log('Migrating ChoreBoard records...');
  const boards = await prisma.choreBoard.findMany({ orderBy: { createdAt: 'asc' } });

  const byFamilyAndNewKey = new Map();

  for (const board of boards) {
    const newKey = getNewTemplateKey(board.templateKey);
    const key = `${board.familyId}|${newKey}`;

    const predefined = PREDEFINED_CHORES.find(p => p.templateKey === newKey);
    const newTitle = predefined?.title ?? board.title;

    if (!byFamilyAndNewKey.has(key)) {
      byFamilyAndNewKey.set(key, []);
    }
    byFamilyAndNewKey.get(key).push({
      ...board,
      _newTemplateKey: newKey,
      _newTitle: newTitle,
      _newDescription: predefined?.description ?? board.description
    });
  }

  let updated = 0;
  let deleted = 0;

  for (const [, group] of byFamilyAndNewKey) {
    if (group.length === 1) {
      const b = group[0];
      if (b.templateKey !== b._newTemplateKey || b.title !== b._newTitle) {
        await prisma.choreBoard.update({
          where: { id: b.id },
          data: {
            templateKey: b._newTemplateKey,
            title: b._newTitle,
            ...(b._newDescription != null && { description: b._newDescription })
          }
        });
        updated++;
      }
      continue;
    }

    const sorted = group.sort((a, b) => {
      const score = x => (x.isRecurring ? 2 : 0) + (x.eligibleMemberIds?.length || 0) + (x.daysPerWeek || 0);
      return score(b) - score(a);
    });
    const [keep, ...remove] = sorted;

    await prisma.choreBoard.update({
      where: { id: keep.id },
      data: {
        templateKey: keep._newTemplateKey,
        title: keep._newTitle,
        ...(keep._newDescription != null && { description: keep._newDescription })
      }
    });
    updated++;

    for (const b of remove) {
      await prisma.choreBoard.delete({ where: { id: b.id } });
      deleted++;
    }
  }

  console.log(`ChoreBoard: ${updated} updated, ${deleted} deleted (merged)`);
}

async function main() {
  try {
    await loadMappings();
    await migrateChores();
    await migrateChoreBoard();
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
