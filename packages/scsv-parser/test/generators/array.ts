import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { scsv, SCSVArray, SCSVTuple } from "../../src/types";
import { Ctx } from "../../src/impl";

export const generate = (
  f: (ctx: Ctx, type: SCSVArray | SCSVTuple) => any,
  prefix?: string
) => {
  if (prefix === undefined) prefix = "";

  // todo(maximsmol): generalize to arbitrary json arrays
  testProp(
    prefix + "inverse of JSON serialize",
    [fc.array(fc.integer(), { minLength: 1 })],
    (t, xs) => {
      t.deepEqual(f(new Ctx(JSON.stringify(xs)), scsv.array(scsv.number)), xs);
    }
  );

  testProp(
    prefix + "simple array",
    [fc.array(fc.integer(), { minLength: 1 })],
    (t, xs) => {
      t.deepEqual(f(new Ctx(xs.join(",")), scsv.array(scsv.number)), xs);
    }
  );

  test(prefix + "spec tests", (t) => {
    t.deepEqual(f(new Ctx("a"), scsv.array(scsv.string)), ["a"]);
    t.deepEqual(f(new Ctx("a,b"), scsv.array(scsv.string)), ["a", "b"]);
    t.deepEqual(f(new Ctx("1234,5678"), scsv.array(scsv.number)), [1234, 5678]);
    t.deepEqual(
      f(new Ctx("1,2,3,4,5,6,"), scsv.array(scsv.number)),
      [1, 2, 3, 4, 5, 6]
    );
    t.deepEqual(
      f(new Ctx("1,2,3,,,,4,5,6,,,,"), scsv.array(scsv.number)),
      [1, 2, 3, 4, 5, 6]
    );
    t.deepEqual(f(new Ctx("a\\, , b"), scsv.array(scsv.string)), ["a,", "b"]);
    t.deepEqual(f(new Ctx(""), scsv.array(scsv.string)), []);
    t.deepEqual(f(new Ctx("null,,nil,,,"), scsv.array(scsv.null)), [
      null,
      null,
      null,
      null,
      null,
      null,
    ]);
  });
};
