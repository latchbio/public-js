# Latch Bio Public JavaScript Modules

- [SCSV Parser](./packages/scsv-parser) - Specification and parser for embedding complex typed JSON values inside CSV files and other primitive user-facing data formats

## Structured CSV (SCSV) Values Format

<p align="center">
  <img src= "./packages/scsv-parser/logo.png">
</p>

Specification and parser for embedding complex typed JSON values inside CSV files and other primitive user-facing data formats.

### Contents

- [Blog Post](./packages/scsv-parser/article/text.md)
- [NPM Package](https://www.npmjs.com/package/@latchbio/scsv-parser)

### Usage

Install with `yarn add @latchbio/scsv-parser` or `npm install @latchbio/scsv-parser`

```ts
import { parse, scsv } from "@latchbio/scsv-parser";

const arrayOfStrings = "a, b, c"
console.log(parse(arrayOfStrings, scsv.parse("s[]"))); // ["a", "b", "c"]
```

### Motivation

The CSV file format, its derivatives such as TSV and ad-hoc ``txt'' tables, as well as compatible standards such as
XLSX and other spreadsheet save files, are the most commonly used ways of storing and transferring generic data in
bioinformatics. These formats are dominant due to their simplicity and the abundance of compatible user-friendly editing software.
Ingesting CSV files is thus a necessity for all bioinformatics software.

One common use case for CSV files is for representing batched processing runs where the columns of the table
represent the parameters of the analysis and each row represents an instance of the analysis. For scalar parameter types
(e.g. strings, numbers, booleans, paths, etc.) CSV has sufficient support since it allows escaping its control characters
(commas and quotation marks). Even though this feature is known only to a small fraction of people using CSVs and files containing
escapes quickly become verbose and confusing (`""""` is the escaped `"` string), every tabular editor used in practice is capable of
automatically escaping and un-escaping values so users need not be concerned with it. Some analyses, however, use non-scalar types—most commonly
sequences (arrays, lists, representations of sets, etc.) and associative maps (dictionaries, objects, etc.). In these cases it is natural
to use JSON strings as an embedded format using CSV escapes. In practice we observe that such embeddings are difficult to work with and users
are very likely to make mistakes, especially in cases of nested non-scalar types (lists of lists, etc.).
This would ideally be remedied in CSV editors themselves by adding first-class support for the embedded JSON strings via
validation and error-reporting or alternative editing UI suitable for hierarchical JSON data (such as tree views), but it is unlikely
that this support will be widespread enough or that the incentive to switch to supporting editors large enough to overcome the market inertia.
Thus, we propose a new notation for JSON designed for embedding within CSV tables and editing with existing spreadsheet software.

### Design Requirements

- Serializable to UTF-8 string
- Superset of JSON (all valid JSON is valid SCSV)
- Less error prone in manual (unassisted by an IDE) editing than JSON

### Design Goals

- Easy to read and edit in spreadsheet software
  - Assuming CSV escapes are handled by the software
- Utilize the available type information to improve the user experience

### Type System

#### Primitive types

- String
- Number (floating or integer)
- Boolean
- Null

#### Collection types

- Arrays
- Objects
- Tuples (same syntax as arrays)
- Records - objects with a specific set of fields (same syntax as objects)

#### Union types

A union type is defined by a set of variants and accepts any one of the variants. For example, the union type `string | number` can accept both string values like `hello` and number values like `12345`. Union types create ambiguities in the parsing of some text which are resolved later in the specification.

### Grammar

The grammar specification is split in parts based on the expected type of the resulting parameter.

Empty input is defined as either end of file or a closing bracket (`]`) for an array or a closing brace (`}`) for an object if the value is contained in one.

#### Strings

- Strings are written literally, in UTF-8, with optional quotation marks
- Literal whitespace is trimmed from each end of the string value (unless quoted)
  - Whitespace characters added to the string using escapes are not stripped
- Strings support a sueprset of JSON escapes
  - `\"` for literal `"`
  - `\\` for literal `\`
  - `\/` for literal `/`
  - `\b` for the backspace character
  - `\f` for the form feed character
  - `\n` for the line feed character
  - `\r` for the carriage return character
  - `\t` for the tab character
  - Unicode escapes `\uXXXX` where `X` is any character
    - If `X` is not a valid hexadecimal digit, an error is raised to the user
  - `\,` for literal `,`
  - `\]` for literal `]`
  - `\}` for literal `}`
  - Unrecognized escapes issue a non-fatal error and are ignored in the output

##### Examples

| SCSV          | JSON            |
| ------------- | --------------- |
| `hello world` | `"hello world"` |
| `1234`        | `"1234"`        |
| ` `           | `""`            |
| `test`        | `"test"`        |
| `\\`          | `"\\"`          |
| `\n`          | `"\n"`          |
| `\u1234`      | `"\u1234"`      |
| `\\u005C`     | `"\\u005C"`     |

#### Numbers

- Grammar in regular expression: `[-+]?[0-9]*(\.[0-9]+)?([eE][-+][0-9]+)?`
  - At least one digit must be read
- A whitespace character (` ` i.e. `\u0020`) can be inserted anywhere in the number notation

##### Examples

| SCSV                       | JSON                  |
| -------------------------- | --------------------- |
| `1234`                     | `1234`                |
| `1 2 3 4`                  | `1234`                |
| `- 1 234 567.999 999 e+10` | `-1234567.999999e+10` |
| `00001234.1234000`         | `1234.1234000`        |
| `.1`                       | `0.1`                 |
| `+5`                       | `5`                   |

#### Booleans

- Acceptable values for `true`: `true`, `t`, `yes`, `y`
- Acceptable values for `false`: `false`, `f`, `no`, `n`
- The matching is case-insensitive

##### Examples

| SCSV    | JSON    |
| ------- | ------- |
| `true`  | `true`  |
| `tRuE`  | `true`  |
| `yes`   | `true`  |
| `false` | `false` |
| `fAlSe` | `false` |
| `no`    | `false` |

#### Null

- Acceptable values: `none`, `null`, `nil`, empty input
- The matching is case-insensitive

##### Examples

| SCSV      | JSON   |
| --------- | ------ |
| `none`    | `null` |
| `NoNe`    | `null` |
| `nil`     | `null` |
| `<empty>` | `null` |

#### Arrays

- Grammar: `(<value>(,+<value>)*)?,*`
  - Brackets (`[` and `]`) can optionally surround the arara contents
- Trailing commas are allowed
- Repeated commas are ignored
  - If the array is allowed to contain nulls, all repeated commas are interpreted as `null` values
- Whitespace before and after a `,` is ignored
- An empty input represents an empty array

#### Examples

| SCSV                 | JSON                                   |
| -------------------- | -------------------------------------- |
| `a`                  | `["a"]`                                |
| `a,b`                | `["a","b"]`                            |
| `1234,5678`          | `[1234, 5678]`                         |
| `1,2,3,4,5,6,`       | `[1,2,3,4,5,6]`                        |
| `1,2,3,,,,4,5,6,,,,` | `[1,2,3,4,5,6]`                        |
| `a\u002C , b`        | `["a,", "b"]`                          |
| `<empty>`            | `[]`                                   |
| `null,,nil,,,`       | `[null, null, null, null, null, null]` |

#### Objects

- Grammar: `(<key>:+<value>(,+<key>:+<value>)*)?,*`
  - Braces (`{` and `}`) can optionally surround the object contents
- Keys are string values
- In cases where element types are strings, the `,` can be escaped using `\u002C`, and `:` using `\u003A`
- Trailing commas are allowed
- Repeated commas are ignored
- Repeated colons are ignored
- Whitespace before and after `,` and `:` is ignored
- Empty input represents an empty object
- Only string keys are allowed (as in JSON), meaning keys are always parsed as strings (e.g. `false` is parsed as `"false"`)

##### Examples

| SCSV                                           | JSON                               |
| ---------------------------------------------- | ---------------------------------- |
| `a:b`                                          | `{"a": "b"}`                       |
| `12345:b`                                      | `{"12345": "b"}`                   |
| `a:b,b:c`                                      | `{"a": "b", "b": "c"}`             |
| `a : b , b : c ,,, `                           | `{"a": "b", "b": "c"}`             |
| `a\u003A:b`                                    | `{"a:": "b"}`                      |
| `<empty>`                                      | `{}`                               |
| `a, b, c \u003A ::: b\u002C\u002C,,,, c d : e` | `{"a, b, c :": "b,,", "c d": "e"}` |

#### Nesting Arrays and Objects

- When arrays and objects contain other arrays and objects, additional delimiters are required
- Arrays must be delimited with `[` and `]`, which are normally optional
- Objects must be delimited with `{` and `}`, which are normally optional

### Resolving ambiguities

If the expected type is a union, ambiguities might arise. For example, if the type is `string | number` then the input `1234` can be parsed both as
`"1234"` (string) and as `1234` (number).

#### Booleans, Numbers, Nulls

The representations of types of boolean, number, and null inputs must not conflict. A violation of this rule is an issue in this specification and the specification should be amended. Parsers should raise an error in this case.

#### Strings

In conflicts between string and any other type, non-string interpretations should be preferred. Examples:

| Expected type            | SCSV       | JSON               | Rejected alternative |
| ------------------------ | ---------- | ------------------ | -------------------- |
| `string \| number`       | `1234`     | `1234`             | `"1234"`             |
| `string \| null`         | `null`     | `null`             | `"null"`             |
| `string \| null`         | `<empty>`  | `null`             | `""`                 |
| `string \| boolean`      | `true`     | `true`             | `"true"`             |
| `string \| boolean`      | `t`        | `true`             | `"t"`                |
| `string \| array string` | `a,b,c`    | `["a", "b", "c"]`  | `"a,b,c"`            |
| `array (string \| null)` | `a,c,null` | `["a", "c", null]` | `["a", "c", "null"]` |

To force a string interpretation of the input, the optional quotation marks should be used. For example, `"1234"` will parse to JSON as `"1234"`.

#### Empty Arrays and Objects vs Nulls

Nulls, arrays, and objects all accept empty strings as a valid input. Null is the preferred interpretation in such cases. To indicate an empty array or object, use the bracket-delimited form.

| Expected type           | SCSV      | JSON   | Rejected alternative |
| ----------------------- | --------- | ------ | -------------------- |
| `null \| array string`  | `<empty>` | `null` | `[]`                 |
| `null \| object string` | `<empty>` | `null` | `{}`                 |
| `null \| array string`  | `[]`      | `[]`   | No other valid parse |

#### Singleton Arrys and Empty Strings

Since empty string is a valid input for some types and since singleton arrays are represented by just the contained value, it is ambiguous whether an empty input indicates a singleton array with the empty string parsed as the only value, or whether the input indicates an empty array with no values at all. The empty array parsing is always preferred. It is always possible to get the alternative parses using other allowed notation. A violation of this last rule is an issue in this specification and the specification should be amended. Parsers should raise an error in this case.

| Expected type                  | SCSV      | JSON     | Rejected alternatives      |
| ------------------------------ | --------- | -------- | -------------------------- |
| `array (null \| string)`       | `<empty>` | `[]`     | `[null]`                   |
| `array (null \| array string)` | `<empty>` | `[]`     | `[null]`, `[[]]`, `[[""]]` |
| `array (null \| array string)` | `[]`      | `[]`     | `[null]`, `[[]]`, `[[""]]` |
| `array (null \| array string)` | `[null]`  | `[null]` | No other valid parse       |
| `array (null \| array string)` | `[[]]`    | `[[]]`   | `[[""]]`                   |
| `array (null \| array string)` | `[[""]]`  | `[[""]]` | No other valid parse       |

#### Arrays and Objects

For simplicity, object interpretations are always preferred to array interpretations where ambiguous. As always, it is possible to disambiguate using additional syntax (braces and brackets)

| Expected type                   | SCSV      | JSON           | Rejected alternatives |
| ------------------------------- | --------- | -------------- | --------------------- |
| `array string \| object string` | `<empty>` | `{}`           | `[]`                  |
| `array string \| object string` | `a:b`     | `{"a": "b"}`   | `["a:b"]`             |
| `array string \| object string` | `a,b:c`   | `{"a,b": "c"}` | `["a", "b:c"]`        |


### Copying/License

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
