import { testProp, fc } from "ava-fast-check";

import { Ctx, parseDigitSpan } from "../src/impl";

testProp("from integer", [fc.maxSafeNat()], (t, x) => {
  t.is(parseDigitSpan(new Ctx(String(x)))[0], x);
});

testProp(
  "from integer with whitespace",
  [
    fc.constantFrom(..."0123456789"),
    fc.stringOf(fc.constantFrom(..."0123456789 \t\n\r"), { minLength: 1 }),
  ],
  (t, prefix, x) => {
    const cur = prefix + x;
    const curParseInt = cur.replace(/[ \t\n\r]/g, "");
    t.is(parseDigitSpan(new Ctx(cur))[0], Number.parseInt(curParseInt));
  }
);

testProp(
  "no useful input",
  [
    fc.stringOf(
      fc.fullUnicode().filter((x) => !"0123456789".includes(x)),
      { minLength: 1 }
    ),
    fc.fullUnicodeString(),
  ],
  (t, prefix, x) => {
    const ctx = new Ctx(prefix + x);

    const oldPos = ctx.posClone;
    t.is(parseDigitSpan(ctx)[0], undefined);
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
    t.is(parseDigitSpan(ctx)[0], undefined);
    t.true(ctx.posClone.equals(oldPos));
  }
);
