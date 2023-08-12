import { Expression } from "./expression.ts";
import { Token } from "./token.ts";

export interface StatementVisitor<T> {
  visitExpressionStatement(stmt: ExpressionStatement): T;
  visitPrint(stmt: PrintStatement): T;
  visitConstDeclaration(stms: ConstDeclarationStatement): T;
  visitMutDeclaration(stmt: MutDeclarationStatement): T;
  visitBlock(stmt: BlockStatement): T;
  visitIf(stmt: IfStatement): T;
  visitWhile(stmt: WhileStatement): T;
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
    return visitor.visitPrint(this);
  }
}

export class ConstDeclarationStatement implements Statement {
  constructor(
    public readonly name: Token,
    public readonly initializer: Expression,
  ) {}

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitConstDeclaration(this);
  }
}

export class MutDeclarationStatement implements Statement {
  constructor(
    public readonly name: Token,
    public readonly initializer: Expression | null,
  ) {}

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitMutDeclaration(this);
  }
}

export class BlockStatement implements Statement {
  constructor(public readonly statements: Statement[]) {}

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitBlock(this);
  }
}

export class IfStatement implements Statement {
  constructor(
    public readonly condition: Expression,
    public readonly thenBranch: Statement,
    public readonly elseBranch: Statement | null,
  ) {}

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitIf(this);
  }
}

export class WhileStatement implements Statement {
  constructor(
    public readonly condition: Expression,
    public readonly body: Statement,
  ) {}

  accept<T>(visitor: StatementVisitor<T>): T {
    return visitor.visitWhile(this);
  }
}
