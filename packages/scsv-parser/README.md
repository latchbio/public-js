# Structured CSV (SCSV) Values Format

Specification and parser for embedding complex typed JSON values inside CSV files and other primitive user-facing data formats.

## Contents

- [Specification](./specification.md)
- [Blog Post](./article/text.md)
- [NPM Package](https://www.npmjs.com/package/@latchbio/scsv-parser)

## Usage

Install with `yarn add @latchbio/scsv-parser` or `npm install @latchbio/scsv-parser`

```ts
import { parse, scsv } from "@latchbio/scsv-parser";

const arrayOfStrings = "a, b, c"
console.log(parse(arrayOfStrings, scsv.parse("s[]"))); // ["a", "b", "c"]
```

## Copying/License

This software is quad-licensed and downstream users are free to use any of the provided licenses.

**Available licenses:**

| Name           | Requirements | [OSI][1] Approved      | Notes                                                                  |
| -------------- | ------------ | ---------------------- | ---------------------------------------------------------------------- |
| [MIT][2]       | Attribution  | :white_check_mark: Yes | Most commonly recognized and understood                                |
| [BSD0][3]      | None         | :white_check_mark: Yes | Unencumbered license allowed at Google                                 |
| [CC0][4]       | None         | :x: No                 | Preferred way of dedicating software to the public domain              |
| [Unlicense][5] | None         | :white_check_mark: Yes | OSI approved public domain dedication. **Questionable legal standing** |

[1]: https://opensource.org/
[2]: ./MIT.LICENSE
[3]: ./BSD0.LICENSE
[4]: ./COPYING
[5]: ./UNLICENSE
