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

export class Ctx {
  private _pos = new Pos();
  private _errors: SCSVError[] = [];

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
    return res;
  }

  advanceTo(ctx: Ctx) {
    this._pos = ctx._pos;
  }

  next() {
    ++this._pos.idx;
    ++this._pos.col;

    if (this.cur === "\n") {
      ++this._pos.line;
      this._pos.col = 1;
    }
  }

  consume(x: string, ignoreCase = false) {
    if (
      (ignoreCase ? this.cur.toLocaleLowerCase() : this.cur) !==
      (ignoreCase ? x.toLocaleLowerCase() : x)
    )
      return false;

    this.next();
    return true;
  }

  consumeString(xs: string, ignoreCase = false) {
    const chk = this.clone();
    for (const x of xs) if (!chk.consume(x, ignoreCase)) return false;

    this.advanceTo(chk);
    return true;
  }

  addError(msg: string) {
    this._errors.push(new SCSVError(this.posClone, msg));
  }

  skipWhitespace() {
    while (" \t\n\r".includes(this.cur)) this.next();
  }

  toString() {
    return `${this._pos}`;
  }

  get remainder() {
    return this._data.slice(this._pos.idx);
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

  // todo(maximsmol): assemble result bit-by-bit via ArrayBuffer and DataView
  // to avoid precision loss
  return (
    mul * (accum ?? 0) * Math.pow(10, finalExp) +
    (frac ?? 0) * Math.pow(10, finalExp - fracSize)
  );
};

export const parseNull = (ctx: Ctx): null | undefined => {
  if (ctx.cur === "eof") return null;
  for (const x of ["null", "nil", "none"])
    if (ctx.consumeString(x)) return null;

  return undefined;
};
