import { TokenType } from "./token-type.ts";

export interface Token {
    type: TokenType;
    text: string;
    literal?: string | number;
    line: number;
}