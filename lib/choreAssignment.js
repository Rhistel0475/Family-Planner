// Simple rule-based chore assignment when AI is not available
import { parseEligibleMembers } from './choreTemplates';

export function assignChoresRuleBased(members, chores) {
  // Sort members by role priority (parents first, then kids)
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { parent: 0, member: 1, kid: 2 };
    return (roleOrder[a.role] || 1) - (roleOrder[b.role] || 1);
  });

  // Calculate workload (assign fewer tasks to those with working hours)
  const memberWorkload = {};
  sortedMembers.forEach(m => {
    memberWorkload[m.name] = 0;
  });

  const suggestions = chores.map((chore, index) => {
    // Get eligible members for this chore
    let candidateMembers = sortedMembers;
    let isEligibilityConstrained = false;
    
    // If eligibleMemberIds is set, filter to only eligible members
    if (chore.eligibleMemberIds) {
      const eligibleIds = parseEligibleMembers(chore.eligibleMemberIds);
      if (eligibleIds.length > 0) {
        candidateMembers = sortedMembers.filter(m => eligibleIds.includes(m.id));
        isEligibilityConstrained = true;
      }
    }

    // If no eligible members found, return error
    if (candidateMembers.length === 0) {
      return {
        choreId: chore.id,
        choreTitle: chore.title,
        error: 'No eligible members available for this chore',
        suggestedAssignee: null,
        reasoning: 'Eligibility constraint exists but no members match criteria'
      };
    }

    // Round-robin assignment with workload consideration
    let selectedMember;
    
    // Prefer members without working hours or with less workload
    const availableMembers = candidateMembers.filter(m => !m.workingHours);
    
    if (availableMembers.length > 0) {
      // Pick member with least workload from available
      selectedMember = availableMembers.reduce((min, m) => 
        (memberWorkload[m.name] < memberWorkload[min.name]) ? m : min
      );
    } else {
      // All have working hours, distribute evenly
      selectedMember = candidateMembers.reduce((min, m) => 
        (memberWorkload[m.name] < memberWorkload[min.name]) ? m : min
      );
    }

    memberWorkload[selectedMember.name]++;

    // Generate reasoning
    let reasoning = `Fair distribution based on ${selectedMember.role} role`;
    if (isEligibilityConstrained) {
      reasoning = `Among eligible members: lowest workload (${selectedMember.name})`;
    } else if (selectedMember.workingHours) {
      reasoning = `Assigned despite work schedule (${selectedMember.workingHours}) for balance`;
    } else {
      reasoning = `Available and has lighter workload`;
    }

    return {
      choreId: chore.id,
      choreTitle: chore.title,
      suggestedAssignee: selectedMember.name,
      reasoning
    };
  });

  return { suggestions };
}
