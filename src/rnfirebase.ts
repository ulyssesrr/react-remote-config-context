import { ReactNativeFirebase } from '@react-native-firebase/app';
import {
  fetchAndActivate,
  FirebaseRemoteConfigTypes,
  getAll,
  getRemoteConfig,
  setConfigSettings,
  setDefaults,
} from '@react-native-firebase/remote-config';
import type { ConfigTypeOf, RemoteConfigAdapter } from './context';
import {
  getDefaultConfigFromSchema,
  getDefaultValuesFromSchema,
  type ConfigEntry,
  type FirebaseConfigSchema,
  type FirebaseConfigValueType,
  type GetConfigTypeFromSchema,
  type GetValuesTypeFromConfigSchema,
} from './firebase-schema';

export type GetConfigValueType = (
  configValues: FirebaseRemoteConfigTypes.ConfigValues,
  key: string
) => FirebaseRemoteConfigTypes.ConfigValue | undefined;

export const defaultGetConfigValue: GetConfigValueType = (
  configValues: FirebaseRemoteConfigTypes.ConfigValues,
  key: string
) => {
  return configValues[key];
};

export function parseConfigValues<S extends FirebaseConfigSchema>(
  schema: S,
  configValues: FirebaseRemoteConfigTypes.ConfigValues,
  getValueFromConfig = defaultGetConfigValue
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
export interface ReactNativeFirebaseAdapterOptions {
  app?: ReactNativeFirebase.FirebaseApp;
  settings?: FirebaseRemoteConfigTypes.ConfigSettings;
  defaultValuesParser: <S extends FirebaseConfigSchema>(
    schema: S
  ) => Record<string, FirebaseConfigValueType>;
  getConfigValue: GetConfigValueType;
  remoteConfigValuesParser: <S extends FirebaseConfigSchema>(
    schema: S,
    configValues: FirebaseRemoteConfigTypes.ConfigValues,
    getValueFromConfig: GetConfigValueType
  ) => GetConfigTypeFromSchema<S>;
}

export function createReactNativeFirebaseAdapter<
  S extends FirebaseConfigSchema,
>(
  schema: S,
  options?: Partial<ReactNativeFirebaseAdapterOptions>
): RemoteConfigAdapter<GetValuesTypeFromConfigSchema<S>> {
  const opts: ReactNativeFirebaseAdapterOptions = {
    app: options?.app,
    settings: options?.settings,
    defaultValuesParser:
      options?.defaultValuesParser || getDefaultValuesFromSchema,
    getConfigValue: options?.getConfigValue || defaultGetConfigValue,
    remoteConfigValuesParser:
      options?.remoteConfigValuesParser || parseConfigValues,
  };
  const defaultValues = opts.defaultValuesParser(schema);
  return {
    async initialize() {
      const remoteConfig = getRemoteConfig(opts.app);
      if (opts.settings) {
        setConfigSettings(remoteConfig, opts.settings);
      }
      await setDefaults(remoteConfig, defaultValues);
    },
    async fetch() {
      const remoteConfig = getRemoteConfig(opts.app);
      return fetchAndActivate(remoteConfig);
    },
    getDefaultConfig() {
      const config = getDefaultConfigFromSchema(schema);
      return config as ConfigTypeOf<GetValuesTypeFromConfigSchema<S>>;
    },
    async getConfig() {
      const remoteConfig = getRemoteConfig(opts.app);
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
