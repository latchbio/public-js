import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx } from "../../src/impl";

export const generate = (f: (ctx: Ctx) => any) => {
  testProp("true", [fc.mixedCase(fc.constant("true"))], (t, x) => {
    t.is(f(new Ctx(x)), true);
  });

  testProp("t", [fc.mixedCase(fc.constant("t"))], (t, x) => {
    t.is(f(new Ctx(x)), true);
  });

  testProp("yes", [fc.mixedCase(fc.constant("yes"))], (t, x) => {
    t.is(f(new Ctx(x)), true);
  });

  testProp("y", [fc.mixedCase(fc.constant("y"))], (t, x) => {
    t.is(f(new Ctx(x)), true);
  });

  testProp("false", [fc.mixedCase(fc.constant("false"))], (t, x) => {
    t.is(f(new Ctx(x)), false);
  });

  testProp("f", [fc.mixedCase(fc.constant("f"))], (t, x) => {
    t.is(f(new Ctx(x)), false);
  });

  testProp("no", [fc.mixedCase(fc.constant("no"))], (t, x) => {
    t.is(f(new Ctx(x)), false);
  });

  testProp("n", [fc.mixedCase(fc.constant("n"))], (t, x) => {
    t.is(f(new Ctx(x)), false);
  });

  test("spec tests", (t) => {
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
