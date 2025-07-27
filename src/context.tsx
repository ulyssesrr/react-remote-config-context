import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type ConfigEntry,
  type FirebaseConfigSchema,
  type GetValuesTypeFromConfigSchema,
} from './firebase-schema';

type ValuesType = Record<string, unknown>;

export type ConfigTypeOf<T extends ValuesType> = {
  [K in keyof T]: ConfigEntry<T[K]>;
};

export type RemoteConfigAdapter<T extends ValuesType> = {
  initialize: () => Promise<void>;
  fetch: () => Promise<boolean>;
  getConfig: () => Promise<ConfigTypeOf<T>>;
  getDefaultConfig: () => ConfigTypeOf<T>;
};

export interface RemoteConfigProviderProps<T extends ValuesType> {
  adapter: RemoteConfigAdapter<T>;
  children: React.ReactNode;
}

export interface RemoteConfigContextProps<T extends ValuesType> {
  entries: ConfigTypeOf<T>;
  fetch: () => Promise<boolean>;
}

function getValuesFromConfig<T extends ValuesType>(config: ConfigTypeOf<T>): T {
  const out = {} as T;
  for (const key of Object.keys(config) as Array<keyof T>) {
    out[key] = config[key].value;
  }
  return out;
}

export function createDefaultConfig<T extends Record<string, unknown>>(
  obj: T
): ConfigTypeOf<T> {
  const out = {} as ConfigTypeOf<T>;
  for (const key of Object.keys(obj) as Array<keyof T>) {
    out[key] = {
      value: obj[key],
      source: 'default',
    };
  }
  return out;
}

export type RemoteConfigLoggerFuncion = (
  message?: unknown,
  ...optionalParams: unknown[]
) => void;
export interface RemoteConfigLogger {
  info: RemoteConfigLoggerFuncion;
  error: RemoteConfigLoggerFuncion;
}

export const DEFAULT_LOGGER: RemoteConfigLogger = {
  info: console.info,
  error: console.error,
};

export const NOOP_LOGGER: RemoteConfigLogger = {
  info: () => {},
  error: () => {},
};

export function createRemoteConfigContext<T extends Record<string, unknown>>(
  adapter: RemoteConfigAdapter<T>,
  logger = DEFAULT_LOGGER
) {
  const defaultConfig = adapter.getDefaultConfig();

  const RemoteConfigContext = createContext<RemoteConfigContextProps<T>>({
    entries: defaultConfig,
    fetch: adapter.fetch,
  });

  function RemoteConfigProvider({ children }: RemoteConfigProviderProps<T>) {
    const [entries, setEntries] = useState<ConfigTypeOf<T>>(defaultConfig);

    const fetch = async () => {
      const fetchedRemotely = await adapter.fetch();
      const configValues = await adapter.getConfig();
      setEntries(configValues);
      return fetchedRemotely;
    };

    useEffect(() => {
      const init = async () => {
        try {
          await adapter.initialize();
          fetch();
          logger.info('Remote Config context initialized!');
        } catch (e: unknown) {
          logger.error(e);
        }
      };
      init();
    }, []);

    return (
      <RemoteConfigContext.Provider
        value={{
          entries,
          fetch,
        }}
      >
        {children}
      </RemoteConfigContext.Provider>
    );
  }

  function useRemoteConfig() {
    const context = useContext(RemoteConfigContext);
    if (context === null) {
      throw new Error(
        'useRemoteConfig must be used within RemoteConfigProvider'
      );
    }
    return context;
  }

  function useRemoteConfigValues(): T {
    const context = useRemoteConfig();
    return getValuesFromConfig(context.entries);
  }

  return {
    RemoteConfigContext,
    RemoteConfigProvider,
    useRemoteConfig,
    useRemoteConfigValues,
  };
}

type ComputeType<T extends ValuesType> = T extends (...args: any[]) => any
  ? T
  : T extends abstract new (...args: any[]) => any
    ? T
    : { [K in keyof T]: T[K] };

export function createFirebaseRemoteConfigContext<
  S extends FirebaseConfigSchema,
  ConfigValuesType extends ValuesType = ComputeType<
    GetValuesTypeFromConfigSchema<S>
  >,
>(adapter: RemoteConfigAdapter<GetValuesTypeFromConfigSchema<S>>) {
  return createRemoteConfigContext<ConfigValuesType>(
    adapter as RemoteConfigAdapter<ConfigValuesType>
  );
}
