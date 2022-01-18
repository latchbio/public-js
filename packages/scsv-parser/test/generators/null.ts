import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx } from "../../src/impl";

export const generate = (f: (ctx: Ctx) => any) => {
  testProp("null", [fc.mixedCase(fc.constant("null"))], (t, x) => {
    t.is(f(new Ctx(x)), null);
  });

  testProp("nil", [fc.mixedCase(fc.constant("nil"))], (t, x) => {
    t.is(f(new Ctx(x)), null);
  });

  testProp("none", [fc.mixedCase(fc.constant("none"))], (t, x) => {
    t.is(f(new Ctx(x)), null);
  });

  test("spec tests", (t) => {
    t.is(f(new Ctx("")), null);
    t.is(f(new Ctx("null")), null);
    t.is(f(new Ctx("nil")), null);
    t.is(f(new Ctx("none")), null);
    t.is(f(new Ctx("NoNe")), null);
  });
};
