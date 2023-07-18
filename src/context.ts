export class Context {
  hadError = false;

  error(line: number, message: string) {
    console.error(`[line ${line}] Error: ${message}`);
    this.hadError = true;
  }
}
