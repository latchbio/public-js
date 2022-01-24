import test from "ava";

import { scsv } from "../src/types";

// todo(maximsmol): property-based tests

test("primitives", (t) => {
  t.is(scsv.parse("s"), scsv.string);
  t.is(scsv.parse("n"), scsv.number);
  t.is(scsv.parse("b"), scsv.boolean);
  t.is(scsv.parse("N"), scsv.null);
});

test("collections", (t) => {
  t.deepEqual(scsv.parse("s[]"), scsv.array(scsv.string));
  t.deepEqual(scsv.parse("s[][]"), scsv.array(scsv.array(scsv.string)));
  t.deepEqual(
    scsv.parse("s[]{}[]"),
    scsv.array(scsv.object(scsv.array(scsv.string)))
  );
});

test("unions", (t) => {
  t.deepEqual(scsv.parse("s|n"), scsv.union(scsv.string, scsv.number));
  t.deepEqual(
    scsv.parse("s|n[]"),
    scsv.union(scsv.string, scsv.array(scsv.number))
  );
  t.deepEqual(scsv.parse("s|N"), scsv.union(scsv.string, scsv.null));
});

test("optional", (t) => {
  t.deepEqual(scsv.parse("s?"), scsv.union(scsv.string, scsv.null));
  t.deepEqual(
    scsv.parse("s[]?"),
    scsv.union(scsv.array(scsv.string), scsv.null)
  );
  t.deepEqual(
    scsv.parse("s[]?[]"),
    scsv.array(scsv.union(scsv.array(scsv.string), scsv.null))
  );
});

test("parens", (t) => {
  t.deepEqual(
    scsv.parse("(s|n)[]"),
    scsv.array(scsv.union(scsv.string, scsv.number))
  );
});
