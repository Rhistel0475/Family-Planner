// Rule-based chore assignment when AI is not available
import { parseEligibleMembers } from './choreTemplates';

const COMPLEX_CHORE_KEYWORDS = [
  'cook', 'mow', 'lawn', 'power tool', 'drive', 'grocery', 'iron',
  'wash car', 'babysit', 'repair', 'fix'
];

const CHORE_ABILITY_MAP = {
  'mow': 'Can mow lawn',
  'lawn': 'Can mow lawn',
  'cook': 'Can cook',
  'laundry': 'Can do laundry',
  'dishes': 'Can wash dishes',
  'dish': 'Can wash dishes',
  'vacuum': 'Can vacuum',
  'bathroom': 'Can clean bathrooms',
  'trash': 'Can take out trash',
  'sweep': 'Can sweep/mop',
  'mop': 'Can sweep/mop',
  'yard': 'Can do yard work',
  'grocery': 'Can grocery shop',
  'pet': 'Can pet care',
  'iron': 'Can iron clothes',
  'car': 'Can wash car'
};

function isAgeAppropriate(member, choreTitle) {
  const age = member.age;
  if (age === null || age === undefined) return true;
  const titleLower = choreTitle.toLowerCase();
  if (age < 5) return false;
  if (age < 8) {
    return !COMPLEX_CHORE_KEYWORDS.some(kw => titleLower.includes(kw));
  }
  if (age < 13) {
    const hardTasks = ['drive', 'power tool', 'mow', 'babysit'];
    return !hardTasks.some(kw => titleLower.includes(kw));
  }
  return true;
}

function hasRequiredAbility(member, choreTitle) {
  if (!member.abilities || member.abilities.length === 0) return true;
  const titleLower = choreTitle.toLowerCase();
  for (const [keyword, ability] of Object.entries(CHORE_ABILITY_MAP)) {
    if (titleLower.includes(keyword)) {
      return member.abilities.includes(ability);
    }
  }
  return true;
}

function isAvailableOnDay(member, dueDay) {
  if (!member.availability) return true;
  const dayLower = dueDay ? dueDay.toLowerCase() : null;
  if (!dayLower) return true;
  const dayData = member.availability[dayLower];
  if (!dayData) return true;
  return dayData.available !== false;
}

function prefersChore(member, choreTitle) {
  if (!member.chorePreferences) return 0;
  const titleLower = choreTitle.toLowerCase();
  const likes = (member.chorePreferences.likes || []).map(l => l.toLowerCase());
  const dislikes = (member.chorePreferences.dislikes || []).map(d => d.toLowerCase());
  if (likes.some(l => titleLower.includes(l))) return 1;
  if (dislikes.some(d => titleLower.includes(d))) return -1;
  return 0;
}

export function assignChoresRuleBased(members, chores) {
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { parent: 0, member: 1, teen: 1, kid: 2, grandparent: 2 };
    return (roleOrder[a.role] || 1) - (roleOrder[b.role] || 1);
  });

  const memberWorkload = {};
  sortedMembers.forEach(m => { memberWorkload[m.name] = 0; });

  const suggestions = chores.map((chore) => {
    let candidateMembers = sortedMembers;
    let isEligibilityConstrained = false;

    if (chore.eligibleMemberIds) {
      const eligibleIds = parseEligibleMembers(chore.eligibleMemberIds);
      if (eligibleIds.length > 0) {
        candidateMembers = sortedMembers.filter(m => eligibleIds.includes(m.id));
        isEligibilityConstrained = true;
      }
    }

    // Filter by age-appropriateness
    candidateMembers = candidateMembers.filter(m => isAgeAppropriate(m, chore.title));

    // Filter by required ability (only if member has abilities listed)
    candidateMembers = candidateMembers.filter(m => hasRequiredAbility(m, chore.title));

    // Filter by availability on the due day
    candidateMembers = candidateMembers.filter(m => isAvailableOnDay(m, chore.dueDay));

    if (candidateMembers.length === 0) {
      // Fallback: relax availability filter
      candidateMembers = sortedMembers.filter(m => isAgeAppropriate(m, chore.title));
      if (candidateMembers.length === 0) {
        candidateMembers = sortedMembers;
      }
    }

    if (candidateMembers.length === 0) {
      return {
        choreId: chore.id,
        choreTitle: chore.title,
        error: 'No eligible members available for this chore',
        suggestedAssignee: null,
        reasoning: 'No members match criteria'
      };
    }

    // Score candidates: lower = better
    const scored = candidateMembers.map(m => {
      let score = memberWorkload[m.name] * 10;
      if (m.workingHours) score += 3;
      score -= prefersChore(m, chore.title) * 5;
      return { member: m, score };
    });

    scored.sort((a, b) => a.score - b.score);
    const selectedMember = scored[0].member;
    memberWorkload[selectedMember.name]++;

    let reasoning = `Fair distribution (workload: ${memberWorkload[selectedMember.name]})`;
    const pref = prefersChore(selectedMember, chore.title);
    if (pref > 0) reasoning += '; matches preference';
    if (isEligibilityConstrained) reasoning = `Among eligible members; ${reasoning}`;

    return {
      choreId: chore.id,
      choreTitle: chore.title,
      suggestedAssignee: selectedMember.name,
      reasoning
    };
  });

  return { suggestions };
}
