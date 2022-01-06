import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx, parseNull } from "../src/impl";

test("null", (t) => {
  t.is(parseNull(new Ctx("null")), null);
});

test("nil", (t) => {
  t.is(parseNull(new Ctx("nil")), null);
});

test("none", (t) => {
  t.is(parseNull(new Ctx("none")), null);
});
