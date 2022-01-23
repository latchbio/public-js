import {
  isOptional,
  scsv,
  SCSVArray,
  SCSVObject,
  SCSVObjectOutput,
  SCSVOutput,
  SCSVPrimitiveName,
  SCSVRecord,
  SCSVTuple,
  SCSVType,
} from "./types";

class Pos {
  constructor(
    public idx: number = 0,
    public line: number = 1,
    public col: number = 1
  ) {}

  clone() {
    return new Pos(this.idx, this.line, this.col);
  }

  equals(x: Pos) {
    return this.idx === x.idx && this.line === x.line && this.col === x.col;
  }

  toString() {
    return `${this.line}:${this.col}`;
  }
}

export class SCSVError {
  constructor(public readonly pos: Pos, public readonly message: string) {}

  toString() {
    return `${this.pos}: ${this.message}`;
  }
}

const ignoreCase = Symbol("ignoreCase");
type ignoreCase = typeof ignoreCase;

const whitespaceChars = " \t\n\r";
export class Ctx {
  private _pos = new Pos();
  private _errors: SCSVError[] = [];

  public listLevel = 0;
  public dictLevel = 0;
  public inDictKey = false;

  constructor(private readonly _data: string) {}

  get cur() {
    const res = this._data[this._pos.idx];
    if (res === undefined) return "eof";
    return res;
  }

  get posClone() {
    return this._pos.clone();
  }

  clone(): Ctx {
    const res = new Ctx(this._data);
    res._pos = this.posClone;
    res.listLevel = this.listLevel;
    res.dictLevel = this.dictLevel;
    res.inDictKey = this.inDictKey;
    return res;
  }

  advanceTo(ctx: Ctx) {
    this._errors.push(...ctx._errors);
    this._pos = ctx._pos;
    this.listLevel = ctx.listLevel;
    this.dictLevel = ctx.dictLevel;
    this.inDictKey = ctx.inDictKey;
  }

  next() {
    ++this._pos.idx;
    ++this._pos.col;

    if (this.cur === "\n") {
      ++this._pos.line;
      this._pos.col = 1;
    }
  }

  consume(x: string, caseSetting: ignoreCase | undefined = undefined) {
    if (
      (caseSetting === ignoreCase ? this.cur.toLocaleLowerCase() : this.cur) !==
      (caseSetting === ignoreCase ? x.toLocaleLowerCase() : x)
    )
      return false;

    this.next();
    return true;
  }

  consumeString(xs: string, caseSetting: ignoreCase | undefined = undefined) {
    const chk = this.clone();
    for (const x of xs) if (!chk.consume(x, caseSetting)) return false;

    this.advanceTo(chk);
    return true;
  }

  addError(msg: string) {
    this._errors.push(new SCSVError(this.posClone, msg));
  }

  skipWhitespace() {
    while (whitespaceChars.includes(this.cur)) this.next();
  }

  toString() {
    return `${this._pos}`;
  }

  get remainder() {
    return this._data.slice(this._pos.idx);
  }

  sliceBetween(ctx: Ctx) {
    return this._data.slice(this._pos.idx, ctx._pos.idx);
  }
}

const digitValue: Record<string, number> = {
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
};

export const parseDigitSpan = (ctx: Ctx): [number | undefined, number] => {
  if (!(ctx.cur in digitValue)) return [undefined, 0];

  let accum = 0;
  let numDigits = 0;
  while (true) {
    const curValue = digitValue[ctx.cur];
    if (curValue === undefined) break;

    accum = accum * 10 + curValue;
    ++numDigits;
    ctx.next();
    ctx.skipWhitespace();
  }

  return [accum, numDigits];
};

export const parseNumber = (ctx: Ctx): number | undefined => {
  let mul = 1;
  if (ctx.consume("-")) {
    mul = -1;
    ctx.skipWhitespace();
  } else if (ctx.consume("+")) ctx.skipWhitespace();

  const [accum, accumSize] = parseDigitSpan(ctx);

  let [frac, fracSize] = [undefined as number | undefined, 0];
  if (ctx.consume(".")) [frac, fracSize] = parseDigitSpan(ctx);

  let expMul = 1;
  let [exp, expSize] = [undefined as number | undefined, 0];
  if ("eE".includes(ctx.cur)) {
    ctx.next();
    if (ctx.consume("-")) {
      expMul = -1;
      ctx.skipWhitespace();
    } else if (ctx.consume("+")) ctx.skipWhitespace();

    [exp, expSize] = parseDigitSpan(ctx);
  }

  if (accumSize === 0 && fracSize === 0 && expSize === 0) return;

  const finalExp = expMul * (exp ?? 0);
  if (accum === undefined && frac === undefined)
    return mul * Math.pow(10, finalExp);

  // todo(maximsmol): assemble result bit-by-bit via ArrayBuffer and DataView
  // to avoid precision loss
  return (
    mul *
    ((accum ?? 0) * Math.pow(10, finalExp) +
      (frac ?? 0) * Math.pow(10, finalExp - fracSize))
  );
};

export const parseNull = (ctx: Ctx): null | undefined => {
  if (ctx.cur === "eof") return null;
  for (const x of ["null", "nil", "none"])
    if (ctx.consumeString(x, ignoreCase)) return null;

  return undefined;
};

const stringEscapes: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
  ",": ",",
  "]": "]",
  ":": ":",
  "}": "}",
};
const hexDigitValue: Record<string, number> = {
  ...digitValue,
  a: 10,
  A: 10,
  b: 11,
  B: 11,
  c: 12,
  C: 12,
  d: 13,
  D: 13,
  e: 14,
  E: 14,
  f: 15,
  F: 15,
};
export const parseString = (ctx: Ctx): string | undefined => {
  const quoted = ctx.consume('"');
  if (!quoted) ctx.skipWhitespace();

  let res = "";
  let trailingWhitespace = "";
  let inEscape = false;

  while (ctx.cur !== "eof") {
    if (ctx.consume("\\")) {
      if (!inEscape) {
        inEscape = true;
        continue;
      } else {
        res += trailingWhitespace;
        trailingWhitespace = "";
        res += "\\";

        inEscape = false;
        continue;
      }
    }

    if (inEscape) {
      inEscape = false;

      if (ctx.cur === "u") {
        ctx.next();

        const chk = ctx.clone();

        let valid = true;
        let accum = 0;
        for (let i = 0; i < 4; ++i) {
          accum *= 16;

          const cur = hexDigitValue[chk.cur];
          if (cur === undefined) {
            valid = false;
            chk.addError(`Invalid hex digit: "${chk.cur}"`);

            // finish consuming the rest of the string
            continue;
          }
          accum += cur;
          chk.next();
        }

        if (valid) {
          res += trailingWhitespace;
          trailingWhitespace = "";

          res += String.fromCodePoint(accum);
        } else
          ctx.addError(
            `Ignored invalid unicode escape: "\\u${ctx.sliceBetween(chk)}"`
          );

        ctx.advanceTo(chk);

        continue;
      }

      const escaped = stringEscapes[ctx.cur];
      ctx.next();

      res += trailingWhitespace;
      trailingWhitespace = "";

      if (escaped === undefined) {
        ctx.addError(`Ignored invalid escape: "\\${ctx.cur}"`);
        continue;
      }

      res += escaped;
      continue;
    }

    if (quoted && ctx.cur === '"') break;
    if (",]".includes(ctx.cur) && !ctx.inDictKey && ctx.listLevel > 0) break;
    if (",}".includes(ctx.cur) && !ctx.inDictKey && ctx.dictLevel > 0) break;
    if (ctx.cur === ":" && ctx.inDictKey) break;
    if (whitespaceChars.includes(ctx.cur)) trailingWhitespace += ctx.cur;
    else {
      res += trailingWhitespace;
      trailingWhitespace = "";

      res += ctx.cur;
    }

    ctx.next();
  }

  if (quoted) {
    res += trailingWhitespace;
    ctx.consume('"');
  }

  return res;
};

export const parseBoolean = (ctx: Ctx): boolean | undefined => {
  for (const x of ["true", "t", "yes", "y"])
    if (ctx.consumeString(x, ignoreCase)) return true;
  for (const x of ["false", "f", "no", "n"])
    if (ctx.consumeString(x, ignoreCase)) return false;

  return undefined;
};

export const parseValue = (ctx: Ctx, t: SCSVType): SCSVOutput | undefined => {
  if (t.type === SCSVPrimitiveName.string) return parseString(ctx);
  if (t.type === SCSVPrimitiveName.number) return parseNumber(ctx);
  if (t.type === SCSVPrimitiveName.boolean) return parseBoolean(ctx);
  if (t.type === SCSVPrimitiveName.null) return parseNull(ctx);
  if (t.type === "array" || t.type === "tuple") return parseArray(ctx, t);
  if (t.type === "object") return parseObject(ctx, t);
  if (t.type === "record") return parseObject(ctx, t);
  if (t.type === "union") {
    for (const x of t.variants) {
      const chk = ctx.clone();
      const res = parseValue(chk, x);
      if (res === undefined) continue;
      ctx.advanceTo(chk);
      return res;
    }
    return;
  }

  throw new Error(`unrecognized type: "${t.type}"`);
};

export const parseArray = (
  ctx: Ctx,
  t: SCSVArray | SCSVTuple
): SCSVOutput[] | undefined => {
  try {
    ++ctx.listLevel;

    if (ctx.cur === "eof") return [];

    const isOptionalList =
      t.type === "array" &&
      (t.elementType === scsv.null || isOptional(t.elementType));

    const bracketed = ctx.consume("[");
    if (bracketed) ctx.skipWhitespace();

    const res: SCSVOutput[] = [];
    let idx = 0;

    while (true) {
      if (bracketed && ctx.cur === "]") break;
      if (ctx.cur === "}" && ctx.dictLevel > 0) break;

      const curT = t.type === "array" ? t.elementType : t.elements[idx];
      if (curT === undefined) return; // ran out of tuple types
      ++idx;

      const cur = parseValue(ctx, curT);
      if (cur === undefined) break;
      res.push(cur);

      ctx.skipWhitespace();
      if (!ctx.consume(",")) break;
      ctx.skipWhitespace();
      if (!isOptionalList && !isOptional(curT))
        while (ctx.consume(",")) ctx.skipWhitespace();
      else
        while (ctx.consume(",")) {
          res.push(null);
          ctx.skipWhitespace();
        }
      ctx.skipWhitespace();
    }

    ctx.skipWhitespace();
    if (bracketed) ctx.consume("]");

    return res;
  } finally {
    --ctx.listLevel;
  }
};

export const parseObject = (
  ctx: Ctx,
  t: SCSVObject | SCSVRecord
): SCSVObjectOutput | undefined => {
  try {
    ++ctx.dictLevel;

    if (ctx.cur === "eof") return {};

    const isOptionalObject =
      t.type === "object" &&
      (t.valueType === scsv.null || isOptional(t.valueType));

    const bracketed = ctx.consume("{");
    if (bracketed) ctx.skipWhitespace();

    const res: SCSVObjectOutput = {};
    while (true) {
      if (bracketed && ctx.cur === "}") break;
      if (ctx.cur === "]" && ctx.listLevel > 0) break;

      let k: string | undefined = undefined;
      try {
        ctx.inDictKey = true;

        k = parseString(ctx);
      } finally {
        ctx.inDictKey = false;
      }
      if (k === undefined) break;

      ctx.skipWhitespace();
      if (!ctx.consume(":")) return;
      ctx.skipWhitespace();
      while (ctx.consume(":")) ctx.skipWhitespace();
      ctx.skipWhitespace();

      const curT = t.type === "object" ? t.valueType : t.fields[k];
      if (curT === undefined) return; // not a known record field

      if (isOptionalObject || isOptional(curT)) {
        const chck = ctx.clone();
        chck.skipWhitespace();
        if (chck.consume(",")) {
          res[k] = null;

          ctx.advanceTo(chck);
          while (ctx.consume(","));
          ctx.skipWhitespace();
          continue;
        }
      }

      const cur = parseValue(ctx, curT);
      if (cur === undefined) break;
      res[k] = cur;

      ctx.skipWhitespace();
      if (!ctx.consume(",")) break;
      ctx.skipWhitespace();
      while (ctx.consume(",")) ctx.skipWhitespace();
      ctx.skipWhitespace();
    }

    ctx.skipWhitespace();
    if (bracketed) ctx.consume("]");

    return res;
  } finally {
    --ctx.dictLevel;
  }
};
