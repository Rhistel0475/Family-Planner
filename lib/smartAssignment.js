/**
 * Smart AI-powered task assignment logic
 * Distributes tasks fairly based on workload, completion history, and availability
 */

/**
 * Calculate workload score for each member
 * @param {Array} members - Family members
 * @param {Array} existingChores - Existing chores
 * @returns {Map} Map of member names to workload scores
 */
function calculateWorkload(members, existingChores) {
  const workloadMap = new Map();

  members.forEach(member => {
    const memberChores = existingChores.filter(c => c.assignedTo === member.name);
    const pendingChores = memberChores.filter(c => !c.completed);

    // Workload score: pending chores + (total chores * 0.3)
    // This balances current load with historical assignments
    const workloadScore = pendingChores.length + (memberChores.length * 0.3);

    workloadMap.set(member.name, {
      member,
      workloadScore,
      pendingCount: pendingChores.length,
      totalAssigned: memberChores.length
    });
  });

  return workloadMap;
}

/**
 * AI-based assignment: Select member with lowest workload
 * @param {Array} members - Family members
 * @param {Array} existingChores - Existing chores
 * @returns {Object} Selected member
 */
export function assignTaskAI(members, existingChores) {
  if (!members || members.length === 0) {
    return null;
  }

  // If only one member, assign to them
  if (members.length === 1) {
    return members[0];
  }

  const workloadMap = calculateWorkload(members, existingChores);

  // Sort by workload score (lowest first = least busy)
  const sortedMembers = Array.from(workloadMap.values())
    .sort((a, b) => a.workloadScore - b.workloadScore);

  // Return member with lowest workload
  return sortedMembers[0].member;
}

/**
 * Rotating assignment: Get next member in rotation
 * @param {Array} members - Family members
 * @param {Array} existingChores - Existing chores
 * @param {string} taskTitle - Task title for consistent rotation
 * @returns {Object} Selected member
 */
export function assignTaskRotate(members, existingChores, taskTitle) {
  if (!members || members.length === 0) {
    return null;
  }

  if (members.length === 1) {
    return members[0];
  }

  // Find similar tasks (same title) to determine rotation
  const similarTasks = existingChores.filter(c =>
    c.title.toLowerCase() === taskTitle.toLowerCase()
  );

  if (similarTasks.length === 0) {
    // First time: assign to first member
    return members[0];
  }

  // Get last person who did this task
  const lastAssigned = similarTasks[similarTasks.length - 1].assignedTo;
  const lastIndex = members.findIndex(m => m.name === lastAssigned);

  // Rotate to next person
  const nextIndex = (lastIndex + 1) % members.length;
  return members[nextIndex];
}

/**
 * Create chore instances for recurring task
 * @param {Object} taskData - Task data from SmartTaskModal
 * @param {Array} members - Family members
 * @param {Array} existingChores - Existing chores
 * @returns {Array} Array of chore objects to create
 */
export function createSmartTaskInstances(taskData, members, existingChores) {
  const instances = [];

  if (taskData.frequency === 'once') {
    // One-time task: Create single instance
    let assignedTo = '';

    if (taskData.assignmentMode === 'specific') {
      assignedTo = taskData.assignedTo;
    } else if (taskData.assignmentMode === 'ai') {
      const selectedMember = assignTaskAI(members, existingChores);
      assignedTo = selectedMember ? selectedMember.name : '';
    } else if (taskData.assignmentMode === 'rotate') {
      const selectedMember = assignTaskRotate(members, existingChores, taskData.title);
      assignedTo = selectedMember ? selectedMember.name : '';
    }

    instances.push({
      title: taskData.title,
      assignedTo,
      dueDay: taskData.days[0] || 'Monday',
      completed: false,
      type: taskData.type
    });
  } else if (taskData.frequency === 'weekly') {
    // Weekly recurring: Create instance for each selected day
    taskData.days.forEach(day => {
      let assignedTo = '';

      if (taskData.assignmentMode === 'specific') {
        assignedTo = taskData.assignedTo;
      } else if (taskData.assignmentMode === 'ai') {
        // For multiple days, distribute across members
        const selectedMember = assignTaskAI(members, [...existingChores, ...instances]);
        assignedTo = selectedMember ? selectedMember.name : '';
      } else if (taskData.assignmentMode === 'rotate') {
        const selectedMember = assignTaskRotate(members, [...existingChores, ...instances], taskData.title);
        assignedTo = selectedMember ? selectedMember.name : '';
      }

      instances.push({
        title: taskData.title,
        assignedTo,
        dueDay: day,
        completed: false,
        isRecurring: true,
        recurrencePattern: 'WEEKLY',
        recurrenceInterval: taskData.recurrenceInterval || 1,
        type: taskData.type
      });
    });
  } else if (taskData.frequency === 'daily') {
    // Daily: Create for every day
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
      let assignedTo = '';

      if (taskData.assignmentMode === 'specific') {
        assignedTo = taskData.assignedTo;
      } else if (taskData.assignmentMode === 'ai') {
        const selectedMember = assignTaskAI(members, [...existingChores, ...instances]);
        assignedTo = selectedMember ? selectedMember.name : '';
      } else if (taskData.assignmentMode === 'rotate') {
        const selectedMember = assignTaskRotate(members, [...existingChores, ...instances], taskData.title);
        assignedTo = selectedMember ? selectedMember.name : '';
      }

      instances.push({
        title: taskData.title,
        assignedTo,
        dueDay: day,
        completed: false,
        isRecurring: true,
        recurrencePattern: 'DAILY',
        recurrenceInterval: 1,
        type: taskData.type
      });
    });
  } else if (taskData.frequency === 'monthly') {
    // Monthly: Create for first day of month (or specified day)
    let assignedTo = '';

    if (taskData.assignmentMode === 'specific') {
      assignedTo = taskData.assignedTo;
    } else if (taskData.assignmentMode === 'ai') {
      const selectedMember = assignTaskAI(members, existingChores);
      assignedTo = selectedMember ? selectedMember.name : '';
    } else if (taskData.assignmentMode === 'rotate') {
      const selectedMember = assignTaskRotate(members, existingChores, taskData.title);
      assignedTo = selectedMember ? selectedMember.name : '';
    }

    instances.push({
      title: taskData.title,
      assignedTo,
      dueDay: taskData.days[0] || 'Monday',
      completed: false,
      isRecurring: true,
      recurrencePattern: 'MONTHLY',
      recurrenceInterval: 1,
      type: taskData.type
    });
  }

  return instances;
}

/**
 * Get assignment summary for preview
 * @param {Array} instances - Task instances
 * @returns {string} Human-readable summary
 */
export function getAssignmentSummary(instances) {
  if (instances.length === 0) return 'No tasks';
  if (instances.length === 1) {
    return `${instances[0].assignedTo} on ${instances[0].dueDay}`;
  }

  const memberCounts = {};
  instances.forEach(inst => {
    memberCounts[inst.assignedTo] = (memberCounts[inst.assignedTo] || 0) + 1;
  });

  const summary = Object.entries(memberCounts)
    .map(([name, count]) => `${name} (${count}x)`)
    .join(', ');

  return summary;
}
