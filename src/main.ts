import { Interpreter } from "./interpreter.ts";
import { Parser } from "./parser.ts";
import { RuntimeContext } from "./runtime-context.ts";
import { Scanner } from "./scanner.ts";

async function main(args: string[]) {
  if (args.length > 1) {
    console.log("Usage: ds <script file>");
    Deno.exit(64);
  } else if (args.length === 1) {
    await runFile(args[0]);
  } else {
    runInteractive();
  }
}

async function runFile(path: string) {
  const content = await Deno.readTextFile(path);
  const context = new RuntimeContext();
  
  run(content, context);
  
  if (context.hadError) {
    Deno.exit(65);
  }

  if (context.hadRuntimeError) {
    Deno.exit(70);
  }
}

function runInteractive() {
  const context = new RuntimeContext();

  while (true) {
    const input = prompt("> ");
    if (input != null) {
      run(input, context);
      context.hadError = false;
    } else break;
  }
}

function run(code: string, context: RuntimeContext) {
  const scanner = new Scanner(code, context)
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, context);
  const statements = parser.parse();

  if (context.hadError) {
    return;
  }

  console.log(statements);

  const interpreter = new Interpreter(context);
  interpreter.interpret(statements);
}

await main(Deno.args);
