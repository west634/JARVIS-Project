import { evaluate } from "mathjs";
import type { ToolExecutionResult } from "./types.js";

export async function calculate(args: Record<string, unknown>): Promise<ToolExecutionResult> {
  const expression = String(args.expression ?? "").trim();
  if (!expression) {
    return { contentForModel: "Error: no expression was provided." };
  }
  try {
    const result = evaluate(expression);
    return { contentForModel: `${expression} = ${result}` };
  } catch {
    return { contentForModel: `Error: "${expression}" could not be evaluated as a math expression.` };
  }
}
