import { RuntimeError } from "./errors.ts";
import { Token } from "./token.ts";

interface Variable {
  value: unknown;
  isMutable: boolean;
}

export class Scope {
  private readonly variables: Record<string, Variable> = {};

  constructor(public readonly parent: Scope | null) {}

  define(name: Token, value: unknown, isMutable: boolean) {
    if (this.variables[name.text] == undefined) {
      this.variables[name.text] = { value, isMutable };
    } else {
      console.log("SCOPE: ", this);
      throw new RuntimeError(name, `Already defined variable '${name.text}'.`);
    }
  }

  assign(name: Token, value: unknown) {
    const variable = this.variables[name.text];

    if (variable != undefined) {
      if (variable.isMutable === true) {
        variable.value = value;
      } else {
        throw new RuntimeError(name, `Assigning const variable '${name.text}'.`);
      }
    } else if (this.parent != null) {
      this.parent.assign(name, value);
    }
    else {
      throw new RuntimeError(name, `Assigning undefined variable '${name.text}'.`);
    }
  }

  get(name: Token): Variable {
    if (this.variables[name.text] != undefined) {
      return this.variables[name.text];
    } else if (this.parent != null) {
      return this.parent.get(name);
    }
    else {
      throw new RuntimeError(name, `Reading undefined variable '${name.text}'.`);
    }
  }
}