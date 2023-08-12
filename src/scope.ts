import { RuntimeError } from "./errors.ts";
import { TokenType } from "./token-type.ts";
import { Token } from "./token.ts";
import { Value } from "./value.ts";

interface Variable {
  value: Value;
  isMutable: boolean;
}

export class Scope {
  private readonly variables: Record<string, Variable> = {};

  constructor(public readonly parent: Scope | null) {}

  define(name: Token | string, value: Value, isMutable: boolean) {
    if (typeof name === "string") {
      name = { text: name, line: 0, type: TokenType.IDENTIFIER };
    }

    if (this.variables[name.text] == undefined) {
      this.variables[name.text] = { value, isMutable };
    } else {
      console.error("Error while in scope: ", this);
      throw new RuntimeError(name, `Already defined variable '${name.text}'.`);
    }
  }

  assign(name: Token, value: Value) {
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