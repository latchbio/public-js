import { testProp, fc } from "ava-fast-check";

import { scsv, SCSVArray, SCSVTuple } from "../../src/types";
import { Ctx } from "../../src/impl";

export const generate = (f: (ctx: Ctx, type: SCSVArray | SCSVTuple) => any) => {
  testProp(
    "inverse of JSON serialize",
    [fc.array(fc.integer(), { minLength: 1 })],
    (t, xs) => {
      t.deepEqual(f(new Ctx(JSON.stringify(xs)), scsv.array(scsv.number)), xs);
    }
  );

  testProp(
    "simple array",
    [fc.array(fc.integer(), { minLength: 1 })],
    (t, xs) => {
      t.deepEqual(f(new Ctx(xs.join(",")), scsv.array(scsv.number)), xs);
    }
  );
};
