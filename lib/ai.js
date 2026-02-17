import Anthropic from "@anthropic-ai/sdk";
import { validateEnv } from "./env";
import { parseEligibleMembers } from "./choreTemplates";

// Ensure environment is validated
validateEnv();

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function generateChoreAssignments(familyMembers, unassignedChores) {
  if (!client) {
    throw new Error('ANTHROPIC_API_KEY is not configured. AI features are unavailable.');
  }

  const membersContext = familyMembers.map(m =>
    `- ${m.name} (${m.role || "member"})${m.workingHours ? ` - Working hours: ${m.workingHours}` : ''}`
  ).join("\n");

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
- Member roles (parents vs kids - give age-appropriate tasks to kids)
- Working hours (assign fewer/easier tasks to those with work commitments)
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

  const membersContext = familyMembers.map(m =>
    `- ${m.name} (${m.role || "member"})${m.workingHours ? ` - Working hours: ${m.workingHours}` : ''}`
  ).join("\n");

  const boardMap = {};
  for (const b of boardSettings) {
    boardMap[b.title] = b;
  }

  const choresContext = chores.map((c) => {
    const board = boardMap[c.title];
    let info = `- "${c.title}" on ${c.dueDay} (ID: ${c.id})`;
    if (board?.daysPerWeek) info += ` [scheduled ${board.daysPerWeek}x/week]`;
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

  const prompt = `You are a family planner assistant. Assign family members to the following weekly chores. Each chore already has a specific day assigned — you only need to decide WHO does each one.

Family Members:
${membersContext}

Weekly Chores to Assign:
${choresContext}

Rules:
- Distribute work fairly across family members
- Consider member roles (age-appropriate tasks for kids)
- Consider working hours (lighter load for those who work)
- Respect eligibility constraints (only assign to eligible members when specified)
- Prefer the default/preferred assignee when set, but still rotate for fairness
- If the same chore appears multiple times per week, try to rotate assignees

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

  const prompt = `You are a family meal planner assistant. Help suggest meals for the family and assign cooking duties fairly.

Family Members:
${familyMembers.map((m) => `- ${m.name} (${m.role || "member"})`).join("\n")}

Existing Recipes:
${existingRecipes.map((r) => `- ${r.name} (${r.ingredients}, cook day: ${r.cookDay})`).join("\n")}

Days to fill: ${daysToFill.join(", ")}

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

  const prompt = `You are a family schedule coordinator. Suggest fair work hour distribution and event scheduling for the family week.

Family Members:
${familyMembers.map((m) => `- ${m.name} (${m.role || "member"})`).join("\n")}

Existing Events:
${existingEvents.map((e) => `- ${e.title} (${e.type} on ${e.startsAt.toDateString()})`).join("\n")}

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
