import { testProp, fc } from "ava-fast-check";
import test from "ava";

import { scsv, SCSVObject, SCSVRecord, SCSVType } from "../../src/types";
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

  testProp(
    prefix + "simple record",
    [fc.dictionary(fc.fullUnicodeString(), fc.integer())],
    (t, xs) => {
      const fields: Record<string, SCSVType> = {};
      for (const k of Object.keys(xs)) fields[k] = scsv.number;

      t.deepEqual(
        f(
          new Ctx(
            Object.entries(xs)
              .map(([k, v]) => `${JSON.stringify(k)}: ${v}`)
              .join(",")
          ),
          scsv.record(fields)
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

  test(prefix + "record spec tests", (t) => {
    t.deepEqual(f(new Ctx("a:b"), scsv.record({ a: scsv.string })), { a: "b" });
    t.deepEqual(f(new Ctx("12345:b"), scsv.record({ "12345": scsv.string })), {
      "12345": "b",
    });
    t.deepEqual(
      f(new Ctx("a:b,b:c"), scsv.record({ a: scsv.string, b: scsv.string })),
      {
        a: "b",
        b: "c",
      }
    );
    t.deepEqual(f(new Ctx("a\\::b"), scsv.record({ "a:": scsv.string })), {
      "a:": "b",
    });
    t.deepEqual(
      f(new Ctx("a:,b:"), scsv.record({ a: scsv.null, b: scsv.null })),
      {
        a: null,
        b: null,
      }
    );
    t.deepEqual(f(new Ctx('"":0'), scsv.record({ "": scsv.number })), {
      "": 0,
    });
  });
};
