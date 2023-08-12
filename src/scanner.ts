import { RuntimeContext } from "./runtime-context.ts";
import { TokenType } from "./token-type.ts";
import { Token } from "./token.ts";

export class Scanner {
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;

  constructor(private code: string, private context: RuntimeContext) {}

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({ type: TokenType.EOF, text: "", line: this.line });
    return this.tokens;
  }

  private scanToken() {
    const char = this.advance();

    switch (char) {
      case " ":
      case "\r":
      case "\t":
        break;
      case "\n":
        this.line++;
        break;
      case '"':
        this.stringLiteral();
        break;
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case ";":
        this.addToken(TokenType.SEMICOLON);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case "/":
        if (this.match("/")) {
          // Comment
          while (this.peek() != "\n" && !this.isAtEnd()) {
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      default:
        if (this.isDigit(char)) {
          this.numberLiteral();
        } else if (this.isAlpha(char)) {
          this.identifier();
        } else {
          this.context.errorAtLine(this.line, `Unexpected character: ${char}`);
        }
        break;
    }
  }

  private isAtEnd = () => this.current >= this.code.length;

  private advance = (): string => this.code.charAt(this.current++);

  private peek = (): string | null => !this.isAtEnd() ? this.code.charAt(this.current) : null;

  private peekNext(): string | null {
    if (this.current + 1 >= this.code.length) return null;
    return this.code.charAt(this.current + 1);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd() || this.code.charAt(this.current) != expected) {
      return false;
    } else {
      this.current++;
      return true;
    }
  }

  private addToken = (type: TokenType, literal?: string | number) => {
    const text = this.code.substring(this.start, this.current);
    this.tokens.push({
      type,
      text,
      literal,
      line: this.line,
    });
  };

  private stringLiteral() {
    while (this.peek() != '"' && !this.isAtEnd()) {
      if (this.peek() == "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      this.context.errorAtLine(this.line, "Unterminated string.");
      return;
    }

    this.advance();

    const literal = this.code.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, literal);
  }

  private numberLiteral() {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() == "." && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const text = this.code.substring(this.start, this.current);
    this.addToken(TokenType.NUMBER, Number(text));
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.code.substring(this.start, this.current);
    const keyword = keywords[text];

    this.addToken(keyword != undefined ? keyword : TokenType.IDENTIFIER);
  }

  private isDigit(char: string | null) {
    if (char == null || char.length !== 1) {
      return false;
    }

    const code = char.charCodeAt(0);

    return (code > 47 && code < 58);
  }

  private isAlpha(char: string | null) {
    if (char == null || char.length !== 1) {
      return false;
    }

    const code = char.charCodeAt(0);

    return (code > 64 && code < 91) || (code > 96 && code < 123) || char === "_";
  }

  private isAlphaNumeric(char: string | null) {
    if (char == null || char.length !== 1) {
      return false;
    }

    const code = char.charCodeAt(0);

    return (code > 47 && code < 58) ||
      (code > 64 && code < 91) ||
      (code > 96 && code < 123) ||
      char === "_";
  }
}

const keywords: Record<string, TokenType> = {
  and: TokenType.AND,
  break: TokenType.BREAK,
  class: TokenType.CLASS,
  const: TokenType.CONST,
  else: TokenType.ELSE,
  false: TokenType.FALSE,
  for: TokenType.FOR,
  fun: TokenType.FUN,
  if: TokenType.IF,
  mut: TokenType.MUT,
  null: TokenType.NULL,
  or: TokenType.OR,
  print: TokenType.PRINT,
  return: TokenType.RETURN,
  super: TokenType.SUPER,
  this: TokenType.THIS,
  true: TokenType.TRUE,
  while: TokenType.WHILE,
} as const;
