import type { NodeRecord } from "../shared/types/node.types.js";
import { NodeExecutionError } from "../shared/errors.js";
import { executeWorkflow } from "./workflow.engine.js";

export function executeActions(node: NodeRecord): string[] {
  const results: string[] = [];
  const actions = node.actions ?? [];

  for (const action of actions) {
    switch (action.type) {
      case "set_data": {
        const key = String(action.input?.key ?? "");
        if (node.data) node.data[key] = action.input?.value;
        results.push(`set_data:${key}`);
        break;
      }
      case "run_workflow": {
        const workflowEvents = executeWorkflow(node);
        results.push(...workflowEvents.map((x) => `workflow:${x}`));
        break;
      }
      case "emit_log": {
        results.push(`emit_log:${action.name}`);
        break;
      }
      default:
        throw new NodeExecutionError(`Unsupported action type: ${action.type}`);
    }
  }

  return results;
}
