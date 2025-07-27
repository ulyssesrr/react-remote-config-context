import type { ConfigTypeOf, RemoteConfigAdapter } from './context';
import {
  fetchAndActivate,
  getAll,
  getRemoteConfig,
  type Value as FBWebConfigValue,
  type RemoteConfigOptions,
} from 'firebase/remote-config';
import {
  getDefaultConfigFromSchema,
  getDefaultValuesFromSchema,
  type ConfigEntry,
  type FirebaseConfigSchema,
  type FirebaseConfigValueType,
  type GetConfigTypeFromSchema,
  type GetValuesTypeFromConfigSchema,
} from './firebase-schema';
import type { FirebaseApp } from 'firebase/app';

export interface FBWebConfigValues {
  [key: string]: FBWebConfigValue;
}

export type GetFBWebConfigValueType = (
  configValues: FBWebConfigValues,
  key: string
) => FBWebConfigValue | undefined;

export const defaultGetConfigValueWeb: GetFBWebConfigValueType = (
  configValues: FBWebConfigValues,
  key: string
) => {
  return configValues[key];
};

export function parseConfigValuesWeb<S extends FirebaseConfigSchema>(
  schema: S,
  configValues: FBWebConfigValues,
  getValueFromConfig = defaultGetConfigValueWeb
): GetConfigTypeFromSchema<S> {
  const result: Record<
    string,
    ConfigEntry<FirebaseConfigValueType | undefined>
  > = {};

  for (const [key, field] of Object.entries(schema)) {
    const configValue = getValueFromConfig(configValues, key);

    if (configValue !== undefined) {
      // Extract the actual value based on the field type
      if (typeof field.type === 'number') {
        result[key] = {
          value: configValue.asNumber(),
          source: configValue.getSource(),
        };
      } else if (typeof field.type === 'string') {
        result[key] = {
          value: configValue.asString(),
          source: configValue.getSource(),
        };
      } else if (typeof field.type === 'boolean') {
        result[key] = {
          value: configValue.asBoolean(),
          source: configValue.getSource(),
        };
      }
    } else if (field.hasDefault) {
      // Use default value if config value is missing
      result[key] = {
        value: field.defaultValue,
        source: 'default',
      };
    } else {
      // Field is optional and still not present
      // we consider the initial undefined value as 'default'
      result[key] = {
        value: undefined,
        source: 'default',
      };
    }
  }

  // remote values not in schema
  for (const key of Object.keys(configValues) as Array<
    keyof typeof configValues
  >) {
    if (!(key in result)) {
      //console.log('ADDING KEY:', key, configValues[key]?.asString());
      result[key] = {
        value: configValues[key]?.asString(),
        source: 'remote',
      };
    }
  }

  return result as GetConfigTypeFromSchema<S>;
}
export interface ReactNativeWebAdapterOptions {
  app?: FirebaseApp;
  settings?: RemoteConfigOptions;
  defaultValuesParser: <S extends FirebaseConfigSchema>(
    schema: S
  ) => Record<string, FirebaseConfigValueType>;
  getConfigValue: GetFBWebConfigValueType;
  remoteConfigValuesParser: <S extends FirebaseConfigSchema>(
    schema: S,
    configValues: Record<string, FBWebConfigValue>,
    getValueFromConfig: GetFBWebConfigValueType
  ) => GetConfigTypeFromSchema<S>;
}

export function createWebFirebaseAdapter<S extends FirebaseConfigSchema>(
  schema: S,
  options?: ReactNativeWebAdapterOptions
): RemoteConfigAdapter<GetValuesTypeFromConfigSchema<S>> {
  const opts: ReactNativeWebAdapterOptions = {
    app: options?.app,
    settings: options?.settings,
    defaultValuesParser:
      options?.defaultValuesParser || getDefaultValuesFromSchema,
    getConfigValue: options?.getConfigValue || defaultGetConfigValueWeb,
    remoteConfigValuesParser:
      options?.remoteConfigValuesParser || parseConfigValuesWeb,
  };
  const defaultValues = opts.defaultValuesParser(schema);
  return {
    async initialize() {
      const remoteConfig = getRemoteConfig(opts.app, opts.settings);
      remoteConfig.defaultConfig = defaultValues;
    },
    async fetch() {
      const remoteConfig = getRemoteConfig(opts.app, opts.settings);
      return fetchAndActivate(remoteConfig);
    },
    getDefaultConfig() {
      const config = getDefaultConfigFromSchema(schema);
      return config as ConfigTypeOf<GetValuesTypeFromConfigSchema<S>>;
    },
    async getConfig() {
      const remoteConfig = getRemoteConfig(opts.app, opts.settings);
      const all = getAll(remoteConfig);
      const config = opts.remoteConfigValuesParser(
        schema,
        all,
        opts.getConfigValue
      );
      return config as Promise<ConfigTypeOf<GetValuesTypeFromConfigSchema<S>>>;
    },
  };
}
