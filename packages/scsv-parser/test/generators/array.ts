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

  testProp(
    prefix + "simple tuple",
    [fc.array(fc.integer(), { minLength: 1 })],
    (t, xs) => {
      t.deepEqual(
        f(
          new Ctx(xs.join(",")),
          scsv.tuple(...Array(xs.length).fill(scsv.number))
        ),
        xs
      );
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

  test(prefix + "tuple spec tests", (t) => {
    t.deepEqual(f(new Ctx("a"), scsv.tuple(scsv.string)), ["a"]);
    t.deepEqual(f(new Ctx("a,5678"), scsv.tuple(scsv.string, scsv.number)), [
      "a",
      5678,
    ]);
    t.deepEqual(f(new Ctx("1234,hi"), scsv.tuple(scsv.number, scsv.string)), [
      1234,
      "hi",
    ]);
    t.deepEqual(
      f(
        new Ctx("1,2,3,hello,5,6,"),
        scsv.tuple(
          scsv.number,
          scsv.number,
          scsv.number,
          scsv.string,
          scsv.number,
          scsv.number
        )
      ),
      [1, 2, 3, "hello", 5, 6]
    );
    t.deepEqual(
      f(
        new Ctx("1,2,3,,,,4,5,6,,,,"),
        scsv.tuple(
          scsv.number,
          scsv.string,
          scsv.number,
          scsv.string,
          scsv.number,
          scsv.number
        )
      ),
      [1, "2", 3, "4", 5, 6]
    );
    t.deepEqual(f(new Ctx("a\\, , 4"), scsv.tuple(scsv.string, scsv.number)), [
      "a,",
      4,
    ]);
    t.deepEqual(
      f(
        new Ctx('null,,nil,,"",'),
        scsv.tuple(
          scsv.string,
          scsv.null,
          scsv.null,
          scsv.optional(scsv.string),
          scsv.optional(scsv.string),
          scsv.string
        )
      ),
      ["null", null, null, null, "", ""]
    );
  });
};
