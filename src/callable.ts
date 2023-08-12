import { Interpreter } from "./interpreter.ts";
import { Value } from "./value.ts";

export interface Callable {
  arity(): number;
  call(interpreter: Interpreter, args: Value[]): Value;
}