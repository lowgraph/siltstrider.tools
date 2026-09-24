// Index is the number of completed steps; index zero is the starting sheet.
export function progressionState(simulation,index) {
 if (!simulation) return null;
 const completed=Math.max(0,Math.min(Math.trunc(index)||0,simulation.steps.length));
 if (!completed) return simulation.initialSheet;
 const step=simulation.steps[completed-1];
 return {...simulation.initialSheet,...step.stateAfter,level:step.nextLevel};
}
