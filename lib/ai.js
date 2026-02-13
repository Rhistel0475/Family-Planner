import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function generateChoreAssignments(familyMembers, unassignedChores) {
  const membersContext = familyMembers.map(m => 
    `- ${m.name} (${m.role || "member"})${m.workingHours ? ` - Working hours: ${m.workingHours}` : ''}`
  ).join("\n");

  const prompt = `You are a family planner assistant. Given the following family members and unassigned chores, suggest fair and practical chore assignments considering balance, working hours, and preferences.

Family Members:
${membersContext}

Unassigned Chores:
${unassignedChores.map((c) => `- ${c.title} (due: ${c.dueDay})`).join("\n")}

Consider:
- Fair distribution of work
- Member roles (parents vs kids - give age-appropriate tasks to kids)
- Working hours (assign fewer/easier tasks to those with work commitments)
- Balance across the week

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
    model: "claude-3-5-sonnet-20240620",
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

export async function generateMealPlan(familyMembers, existingRecipes, daysToFill) {
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
    model: "claude-3-5-sonnet-20240620",
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
    model: "claude-3-5-sonnet-20240620",
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
