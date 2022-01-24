import test from "ava";

import { unionVariantComparator } from "../src/impl";
import { scsv } from "../src/types";

// todo(maximsmol): property-based tests

test("number before string", (t) => {
  t.deepEqual([scsv.string, scsv.number].sort(unionVariantComparator), [
    scsv.number,
    scsv.string,
  ]);
});

test("object before array", (t) => {
  t.deepEqual(
    [scsv.parse("s[]"), scsv.parse("s{}")].sort(unionVariantComparator),
    [scsv.parse("s{}"), scsv.parse("s[]")]
  );
});

test("null before others", (t) => {
  t.deepEqual([scsv.string, scsv.null].sort(unionVariantComparator), [
    scsv.null,
    scsv.string,
  ]);
  t.deepEqual([scsv.parse("s[]"), scsv.null].sort(unionVariantComparator), [
    scsv.null,
    scsv.parse("s[]"),
  ]);
  t.deepEqual([scsv.parse("s{}"), scsv.null].sort(unionVariantComparator), [
    scsv.null,
    scsv.parse("s{}"),
  ]);
});
