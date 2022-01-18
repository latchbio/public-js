import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx } from "../../src/impl";

const escapeControlChars = (x: string) => {
  const point = x.codePointAt(0);

  let escape = false;
  if (point <= 0x1f) escape = true;
  if (0x80 <= point && point <= 0x9f) escape = true;

  if (!escape) return x;
  return "\\u" + point.toString(16).padStart(4, "0");
};

const unicodeEscape = fc
  .stringOf(fc.constantFrom(..."0123456789aAbBcCdDeEfF"), {
    minLength: 4,
    maxLength: 4,
  })
  .map((x) => `u${x}`);
const escape = fc
  .oneof(fc.constantFrom(..."/bfnrt"), unicodeEscape)
  .map((x) => `\\${x}`);

const stringWithEscapes = fc.stringOf(
  fc.oneof(
    fc.fullUnicode().map((x) => (x === "\\" ? "\\\\" : escapeControlChars(x))),
    escape
  )
);

export const generate = (f: (ctx: Ctx) => any) => {
  testProp(
    "inverse of JSON.serialize",
    [fc.fullUnicodeString()],
    (t, x) => {
      t.is(f(new Ctx(JSON.stringify(x))), x);
    },
    {
      examples: [
        // JSON escapes
        ['"'],
        ["\\"],
        ["/"],
        ["\b"],
        ["\f"],
        ["\n"],
        ["\r"],
        ["\t"],
        ["\u1234"],
      ],
    }
  );

  testProp(
    "from generated string",
    [fc.boolean(), stringWithEscapes],
    (t, shouldQuote, x) => {
      // replace any incidental quotes so the string does not end
      let forJson = x.replace(/"/g, '\\"');
      if (!shouldQuote) forJson = forJson.trim();

      // scsv supports unquoted strings
      if (shouldQuote) x = x.replace(/"/g, '\\"');

      t.is(f(new Ctx(shouldQuote ? `"${x}"` : x)), JSON.parse(`"${forJson}"`));
    },
    {
      examples: [
        [false, "hello world"],
        [false, "  trim whitespace   "],
        [true, "  do not trim when quoted   "],
        [false, ' unquoted "strings" "can" "have" "quotes" inside '],
        // regression tests
        [true, "\\u0000"],
        [false, "\\u0000"],
      ],
    }
  );

  test("spec tests", (t) => {
    t.is(f(new Ctx("hello world")), "hello world");
    t.is(f(new Ctx("1234")), "1234");
    t.is(f(new Ctx("    ")), "");
    t.is(f(new Ctx("  test  ")), "test");
    t.is(f(new Ctx("\\u005C")), "\\");
    t.is(f(new Ctx("\\u000A")), "\n");
    t.is(f(new Ctx("\\u1234")), "\u1234");
    t.is(f(new Ctx("\\u005Cu005C")), "\\u005C");
    // traded this behavior for JSON-compatibility (allowed non-unicode escapes)
    // t.is(f(new Ctx("C:\\Program Files\\Google Chrome\\")), "C:\\Program Files\\Google Chrome\\");
    t.is(f(new Ctx("\\u0020")), " ");
    t.is(f(new Ctx("\\u000A\\u000A\\u000A\\u000A")), "\n\n\n\n");
    t.is(f(new Ctx("a \\u003A")), "a :");
  });
};
