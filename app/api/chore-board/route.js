import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getOrCreateDefaultFamily } from '../../../lib/defaultFamily';
import { PREDEFINED_CHORES } from '../../../lib/boardChores';

export async function GET(request) {
  try {
    const family = await getOrCreateDefaultFamily();

    // Fetch all members
    const members = await prisma.familyMember.findMany({
      where: { familyId: family.id },
      orderBy: { createdAt: 'asc' }
    });

    // Fetch or create board settings for all predefined chores
    let boardSettings = [];
    
    try {
      boardSettings = await Promise.all(
        PREDEFINED_CHORES.map(async (chore) => {
          let setting = await prisma.choreBoard.findUnique({
            where: {
              familyId_templateKey: {
                familyId: family.id,
                templateKey: chore.templateKey
              }
            }
          });

          // Auto-create default setting if missing
          if (!setting) {
            setting = await prisma.choreBoard.create({
              data: {
                familyId: family.id,
                templateKey: chore.templateKey,
                title: chore.title,
                isRecurring: false,
                frequencyType: 'ONE_TIME',
                eligibilityMode: 'ALL',
                eligibleMemberIds: [],
                defaultAssigneeMemberId: null
              }
            });
          }

          // Enrich with member labels
          return {
            ...setting,
            defaultAssigneeLabel: members.find(m => m.id === setting.defaultAssigneeMemberId)?.name || null,
            eligibleMemberLabels: (setting.eligibleMemberIds || [])
              .map(id => members.find(m => m.id === id)?.name || id)
          };
        })
      );
    } catch (dbError) {
      // If ChoreBoard table doesn't exist yet, return defaults
      if (dbError.code === 'P2021') {
        boardSettings = PREDEFINED_CHORES.map(chore => ({
          id: `temp-${chore.templateKey}`,
          familyId: family.id,
          templateKey: chore.templateKey,
          title: chore.title,
          isRecurring: false,
          frequencyType: 'ONE_TIME',
          customEveryDays: null,
          eligibilityMode: 'ALL',
          eligibleMemberIds: [],
          defaultAssigneeMemberId: null,
          defaultAssigneeLabel: null,
          eligibleMemberLabels: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          _tableNotCreated: true // Flag to indicate we're using defaults
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

    if (!Array.isArray(settings)) {
      return NextResponse.json(
        { error: 'Settings must be an array' },
        { status: 400 }
      );
    }

    const family = await getOrCreateDefaultFamily();

    // Validate each setting
    for (const setting of settings) {
      const { templateKey, isRecurring, frequencyType, customEveryDays, eligibilityMode, eligibleMemberIds, defaultAssigneeMemberId } = setting;

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
            isRecurring: setting.isRecurring,
            frequencyType: setting.frequencyType,
            customEveryDays: setting.customEveryDays || null,
            eligibilityMode: setting.eligibilityMode,
            eligibleMemberIds: setting.eligibleMemberIds || [],
            defaultAssigneeMemberId: setting.defaultAssigneeMemberId || null
          },
          create: {
            familyId: family.id,
            templateKey: setting.templateKey,
            title: setting.title,
            isRecurring: setting.isRecurring,
            frequencyType: setting.frequencyType,
            customEveryDays: setting.customEveryDays || null,
            eligibilityMode: setting.eligibilityMode,
            eligibleMemberIds: setting.eligibleMemberIds || [],
            defaultAssigneeMemberId: setting.defaultAssigneeMemberId || null
          }
        })
      )
    );

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
