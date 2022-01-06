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
