import { Token } from "./token.ts";

export class ParserError extends Error {}

export class RuntimeError extends Error {
  constructor(
    public readonly token: Token,
    message: string,
  ) {
    super(message);
  }
}
