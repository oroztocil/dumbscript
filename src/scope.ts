import { RuntimeError } from "./errors.ts";
import { Token } from "./token.ts";

export class Scope {
  private readonly variables: Record<string, unknown> = {};

  define(name: string, value: unknown) {
    this.variables[name] = value;
  }

  get(name: Token): unknown {
    if (this.variables[name.text] != undefined) {
      return this.variables[name.text];
    } else {
      throw new RuntimeError(name, `Undefined variable '${name.text}'.`);
    }
  }
}