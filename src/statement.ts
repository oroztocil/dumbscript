import { Expression } from "./expression.ts";
import { Token } from "./token.ts";

export interface StatementVisitor<T> {
  visitExpressionStatement(stmt: ExpressionStatement): T;
  visitPrintStatement(stmt: PrintStatement): T;
  visitDeclarationStatement(stmt: DeclarationStatement): T;
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

export class DeclarationStatement implements Statement {
  constructor(
    public readonly name: Token,
    public readonly initializer: Expression | null) {}
  
  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitDeclarationStatement(this);
  }
}
