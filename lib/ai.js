import Anthropic from "@anthropic-ai/sdk";
import { validateEnv } from "./env";
import { parseEligibleMembers } from "./choreTemplates";
import { AVAILABILITY_DAYS } from "./memberConstants";

// Ensure environment is validated
validateEnv();

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

function buildRichMemberContext(familyMembers) {
  return familyMembers.map(m => {
    let ctx = `- ${m.name}`;

    const meta = [];
    if (m.age !== null && m.age !== undefined) meta.push(`age ${m.age}`);
    if (m.relationship) meta.push(m.relationship);
    meta.push(m.role || 'member');
    ctx += ` (${meta.join(', ')})`;

    if (m.workingHours) ctx += `\n  Work schedule: ${m.workingHours}`;

    if (m.availability) {
      const parts = [];
      for (const day of AVAILABILITY_DAYS) {
        const d = m.availability[day];
        if (!d || d.available === false) continue;
        const cap = day.charAt(0).toUpperCase() + day.slice(1, 3);
        if (d.from && d.to) {
          parts.push(`${cap} ${d.from}-${d.to}`);
        } else {
          parts.push(`${cap}`);
        }
      }
      if (parts.length > 0 && parts.length < 7) {
        ctx += `\n  Available: ${parts.join(', ')}`;
      } else if (parts.length === 0) {
        ctx += `\n  Available: None`;
      }
    }

    if (m.activities) ctx += `\n  Activities: ${m.activities}`;
    if (m.abilities && m.abilities.length > 0) ctx += `\n  Abilities: ${m.abilities.join(', ')}`;

    if (m.chorePreferences) {
      if (m.chorePreferences.likes && m.chorePreferences.likes.length > 0) {
        ctx += `\n  Enjoys: ${m.chorePreferences.likes.join(', ')}`;
      }
      if (m.chorePreferences.dislikes && m.chorePreferences.dislikes.length > 0) {
        ctx += `\n  Dislikes: ${m.chorePreferences.dislikes.join(', ')}`;
      }
    }

    if (m.dietaryRestrictions && m.dietaryRestrictions.length > 0) {
      ctx += `\n  Dietary: ${m.dietaryRestrictions.join(', ')}`;
    }
    if (m.restrictions) ctx += `\n  Restrictions: ${m.restrictions}`;

    return ctx;
  }).join("\n\n");
}

export async function generateChoreAssignments(familyMembers, unassignedChores) {
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured. AI features are unavailable.');
  }

  const membersContext = buildRichMemberContext(familyMembers);

  // Build chores context with eligibility information
  const choresContext = unassignedChores.map((c) => {
    let choreInfo = `- ${c.title} (due: ${c.dueDay})`;
    
    // Check if chore has eligibility constraints
    if (c.eligibleMemberIds) {
      const eligibleIds = parseEligibleMembers(c.eligibleMemberIds);
      if (eligibleIds.length > 0) {
        const eligibleNames = familyMembers
          .filter(m => eligibleIds.includes(m.id))
          .map(m => m.name)
          .join(", ");
        choreInfo += ` [Eligible: ${eligibleNames}]`;
      } else {
        // No eligible members found
        choreInfo += ` [WARNING: No eligible members exist for this chore]`;
      }
    } else if (c.assignedTo && c.assignedTo !== 'All Members') {
      choreInfo += ` [Pre-assigned to: ${c.assignedTo}]`;
    }
    
    return choreInfo;
  }).join("\n");

  const prompt = `You are a family planner assistant. Given the following family members and unassigned chores, suggest fair and practical chore assignments considering balance, working hours, and eligibility constraints.

Family Members:
${membersContext}

Unassigned Chores:
${choresContext}

Consider:
- Fair distribution of work
- Member ages and roles (age-appropriate tasks for kids, don't give complex tasks to young children)
- Working hours and availability (assign fewer/easier tasks to those with work commitments)
- Abilities (only assign tasks members are capable of doing)
- Preferences (try to match liked chores; minimize disliked ones but still be fair)
- Physical restrictions (avoid assigning tasks that conflict with limitations)
- Balance across the week
- Eligibility constraints (only assign to eligible members if specified)

Generate a JSON response with suggestions. Format:
{
  "suggestions": [
    {
      "choreId": "id",
      "choreTitle": "title",
      "suggestedAssignee": "Name",
      "reasoning": "brief reason"
    }
  ]
}

Only respond with valid JSON, no other text.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  try {
    const content = message.content[0];
    if (content.type === "text") {
      return JSON.parse(content.text);
    }
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return { suggestions: [] };
  }
}

export async function generateWeeklyChoreAssignments(familyMembers, chores, boardSettings) {
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured. AI features are unavailable.');
  }

  const membersContext = buildRichMemberContext(familyMembers);

  const boardMap = {};
  for (const b of boardSettings) {
    boardMap[b.title] = b;
  }

  const choresContext = chores.map((c) => {
    const board = boardMap[c.title];
    let info = `- "${c.title}" on ${c.dueDay} (ID: ${c.id})`;
    if (board) {
      if (board.frequencyType === 'DAILY') info += ` [daily chore]`;
      else if (board.frequencyType === 'WEEKLY' && board.daysPerWeek) info += ` [${board.daysPerWeek}x/week]`;
      else if (board.frequencyType === 'BIWEEKLY') info += ` [every 2 weeks — once this week]`;
      else if (board.frequencyType === 'MONTHLY') info += ` [monthly — once this week]`;
      else if (board.frequencyType === 'CUSTOM' && board.customEveryDays) info += ` [every ${board.customEveryDays} days]`;
    }
    if (c.eligibleMemberIds && c.eligibleMemberIds.length > 0) {
      const eligibleNames = familyMembers
        .filter(m => c.eligibleMemberIds.includes(m.id))
        .map(m => m.name)
        .join(", ");
      if (eligibleNames) info += ` [Eligible: ${eligibleNames}]`;
    }
    if (c.defaultAssigneeMemberId) {
      const defaultMember = familyMembers.find(m => m.id === c.defaultAssigneeMemberId);
      if (defaultMember) info += ` [Preferred: ${defaultMember.name}]`;
    }
    return info;
  }).join("\n");

  const prompt = `You are a family planner assistant. Assign family members to the following chores. Each chore already has a specific day assigned — you only need to decide WHO does each one.

Family Members:
${membersContext}

Chores to Assign:
${choresContext}

Rules:
- Distribute work fairly across family members
- Consider member ages and roles (age-appropriate tasks for kids; don't assign complex tasks to young children)
- Consider working hours, availability, and activities (lighter load for those who work or have commitments)
- Match abilities (only assign tasks members can do; check their abilities list)
- Respect preferences (try to assign liked chores; minimize disliked ones but maintain fairness)
- Respect physical restrictions (avoid tasks that conflict with limitations)
- Respect eligibility constraints (only assign to eligible members when specified)
- Prefer the default/preferred assignee when set, but still rotate for fairness
- If the same chore appears multiple times per week, try to rotate assignees
- Biweekly and monthly chores appear once this week; treat them as lower-burden than daily/weekly chores

Generate a JSON response. Format:
{
  "suggestions": [
    {
      "choreId": "the chore ID",
      "choreTitle": "title",
      "suggestedAssignee": "MemberName",
      "reasoning": "brief reason"
    }
  ]
}

Only respond with valid JSON, no other text.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  try {
    const content = message.content[0];
    if (content.type === "text") {
      return JSON.parse(content.text);
    }
  } catch (error) {
    console.error("Failed to parse AI response for weekly chores:", error);
    return { suggestions: [] };
  }
}

export async function generateMealPlan(familyMembers, existingRecipes, daysToFill) {
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured. AI features are unavailable.');
  }

  const membersContext = buildRichMemberContext(familyMembers);

  const prompt = `You are a family meal planner assistant. Help suggest meals for the family and assign cooking duties fairly.

Family Members:
${membersContext}

Existing Recipes:
${existingRecipes.map((r) => `- ${r.name} (${r.ingredients}, cook day: ${r.cookDay})`).join("\n")}

Days to fill: ${daysToFill.join(", ")}

Consider:
- Dietary restrictions for ALL family members (meals must accommodate everyone or offer alternatives)
- Only assign cooking to members with the "Can cook" ability or parents
- Consider member availability on each day
- Respect physical restrictions

Generate a JSON response with meal suggestions. Format:
{
  "suggestions": [
    {
      "day": "Monday",
      "recipeName": "suggested meal",
      "ingredients": "ingredient list",
      "suggestedCook": "Name",
      "reasoning": "brief reason"
    }
  ]
}

Only respond with valid JSON, no other text.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  try {
    const content = message.content[0];
    if (content.type === "text") {
      return JSON.parse(content.text);
    }
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return { suggestions: [] };
  }
}

export async function generateWeeklySchedule(familyMembers, existingEvents) {
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured. AI features are unavailable.');
  }

  const membersContext = buildRichMemberContext(familyMembers);

  const prompt = `You are a family schedule coordinator. Suggest fair work hour distribution and event scheduling for the family week.

Family Members:
${membersContext}

Existing Events:
${existingEvents.map((e) => `- ${e.title} (${e.type} on ${e.startsAt.toDateString()})`).join("\n")}

Consider:
- Each member's availability grid and working hours
- Activities and commitments (school, sports, clubs)
- Physical restrictions
- Fair distribution of responsibilities

Generate a JSON response with schedule suggestions. Format:
{
  "suggestions": [
    {
      "day": "Monday",
      "person": "Name",
      "workHours": "9:00 AM - 5:00 PM",
      "reasoning": "brief reason for this assignment"
    }
  ]
}

Only respond with valid JSON, no other text.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  try {
    const content = message.content[0];
    if (content.type === "text") {
      return JSON.parse(content.text);
    }
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return { suggestions: [] };
  }
}
