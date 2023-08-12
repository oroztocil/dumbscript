## Script execution

```bash
deno run --allow-read ./src/main.ts ./src/scripts/script.ds
```

## Type mapping

- any -> any, Record<string, unknown>?
- nil -> null
- bool -> boolean
- number -> number
- string -> string