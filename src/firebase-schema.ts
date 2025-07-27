export type FirebaseConfigValueType = string | number | boolean;

// Base type for schema fields
type SchemaField<T, HasDefault extends boolean = false> = {
  type: T;
  hasDefault: HasDefault;
  defaultValue?: T;
};

// Field creators
export function numberType(): SchemaField<number, false>;
export function numberType(defaultValue: number): SchemaField<number, true>;
export function numberType(
  defaultValue?: number
): SchemaField<number, boolean> {
  return defaultValue !== undefined
    ? { type: 0 as number, hasDefault: true, defaultValue }
    : { type: 0 as number, hasDefault: false };
}

export function stringType(): SchemaField<string, false>;
export function stringType(defaultValue: string): SchemaField<string, true>;
export function stringType(
  defaultValue?: string
): SchemaField<string, boolean> {
  return defaultValue !== undefined
    ? { type: '' as string, hasDefault: true, defaultValue }
    : { type: '' as string, hasDefault: false };
}

export function booleanType(): SchemaField<boolean, false>;
export function booleanType(defaultValue: boolean): SchemaField<boolean, true>;
export function booleanType(
  defaultValue?: boolean
): SchemaField<boolean, boolean> {
  return defaultValue !== undefined
    ? { type: false as boolean, hasDefault: true, defaultValue }
    : { type: false as boolean, hasDefault: false };
}

// Schema type
export type FirebaseConfigSchema = Record<
  string,
  SchemaField<number | string | boolean, boolean>
>;

// Type inference utility
export type GetValuesTypeFromConfigSchema<S extends FirebaseConfigSchema> = {
  [K in keyof S]: S[K]['hasDefault'] extends true
    ? S[K]['type']
    : S[K]['type'] | undefined;
  // } & {
  //   [K in keyof T as T[K]['hasDefault'] extends false ? K : never]?: T[K]['type'];
  // } & {
  //   [K in keyof T as T[K]['hasDefault'] extends true ? K : never]: T[K]['type'];
};

export interface ConfigEntry<T> {
  value: T;
  source: ConfigValueSource;
}

export type GetConfigTypeFromSchema<S extends FirebaseConfigSchema> = {
  [K in keyof S]: S[K]['hasDefault'] extends true
    ? ConfigEntry<S[K]['type']>
    : ConfigEntry<S[K]['type'] | undefined>;
  // } & {
  //   [K in keyof T as T[K]['hasDefault'] extends false ? K : never]?: T[K]['type'];
  // } & {
  //   [K in keyof T as T[K]['hasDefault'] extends true ? K : never]: T[K]['type'];
};

// Schema creator
export function createSchema<S extends FirebaseConfigSchema>(schema: S): S {
  return schema;
}

export function getDefaultValuesFromSchema<S extends FirebaseConfigSchema>(
  schema: S
): Record<string, FirebaseConfigValueType> {
  const result: Record<string, FirebaseConfigValueType> = {};

  for (const [key, field] of Object.entries(schema)) {
    if (field.hasDefault) {
      result[key] = field.defaultValue!;
    }
  }

  return result;
}

export function getDefaultConfigFromSchema<S extends FirebaseConfigSchema>(
  schema: S
): GetConfigTypeFromSchema<S> {
  const result: Record<
    string,
    ConfigEntry<FirebaseConfigValueType | undefined>
  > = {};

  for (const [key, field] of Object.entries(schema)) {
    if (field.hasDefault) {
      result[key] = {
        value: field.defaultValue!,
        source: 'default',
      };
    } else {
      result[key] = {
        value: undefined,
        source: 'default',
      };
    }
  }

  return result as GetConfigTypeFromSchema<S>;
}

export type ConfigValueSource = 'remote' | 'default' | 'static';

// // Example usage
// const userSchema = createSchema({
//   age: numberType(30),
//   name: stringType(),
//   isAdmin: booleanType(false),
//   email: stringType(),
//   score: numberType()
// });
// type User = InferSchema<typeof userSchema>;

// Equivalent to:
// type User = {
//   age: number;
//   name?: string;
//   isAdmin: boolean;
//   email?: string;
//   score?: number;
// }
