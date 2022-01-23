import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { scsv, SCSVObject, SCSVRecord } from "../../src/types";
import { Ctx } from "../../src/impl";

export const generate = (
  f: (ctx: Ctx, type: SCSVObject | SCSVRecord) => any,
  prefix?: string
) => {
  if (prefix === undefined) prefix = "";

  // todo(maximsmol): generalize to arbitrary json objects
  testProp(
    prefix + "inverse of JSON serialize",
    [fc.dictionary(fc.fullUnicodeString(), fc.integer())],
    (t, xs) => {
      t.deepEqual(f(new Ctx(JSON.stringify(xs)), scsv.object(scsv.number)), xs);
    }
  );

  testProp(
    prefix + "simple object",
    [fc.dictionary(fc.fullUnicodeString(), fc.integer())],
    (t, xs) => {
      t.deepEqual(
        f(
          new Ctx(
            Object.entries(xs)
              .map(([k, v]) => `${JSON.stringify(k)}: ${v}`)
              .join(",")
          ),
          scsv.object(scsv.number)
        ),
        xs
      );
    }
  );

  test(prefix + "spec tests", (t) => {
    t.deepEqual(f(new Ctx("a:b"), scsv.object(scsv.string)), { a: "b" });
    t.deepEqual(f(new Ctx("12345:b"), scsv.object(scsv.string)), {
      "12345": "b",
    });
    t.deepEqual(f(new Ctx("a:b,b:c"), scsv.object(scsv.string)), {
      a: "b",
      b: "c",
    });
    t.deepEqual(f(new Ctx("a\\::b"), scsv.object(scsv.string)), {
      "a:": "b",
    });
    t.deepEqual(f(new Ctx(""), scsv.object(scsv.string)), {});
    t.deepEqual(f(new Ctx("a:,b:"), scsv.object(scsv.null)), {
      a: null,
      b: null,
    });
    t.deepEqual(f(new Ctx('"":0'), scsv.object(scsv.number)), { "": 0 });
  });
};
