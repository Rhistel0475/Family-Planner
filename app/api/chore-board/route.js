import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { PREDEFINED_CHORES } from '../../../lib/boardChores';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    // Fetch family members (required for enriching the data)
    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'asc' }
    });

    // Try to fetch board settings from the database
    // If the ChoreBoard table doesn't exist, return predefined defaults
    let boardSettings = [];
    
    try {
      // Fetch ALL ChoreBoard entries for this family (predefined + custom)
      const allSettings = await prisma.choreBoard.findMany({
        where: { familyId: family.id },
        orderBy: { createdAt: 'asc' }
      });

      // Create a Set of existing template keys
      const existingKeys = new Set(allSettings.map(s => s.templateKey));

      // Auto-create missing predefined chores
      for (const chore of PREDEFINED_CHORES) {
        if (!existingKeys.has(chore.templateKey)) {
          const newSetting = await prisma.choreBoard.create({
            data: {
              familyId: family.id,
              templateKey: chore.templateKey,
              title: chore.title,
              description: chore.description || null,
              isRecurring: false,
              frequencyType: 'ONE_TIME',
              eligibilityMode: 'ALL',
              eligibleMemberIds: [],
              defaultAssigneeMemberId: null
            }
          });
          allSettings.push(newSetting);
        }
      }

      // Enrich all settings with member labels
      boardSettings = allSettings.map(setting => ({
        ...setting,
        defaultAssigneeLabel: members.find(m => m.id === setting.defaultAssigneeMemberId)?.name || null,
        eligibleMemberLabels: (setting.eligibleMemberIds || []).map(id => members.find(m => m.id === id)?.name || id)
      }));

      console.log(`📊 ChoreBoard GET: Returning ${boardSettings.length} total settings`);
      console.log(`📊 Predefined: ${boardSettings.filter(s => !s.templateKey.startsWith('custom_')).length}`);
      console.log(`📊 Custom: ${boardSettings.filter(s => s.templateKey.startsWith('custom_')).length}`);
      if (boardSettings.filter(s => s.templateKey.startsWith('custom_')).length > 0) {
        console.log('📊 Custom chores:', boardSettings.filter(s => s.templateKey.startsWith('custom_')).map(s => s.title));
      }

    } catch (dbError) {
      // If all queries fail (table doesn't exist), return all defaults
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        boardSettings = PREDEFINED_CHORES.map(chore => ({
          id: `temp-${chore.templateKey}`,
          familyId: family.id,
          templateKey: chore.templateKey,
          title: chore.title,
          description: chore.description || null,
          isRecurring: false,
          frequencyType: 'ONE_TIME',
          customEveryDays: null,
          daysPerWeek: null,
          eligibilityMode: 'ALL',
          eligibleMemberIds: [],
          defaultAssigneeMemberId: null,
          defaultAssigneeLabel: null,
          eligibleMemberLabels: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          _tableNotCreated: true
        }));
      } else {
        throw dbError;
      }
    }

    return NextResponse.json({
      settings: boardSettings,
      members,
      family: { id: family.id, name: family.name }
    });
  } catch (error) {
    console.error('Chore Board GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chore board settings', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { settings } = body;

    console.log('📝 ChoreBoard PATCH: Received', settings?.length, 'settings to update');

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings must be an array' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    // Validate each setting
    for (const setting of settings) {
      const { templateKey, title, description, isRecurring, frequencyType, customEveryDays, daysPerWeek, eligibilityMode, eligibleMemberIds, defaultAssigneeMemberId } = setting;

      if (!templateKey) {
        return NextResponse.json(
          { error: 'Template key is required' },
          { status: 400 }
        );
      }

      if (!isRecurring && frequencyType !== 'ONE_TIME') {
        return NextResponse.json(
          { error: `Cannot set frequency ${frequencyType} when recurring is off` },
          { status: 400 }
        );
      }

      if (frequencyType === 'CUSTOM' && (!customEveryDays || customEveryDays < 1)) {
        return NextResponse.json(
          { error: `Custom frequency requires customEveryDays >= 1` },
          { status: 400 }
        );
      }

      if (daysPerWeek !== undefined && daysPerWeek !== null) {
        const dpw = Number(daysPerWeek);
        if (!Number.isInteger(dpw) || dpw < 1 || dpw > 7) {
          return NextResponse.json(
            { error: 'daysPerWeek must be an integer between 1 and 7' },
            { status: 400 }
          );
        }
      }

      if (eligibilityMode === 'SELECTED' && (!eligibleMemberIds || eligibleMemberIds.length === 0)) {
        return NextResponse.json(
          { error: `SELECTED eligibility mode requires at least 1 member` },
          { status: 400 }
        );
      }
    }

    // Update all settings in parallel
    const updated = await Promise.all(
      settings.map(setting =>
        prisma.choreBoard.upsert({
          where: {
            familyId_templateKey: {
              familyId: family.id,
              templateKey: setting.templateKey
            }
          },
          update: {
            ...(setting.title != null && { title: setting.title }),
            ...(setting.description !== undefined && { description: setting.description?.trim() || null }),
            isRecurring: setting.isRecurring,
            frequencyType: setting.frequencyType,
            customEveryDays: setting.customEveryDays || null,
            daysPerWeek: setting.daysPerWeek != null ? Number(setting.daysPerWeek) : null,
            eligibilityMode: setting.eligibilityMode,
            eligibleMemberIds: setting.eligibleMemberIds || [],
            defaultAssigneeMemberId: setting.defaultAssigneeMemberId || null
          },
          create: {
            familyId: family.id,
            templateKey: setting.templateKey,
            title: setting.title,
            description: setting.description?.trim() || null,
            isRecurring: setting.isRecurring,
            frequencyType: setting.frequencyType,
            customEveryDays: setting.customEveryDays || null,
            daysPerWeek: setting.daysPerWeek != null ? Number(setting.daysPerWeek) : null,
            eligibilityMode: setting.eligibilityMode,
            eligibleMemberIds: setting.eligibleMemberIds || [],
            defaultAssigneeMemberId: setting.defaultAssigneeMemberId || null
          }
        })
      )
    );

    console.log('📝 ChoreBoard PATCH: Successfully upserted', updated.length, 'entries');
    updated.forEach(u => {
      if (u.templateKey.startsWith('custom_')) {
        console.log(`📝 Created/Updated custom chore: ${u.title} (${u.templateKey})`);
      }
    });

    return NextResponse.json({
      success: true,
      updated: updated.length,
      settings: updated
    });
  } catch (error) {
    console.error('Chore Board PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to save chore board settings', details: error.message },
      { status: 500 }
    );
  }
}