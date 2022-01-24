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

import { generate as generateObject } from "./generators/object";
generateObject(parseValue, "object ");

import test from "ava";

test("basic union", (t) => {
  t.is(parseValue(new Ctx("1234"), scsv.parse("n|b")), 1234);
  t.is(parseValue(new Ctx("false"), scsv.parse("n|b")), false);
  t.is(parseValue(new Ctx("hello world"), scsv.parse("n|b")), undefined);
});
