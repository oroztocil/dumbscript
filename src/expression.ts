import { Token } from "./token.ts";

export interface ExpressionVisitor<T> {
  visitBinaryExpr(expr: BinaryExpr): T;
  visitLogicalExpr(expr: LogicalExpr): T;
  visitLiteralExpr(expr: LiteralExpr): T;
  visitParenExpr(expr: ParenExpr): T;
  visitUnaryExpr(expr: UnaryExpr): T;
  visitVariableExpr(expr: VariableExpr): T;
  visitMutAssignment(stmt: MutAssignmentExpr): T;
}

export interface Expression {
  accept<T>(visitor: ExpressionVisitor<T>): T;
}

export class BinaryExpr implements Expression {
  constructor(
    public readonly operator: Token,
    public readonly left: Expression,
    public readonly right: Expression,
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitBinaryExpr(this);
  }
}

export class LogicalExpr implements Expression {
  constructor(
    public readonly operator: Token,
    public readonly left: Expression,
    public readonly right: Expression,
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLogicalExpr(this);
  }
}

export class LiteralExpr implements Expression {
  constructor(public readonly value: string | number | boolean | null) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitLiteralExpr(this);
  }
}

export class VariableExpr implements Expression {
  constructor(public readonly name: Token) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitVariableExpr(this);
  }
}

export class ParenExpr implements Expression {
  constructor(
    public readonly innerExpr: Expression,
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitParenExpr(this);
  }
}

export class UnaryExpr implements Expression {
  constructor(
    public readonly operator: Token,
    public readonly right: Expression,
  ) {}

  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitUnaryExpr(this);
  }
}

export class MutAssignmentExpr implements Expression {
  constructor(
    public readonly name: Token,
    public readonly value: Expression) {}
  
  accept<T>(visitor: ExpressionVisitor<T>): T {
    return visitor.visitMutAssignment(this);
  }
}
