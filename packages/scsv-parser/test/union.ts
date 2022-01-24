import test from "ava";

import { Ctx, parseValue } from "../src/impl";
import { scsv } from "../src/types";

// todo(maximsmol): property-based tests

test("spec tests", (t) => {
  t.is(parseValue(new Ctx("1234"), scsv.parse("s|n")), 1234);
  t.is(parseValue(new Ctx("null"), scsv.parse("s|N")), null);
  t.is(parseValue(new Ctx(""), scsv.parse("s|N")), null);
  t.is(parseValue(new Ctx("true"), scsv.parse("s|b")), true);
  t.is(parseValue(new Ctx("t"), scsv.parse("s|b")), true);
  t.deepEqual(
    parseValue(new Ctx("a,b,c"), scsv.union(scsv.string, scsv.parse("s[]"))),
    ["a", "b", "c"]
  );
  t.deepEqual(
    parseValue(
      new Ctx("a,c,null"),
      scsv.array(scsv.union(scsv.string, scsv.null))
    ),
    ["a", "c", null]
  );
  t.is(parseValue(new Ctx('"1234"'), scsv.parse("s|n")), "1234");

  t.is(parseValue(new Ctx(""), scsv.parse("s[]|N")), null);
  t.is(parseValue(new Ctx(""), scsv.parse("s{}|N")), null);
  t.deepEqual(parseValue(new Ctx("[]"), scsv.parse("s[]|N")), []);
  t.deepEqual(parseValue(new Ctx(""), scsv.parse("(N|s)[]")), []);
  t.deepEqual(parseValue(new Ctx(""), scsv.parse("(N|s[])[]")), []);
  t.deepEqual(parseValue(new Ctx("[]"), scsv.parse("(N|s[])[]")), []);
  t.deepEqual(parseValue(new Ctx("[null]"), scsv.parse("(N|s)[]")), [null]);
  t.deepEqual(parseValue(new Ctx("[[]]"), scsv.parse("(N|s[])[]")), [[]]);
  t.deepEqual(parseValue(new Ctx('[[""]]'), scsv.parse("(N|s[])[]")), [[""]]);
  t.deepEqual(parseValue(new Ctx(""), scsv.parse("(s[])|(s{})")), {});
  t.deepEqual(parseValue(new Ctx("a:b"), scsv.parse("(s[])|(s{})")), {
    a: "b",
  });
  t.deepEqual(parseValue(new Ctx("a,b:c"), scsv.parse("(s[])|(s{})")), {
    "a,b": "c",
  });
});
