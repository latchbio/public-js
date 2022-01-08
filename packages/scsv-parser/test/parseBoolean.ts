import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { Ctx, parseBoolean } from "../src/impl";

test("true", (t) => {
  t.is(parseBoolean(new Ctx("true")), true);
});

test("t", (t) => {
  t.is(parseBoolean(new Ctx("t")), true);
});

test("yes", (t) => {
  t.is(parseBoolean(new Ctx("yes")), true);
});

test("y", (t) => {
  t.is(parseBoolean(new Ctx("y")), true);
});

test("false", (t) => {
  t.is(parseBoolean(new Ctx("false")), false);
});

test("f", (t) => {
  t.is(parseBoolean(new Ctx("f")), false);
});

test("no", (t) => {
  t.is(parseBoolean(new Ctx("no")), false);
});

test("n", (t) => {
  t.is(parseBoolean(new Ctx("n")), false);
});
