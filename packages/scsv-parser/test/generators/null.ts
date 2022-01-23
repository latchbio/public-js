import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx } from "../../src/impl";

export const generate = (f: (ctx: Ctx) => any, prefix?: string) => {
  if (prefix === undefined) prefix = "";

  testProp(
    prefix + "null",
    [fc.mixedCase(fc.constantFrom("null", "nil", "none"))],
    (t, x) => {
      t.is(f(new Ctx(x)), null);
    }
  );

  test(prefix + "spec tests", (t) => {
    t.is(f(new Ctx("")), null);
    t.is(f(new Ctx("null")), null);
    t.is(f(new Ctx("nil")), null);
    t.is(f(new Ctx("none")), null);
    t.is(f(new Ctx("NoNe")), null);
  });
};
