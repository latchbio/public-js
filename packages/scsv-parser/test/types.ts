import { testProp, fc } from "ava-fast-check";

import test from "ava";
import { isOptional, scsv } from "../src/types";

// todo(maximsmol): create arbitrary for scsv types and optional scsv types
// testProp("isOptional", [], (t) => {});

test("true", (t) => {
  t.is(isOptional(scsv.union(scsv.string, scsv.null)), true);
  t.is(
    isOptional(scsv.union(scsv.string, scsv.union(scsv.number, scsv.null))),
    true
  );
});

test("false", (t) => {
  t.is(isOptional(scsv.string), false);
  t.is(isOptional(scsv.number), false);
  t.is(isOptional(scsv.union(scsv.string, scsv.number)), false);
});
