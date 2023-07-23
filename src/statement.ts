import { Expression } from "./expression.ts";

export interface StatementVisitor<T> {
  visitExpressionStatement(stmt: ExpressionStatement): T;
  visitPrintStatement(stmt: PrintStatement): T;
}

export interface Statement {
  accept<T>(visitor: StatementVisitor<T>): T;
}

export class ExpressionStatement implements Statement {
  constructor(public readonly expr: Expression) {}

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitExpressionStatement(this);
  }
}

export class PrintStatement implements Statement {
  constructor(public readonly expr: Expression) {}
  
  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitPrintStatement(this);
  }
}
