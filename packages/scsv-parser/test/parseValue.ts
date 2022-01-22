import { Ctx, parseValue } from "../src/impl";
import { scsv } from "../src/types";

import { generate as generateBoolean } from "./generators/boolean";
generateBoolean((ctx) => parseValue(ctx, scsv.boolean), "boolean ");

import { generate as generateNull } from "./generators/null";
generateNull((ctx) => parseValue(ctx, scsv.null), "null ");

import { generate as generateNumber } from "./generators/number";
generateNumber((ctx) => parseValue(ctx, scsv.number), "number ");

import { generate as generateString } from "./generators/string";
generateString((ctx) => parseValue(ctx, scsv.string), "string ");

import { generate as generateArray } from "./generators/array";
generateArray(parseValue, "array ");

import test from "ava";

test("basic union", (t) => {
  t.is(
    parseValue(new Ctx("1234"), scsv.union(scsv.number, scsv.boolean)),
    1234
  );
  t.is(
    parseValue(new Ctx("false"), scsv.union(scsv.number, scsv.boolean)),
    false
  );
  t.is(
    parseValue(new Ctx("hello world"), scsv.union(scsv.number, scsv.boolean)),
    undefined
  );
});
