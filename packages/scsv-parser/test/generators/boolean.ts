import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx } from "../../src/impl";

export const generate = (f: (ctx: Ctx) => any, prefix?: string) => {
  if (prefix === undefined) prefix = "";

  testProp(
    prefix + "true",
    [fc.mixedCase(fc.constantFrom("true", "t", "yes", "y"))],
    (t, x) => {
      t.is(f(new Ctx(x)), true);
    }
  );

  testProp(
    prefix + "false",
    [fc.mixedCase(fc.constantFrom("false", "f", "no", "n"))],
    (t, x) => {
      t.is(f(new Ctx(x)), false);
    }
  );

  test(prefix + "spec tests", (t) => {
    t.is(f(new Ctx("true")), true);
    t.is(f(new Ctx("tRuE")), true);
    t.is(f(new Ctx("yes")), true);
    t.is(f(new Ctx("false")), false);
    t.is(f(new Ctx("fAlSe")), false);
    t.is(f(new Ctx("no")), false);

    t.is(f(new Ctx("t")), true);
    t.is(f(new Ctx("y")), true);
    t.is(f(new Ctx("f")), false);
    t.is(f(new Ctx("n")), false);
  });
};
