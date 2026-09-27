const schedulerStates = new Map();

function setSchedulerState(name, status) {
  schedulerStates.set(String(name), {
    name: String(name),
    status,
    updatedAt: new Date().toISOString(),
  });
}

export function markSchedulerHealthy(name) {
  setSchedulerState(name, "healthy");
}

export function markSchedulerDegraded(name) {
  setSchedulerState(name, "degraded");
}

export function markSchedulerDisabled(name) {
  setSchedulerState(name, "disabled");
}

export function getSchedulerHealthSnapshot() {
  const schedulers = [...schedulerStates.values()]
    .sort((left, right) => left.name.localeCompare(right.name, "fr"));
  return {
    degraded: schedulers.some((scheduler) => scheduler.status === "degraded"),
    schedulers,
  };
}
