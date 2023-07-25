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
  const interpreter = new Interpreter(context);

  run(content, interpreter, context);

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
      const interpreter = new Interpreter(context);

      run(input, interpreter, context);

      context.hadError = false;
    } else break;
  }
}

function run(code: string, interpreter: Interpreter, context: RuntimeContext) {
  const scanner = new Scanner(code, context)
  const tokens = scanner.scanTokens();
  const parser = new Parser(tokens, context);
  const statements = parser.parse();

  if (context.hadError) {
    return;
  }

  console.log(statements);

  interpreter.interpret(statements);
}

await main(Deno.args);
