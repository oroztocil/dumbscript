import { BinaryExpr, Expression, LiteralExpr, ParenExpr, UnaryExpr } from "./expressions.ts";
import { RuntimeContext } from "./runtime-context.ts";
import { TokenType } from "./token-type.ts";
import { Token } from "./token.ts";

export class Parser {
  constructor(
    private readonly tokens: Token[],
    private readonly context: RuntimeContext,
    private current: number = 0,
  ) {}

  parse(): Expression | null {
    try {
      return this.expression();
    } catch {
      return null;
    }
  }

  private expression(): Expression {
    return this.equality();
  }

  private equality(): Expression {
    let expr: Expression = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpr(operator, expr, right);
    }

    return expr;
  }

  private comparison(): Expression {
    let expr: Expression = this.term();

    while (
      this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)
    ) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpr(operator, expr, right);
    }

    return expr;
  }

  private term(): Expression {
    let expr: Expression = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpr(operator, expr, right);
    }

    return expr;
  }

  private factor(): Expression {
    let expr: Expression = this.unary();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpr(operator, expr, right);
    }

    return expr;
  }

  private unary(): Expression {
    if (this.match(TokenType.BANG, TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpr(operator, right);
    }

    return this.literal();
    // throw this.error(this.peek(), "Function calls not implemented.");
  }

  private literal(): Expression {
    if (this.match(TokenType.FALSE)) return new LiteralExpr(false);
    if (this.match(TokenType.TRUE)) return new LiteralExpr(true);
    if (this.match(TokenType.NIL)) return new LiteralExpr(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpr(this.previous().literal!);
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expected ')' after expression.");
      return new ParenExpr(expr);
    }

    throw this.error(this.peek(), "Expected expression.");
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    } else {
      throw this.error(this.peek(), message);
    }
  }

  private match(...tokenTypes: TokenType[]): boolean {
    for (const type of tokenTypes) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    } else {
      return this.peek().type == type;
    }
  }

  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }

    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) {
        return;
      }

      switch (this.peek().type) {
        case TokenType.CLASS:
        case TokenType.FUN:
        case TokenType.VAR:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.PRINT:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  private error(token: Token, message: string) {
    this.context.errorAtToken(token, message);
    return new Error();
  }
}
