import { RuntimeError } from "./errors.ts";
import { TokenType } from "./token-type.ts";
import { Token } from "./token.ts";

export class RuntimeContext {
  hadError = false;

  hadRuntimeError = false;

  errorAtLine(line: number, message: string) {
    this.report(line, "", message);
  }

  errorAtToken(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      this.report(token.line, " at end", message);
    } else {
      this.report(token.line, ` at token '${token.text}'`, message);
    }
  }

  runtimeError(error: RuntimeError) {
    this.hadRuntimeError = true;
    console.error(`${error.message}\n[line ${error.token.line}]`);
  }

  private report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}: ${message}`);
    this.hadError = true;
  }
}
