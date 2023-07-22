import { TokenType } from "./token-type.ts";
import { Token } from "./token.ts";

export class RuntimeContext {
  hadError = false;

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

  private report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error${where}: ${message}`);
    this.hadError = true;
  }
}
