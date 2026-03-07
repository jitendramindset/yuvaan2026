import type { NodeRecord } from "../shared/types/node.types.js";

interface WorkflowStep {
  trigger: string;
  action: string;
}

export function executeWorkflow(node: NodeRecord): string[] {
  const steps = (node.steps as WorkflowStep[] | undefined) ?? [];
  const events: string[] = [];

  for (const step of steps) {
    events.push(`trigger=${step.trigger} action=${step.action}`);
  }

  return events;
}
