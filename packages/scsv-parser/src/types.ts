export const enum SCSVPrimitiveName {
  "string",
  "number",
  "boolean",
  "null",
}

export type SCSVPrimitive = {
  type: SCSVPrimitiveName;
};

export type SCSVArray = {
  type: "array";
  elementType: SCSVType;
};

export type SCSVTuple = {
  type: "tuple";
  elements: SCSVType[];
};

export type SCSVObject = {
  type: "object";
  valueType: SCSVType;
};

export type SCSVRecord = {
  type: "record";
  fields: Record<string, SCSVType>;
};

export type SCSVUnion = {
  type: "union";
  variants: SCSVType[]; // set of types
};

export type SCSVType =
  | SCSVPrimitive
  | SCSVArray
  | SCSVTuple
  | SCSVObject
  | SCSVRecord
  | SCSVUnion;

export const scsv = {
  string: {
    type: SCSVPrimitiveName.string,
  },
  number: {
    type: SCSVPrimitiveName.number,
  },
  boolean: {
    type: SCSVPrimitiveName.boolean,
  },
  null: {
    type: SCSVPrimitiveName.null,
  },
  array(elementType: SCSVType): SCSVArray {
    return {
      type: "array",
      elementType,
    };
  },
  tuple(...elements: SCSVType[]): SCSVTuple {
    return {
      type: "tuple",
      elements,
    };
  },
  object(valueType: SCSVType): SCSVObject {
    return {
      type: "object",
      valueType,
    };
  },
  record(fields: Record<string, SCSVType>): SCSVRecord {
    return {
      type: "record",
      fields,
    };
  },
  union(...variants: SCSVType[]): SCSVUnion {
    return {
      type: "union",
      variants,
    };
  },
  optional(type: SCSVType): SCSVUnion {
    return this.union(type, this.null);
  },
  parse(x: string): SCSVType {
    // todo(maximsmol): tuple, record support
    let idx = 0;

    const consume = (c: string): boolean => {
      if (x[idx] !== c) return false;
      ++idx;
      return true;
    };

    const parsePrimitive = () => {
      if (consume("s")) return this.string;
      if (consume("n")) return this.number;
      if (consume("b")) return this.boolean;
      if (consume("N")) return this.null;
      throw new Error(`unknown primitive: "${x[idx]}"`);
    };

    const parseParens = () => {
      if (!consume("(")) return parsePrimitive();
      const res = parseType();
      if (!consume(")")) throw new Error("expected closing parenthesis");
      return res;
    };

    const parsePostfix = () => {
      const l = parseParens();
      if (!"[{?".includes(x[idx] ?? "eof")) return l;

      let res = l;
      while (true) {
        if (consume("[")) {
          if (!consume("]")) throw new Error("expected closing bracket");
          res = this.array(res);
        } else if (consume("{")) {
          if (!consume("}")) throw new Error("expected closing brace");
          res = this.object(res);
        } else if (consume("?")) {
          res = this.optional(res);
        } else break;
      }

      return res;
    };

    const parseUnion = () => {
      const l = parsePostfix();
      if (x[idx] !== "|") return l;

      const res = [l];
      while (consume("|")) res.push(parsePostfix());

      return this.union(...res);
    };

    const parseType = (): SCSVType => {
      return parseUnion();
    };

    return parseType();
  },
};

export type SCSVObjectOutput = { [key: string]: SCSVOutput };
export type SCSVOutput =
  | string
  | number
  | boolean
  | null
  | SCSVOutput[]
  | SCSVObjectOutput;

// todo(maximsmol): implement this properly
// export type JSTypeFromSCSVType<T extends SCSVType> = T extends SCSVPrimitive
//   ? T["type"] extends SCSVPrimitiveName.string
//     ? string
//     : T["type"] extends SCSVPrimitiveName.number
//     ? number
//     : T["type"] extends SCSVPrimitiveName.boolean
//     ? boolean
//     : T["type"] extends SCSVPrimitiveName.null
//     ? null
//     : never
//   : T extends SCSVArray
//   ? JSTypeFromSCSVType<T["elementType"]>[]
//   : T extends SCSVTuple
//   ? { [K in keyof T["elements"]]: SCSVType }
//   : T extends SCSVObject
//   ? { [key: string]: JSTypeFromSCSVType<T["valueType"]> }
//   : T extends SCSVRecord
//   ? { [K in keyof T["fields"]]: JSTypeFromSCSVType<T["fields"][K]> }
//   : T extends SCSVUnion
//   ? keyof { [K in keyof T["variants"]]: SCSVType }
//   : never;

export const isOptional = (x: SCSVType): boolean =>
  x.type === "union" &&
  x.variants.findIndex((x) => x === scsv.null || isOptional(x)) !== -1;
