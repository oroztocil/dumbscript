import { ParserError } from "./errors.ts";
import {
  BinaryExpr,
  Expression,
  LiteralExpr,
  LogicalExpr,
  MutAssignmentExpr,
  ParenExpr,
  UnaryExpr,
  VariableExpr,
} from "./expression.ts";
import { RuntimeContext } from "./runtime-context.ts";
import {
  BlockStatement,
  ConstDeclarationStatement,
  ExpressionStatement,
  IfStatement,
  MutDeclarationStatement,
  PrintStatement,
  Statement,
  WhileStatement,
} from "./statement.ts";
import { TokenType } from "./token-type.ts";
import { Token } from "./token.ts";

export class Parser {
  constructor(
    private readonly tokens: Token[],
    private readonly context: RuntimeContext,
    private current: number = 0,
  ) {}

  parse(): Statement[] {
    const statements: Statement[] = [];
    try {
      while (!this.isAtEnd()) {
        const stmt = this.declaration();

        if (stmt != null) {
          statements.push(stmt);
        }
      }
    } catch {
      return statements;
    }
    return statements;
  }

  private declaration(): Statement | null {
    try {
      if (this.match(TokenType.MUT)) {
        return this.mutDeclaration();
      } else if (this.match(TokenType.CONST)) {
        return this.constDeclaration();
      }

      return this.statement();
    } catch (err) {
      if (err instanceof ParserError) {
        this.synchronize();
      }

      return null;
    }
  }

  private statement(): Statement {
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }

    if (this.match(TokenType.FOR)) {
      return this.forStatement();
    }

    if (this.match(TokenType.PRINT)) {
      return this.print();
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      const statements = this.block();
      return new BlockStatement(statements);
    }

    return this.expressionStatement();
  }

  private block(): Statement[] {
    const statements: Statement[] = [];

    while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt != null) {
        statements.push(stmt);
      }
    }

    this.consume(TokenType.RIGHT_BRACE, "Expected '}' after block.");
    return statements;
  }

  private expressionStatement() {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after expression statement.");
    return new ExpressionStatement(expr);
  }

  private ifStatement(): IfStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'if'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after 'if' condition.");

    const thenBranch = this.statement();
    const elseBranch = this.match(TokenType.ELSE) ? this.statement() : null;

    return new IfStatement(condition, thenBranch, elseBranch);
  }

  private whileStatement(): WhileStatement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'while'.");
    const condition = this.expression();
    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after 'while' condition.");

    const body = this.statement();

    return new WhileStatement(condition, body);
  }

  private forStatement(): Statement {
    this.consume(TokenType.LEFT_PAREN, "Expected '(' after 'for'.");
    const initializer = this.match(TokenType.MUT)
      ? this.mutDeclaration()
      : !this.match(TokenType.SEMICOLON)
      ? this.expressionStatement()
      : null;

    const condition = !this.check(TokenType.SEMICOLON) ? this.expression() : new LiteralExpr(true);

    this.consume(TokenType.SEMICOLON, "Expected ';' after 'for' loop condition.");

    const increment = !this.check(TokenType.RIGHT_PAREN) ? this.expression() : null;

    this.consume(TokenType.RIGHT_PAREN, "Expected ')' after 'for' loop increment expression.");

    let body: Statement = this.statement();

    if (increment != null) {
      body = new BlockStatement([body, new ExpressionStatement(increment)]);
    }

    body = new WhileStatement(condition, body);

    if (initializer != null) {
      body = new BlockStatement([initializer, body]);
    }

    return body;
  }

  private print(): PrintStatement {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after print value.");
    return new PrintStatement(expr);
  }

  private constDeclaration(): ConstDeclarationStatement {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name.");
    this.consume(TokenType.EQUAL, "Const variable must be initialized.");
    const initializer = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration.");

    return new ConstDeclarationStatement(name, initializer);
  }

  private mutDeclaration(): MutDeclarationStatement {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name.");
    const initializer = this.match(TokenType.EQUAL) ? this.expression() : null;

    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration.");
    return new MutDeclarationStatement(name, initializer);
  }

  private mutAssignment(): Expression {
    const expr = this.or();

    if (this.match(TokenType.EQUAL)) {
      const equals = this.previous();
      const value = this.mutAssignment();

      if (expr instanceof VariableExpr) {
        const name = expr.name;
        return new MutAssignmentExpr(name, value);
      }

      throw this.error(equals, "Invalid assignment target.");
    }

    return expr;
  }

  private expression(): Expression {
    return this.mutAssignment();
  }

  private or(): Expression {
    let expr: Expression = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();
      expr = new LogicalExpr(operator, expr, right);
    }

    return expr;
  }

  private and(): Expression {
    let expr: Expression = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.equality();
      expr = new LogicalExpr(operator, expr, right);
    }

    return expr;
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
    if (this.match(TokenType.NULL)) return new LiteralExpr(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpr(this.previous().literal!);
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new VariableExpr(this.previous());
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
        case TokenType.MUT:
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
    return new ParserError();
  }
}
