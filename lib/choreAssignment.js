// Simple rule-based chore assignment when AI is not available

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
    // Round-robin assignment with workload consideration
    let selectedMember;
    
    // Prefer members without working hours or with less workload
    const availableMembers = sortedMembers.filter(m => !m.workingHours);
    
    if (availableMembers.length > 0) {
      // Pick member with least workload from available
      selectedMember = availableMembers.reduce((min, m) => 
        (memberWorkload[m.name] < memberWorkload[min.name]) ? m : min
      );
    } else {
      // All have working hours, distribute evenly
      selectedMember = sortedMembers.reduce((min, m) => 
        (memberWorkload[m.name] < memberWorkload[min.name]) ? m : min
      );
    }

    memberWorkload[selectedMember.name]++;

    // Generate reasoning
    let reasoning = `Fair distribution based on ${selectedMember.role} role`;
    if (selectedMember.workingHours) {
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
