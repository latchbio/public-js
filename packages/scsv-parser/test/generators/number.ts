import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx } from "../../src/impl";

export const generate = (f: (ctx: Ctx) => any) => {
  testProp(
    "from double",
    [fc.double()],
    (t, x) => {
      t.is(f(new Ctx(String(x))), x);
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
      t.is(f(new Ctx(cur)), Number.parseFloat(curParseInt));
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
      t.is(f(ctx), undefined);
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
      t.is(f(ctx), undefined);
      t.true(ctx.posClone.equals(oldPos));
    }
  );

  test("spec tests", (t) => {
    t.is(f(new Ctx("1234")), 1234);
    t.is(f(new Ctx("1 2 3 4")), 1234);
    t.is(f(new Ctx("- 1 234 567.999 999 e+10")), -1_234_567.999_999e+10);
    t.is(f(new Ctx("00001234.1234000")), 1234.1234);
    t.is(f(new Ctx(".1")), 0.1);
    t.is(f(new Ctx("+5")), 5);
    t.is(f(new Ctx("e1")), 10);
    t.is(f(new Ctx("-e1")), -10);
    t.is(f(new Ctx(".2E1")), 2);
    t.is(f(new Ctx("3.1415")), 3.1415);
    t.is(f(new Ctx("3e2")), 300);
    t.is(f(new Ctx("-.5")), -0.5);
    t.is(f(new Ctx("-E-2")), -0.01);
    t.is(f(new Ctx(".5e-2")), 0.005);
  });
};
