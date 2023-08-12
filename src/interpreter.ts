import { RuntimeError } from "./errors.ts";
import {
  BinaryExpr,
  Expression,
  ExpressionVisitor,
  LiteralExpr,
  MutAssignmentExpr,
  ParenExpr,
  UnaryExpr,
  VariableExpr,
} from "./expression.ts";
import { RuntimeContext } from "./runtime-context.ts";
import { Scope } from "./scope.ts";
import {
  BlockStatement,
  ConstDeclarationStatement,
  ExpressionStatement,
  IfStatement,
  MutDeclarationStatement,
  PrintStatement,
  Statement,
  StatementVisitor,
  WhileStatement,
} from "./statement.ts";
import { TokenType } from "./token-type.ts";
import { Token } from "./token.ts";

export class Interpreter implements ExpressionVisitor<unknown>, StatementVisitor<unknown> {
  private readonly globalScope = new Scope(null);
  private currentScope = this.globalScope;

  constructor(private readonly context: RuntimeContext) {}

  interpret(statements: Statement[]) {
    try {
      for (const stmt of statements) {
        this.execute(stmt);
      }
    } catch (err) {
      this.context.runtimeError(err);
    }
  }

  visitBlock(stmt: BlockStatement): unknown {
    this.executeBlock(stmt.statements, new Scope(this.currentScope));
    return null;
  }

  visitExpressionStatement(stmt: ExpressionStatement): unknown {
    this.evaluate(stmt.expr);
    return null;
  }

  visitIf(stmt: IfStatement): unknown {
    if (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.thenBranch);
    } else if (stmt.elseBranch != null) {
      this.execute(stmt.elseBranch);
    }

    return null;
  }

  visitWhile(stmt: WhileStatement): unknown {
    while (this.isTruthy(this.evaluate(stmt.condition))) {
      this.execute(stmt.body);
    }

    return null;
  }

  visitPrint(stmt: PrintStatement): unknown {
    const value = this.evaluate(stmt.expr);
    console.log(value);
    return null;
  }

  visitConstDeclaration(stmt: ConstDeclarationStatement): unknown {
    const value = this.evaluate(stmt.initializer);
    this.currentScope.define(stmt.name, value, false);
    return null;
  }

  visitMutDeclaration(stmt: MutDeclarationStatement): unknown {
    const value = stmt.initializer != null ? this.evaluate(stmt.initializer) : null;

    this.currentScope.define(stmt.name, value, true);
    return null;
  }

  visitMutAssignment(expr: MutAssignmentExpr): unknown {
    const value = this.evaluate(expr.value);
    this.currentScope.assign(expr.name, value);
    return value;
  }

  visitVariableExpr(expr: VariableExpr): unknown {
    return this.currentScope.get(expr.name).value;
  }

  visitBinaryExpr(expr: BinaryExpr): unknown {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) - Number(right);
      case TokenType.PLUS:
        if (typeof left === "string" && typeof right === "string") {
          return left + right;
        } else if (typeof left === "string" && typeof right === "number") {
          return left + right.toString();
        } else if (typeof left === "number" && typeof right === "string") {
          return left.toString() + right;
        } else if (typeof left === "number" && typeof right === "number") {
          return Number(left) + Number(right);
        } else {
          throw new RuntimeError(expr.operator, "Operands must be two numbers or two strings.");
        }
      case TokenType.SLASH:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) / Number(right);
      case TokenType.STAR:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) * Number(right);
      case TokenType.GREATER:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) > Number(right);
      case TokenType.GREATER_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) >= Number(right);
      case TokenType.LESS:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) < Number(right);
      case TokenType.LESS_EQUAL:
        this.checkNumberOperands(expr.operator, left, right);
        return Number(left) <= Number(right);
      case TokenType.BANG_EQUAL:
        return !this.isEqual(left, right);
      case TokenType.EQUAL_EQUAL:
        return this.isEqual(left, right);
    }

    return null;
  }

  visitLiteralExpr(expr: LiteralExpr): unknown {
    return expr.value;
  }

  visitParenExpr(expr: ParenExpr): unknown {
    return this.evaluate(expr.innerExpr);
  }

  visitUnaryExpr(expr: UnaryExpr): unknown {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.MINUS:
        return -Number(right);
      case TokenType.BANG:
        return !this.isTruthy(right);
    }

    return null;
  }

  private execute(stmt: Statement) {
    stmt.accept(this);
  }

  private executeBlock(statements: Statement[], blockScope: Scope) {
    const prevScope = this.currentScope;

    try {
      this.currentScope = blockScope;
      for (const stmt of statements) {
        this.execute(stmt);
      }
    } finally {
      this.currentScope = prevScope;
    }
  }

  private evaluate(expr: Expression): unknown {
    return expr.accept(this);
  }

  private isTruthy(value: unknown): boolean {
    if (value == null) {
      return false;
    } else if (typeof value === "boolean") {
      return Boolean(value);
    } else {
      return true;
    }
  }

  private isEqual(a: unknown, b: unknown): boolean {
    return a === b;
  }

  private checkNumberOperands(operator: Token, ...operands: unknown[]) {
    if (operands.some((op) => typeof op !== "number")) {
      throw new RuntimeError(operator, "Operand must be a number.");
    }
  }
}
