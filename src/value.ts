import { Callable } from "./callable.ts";

export type Value = boolean | number | string | null | Callable;// | { [prop: string]: ValueType };
