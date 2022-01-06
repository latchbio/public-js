import { testProp, fc } from "ava-fast-check";

import { Ctx, parseNumber } from "../src/impl";

testProp(
  "from double",
  [fc.double()],
  (t, x) => {
    t.is(parseNumber(new Ctx(String(x))), x);
  },
  {
    examples: [
      // regression tests
      [0.09946647488542959], // incorrectly truncated to 0.0994664748854296
      [0.04901890456676483], // incorrectly expanded to 0.049018904566764825
    ],
  }
);

testProp(
  "from double with whitespace",
  [
    fc.constantFrom(..."0123456789"),
    fc.stringOf(fc.constantFrom(..."0123456789 \t\n\r"), { minLength: 1 }),
  ],
  (t, prefix, x) => {
    const cur = prefix + x;
    const curParseInt = cur.replace(/[ \t\n\r]/g, "");
    t.is(parseNumber(new Ctx(cur)), Number.parseFloat(curParseInt));
  }
);

testProp(
  "no useful input",
  [
    fc.stringOf(
      fc.fullUnicode().filter((x) => !"0123456789-+.".includes(x)),
      { minLength: 1 }
    ),
    fc.fullUnicodeString(),
  ],
  (t, prefix, x) => {
    const ctx = new Ctx(prefix + x);

    const oldPos = ctx.posClone;
    t.is(parseNumber(ctx), undefined);
    t.true(ctx.posClone.equals(oldPos));
  }
);

testProp(
  "do not consume initial whitespace",
  [
    fc.constantFrom(..." \t\n\r"),
    fc.stringOf(fc.constantFrom(..."0123456789")),
  ],
  (t, prefix, x) => {
    const ctx = new Ctx(prefix + x);

    const oldPos = ctx.posClone;
    t.is(parseNumber(ctx), undefined);
    t.true(ctx.posClone.equals(oldPos));
  }
);
