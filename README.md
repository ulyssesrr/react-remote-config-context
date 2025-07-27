# react-remote-config-context

Lightweight React/React Native library that provides a typed, schema-validated interface to Firebase Remote Config through React Context.

## Installation

```sh
npm install react-remote-config-context
```

## Usage


### React (Web)

See [complete example](examples/vite-react-app/src/App.tsx)

Install firebase (see [complete docs](https://firebase.google.com/docs/web/setup#add-sdk-and-initialize))
```sh
npm install firebase
```

```js
import { initializeApp } from "firebase/app";

import { booleanType, createSchema, numberType, stringType, type ConfigEntry } from 'react-remote-config-context/firebase-schema';
import { createWebFirebaseAdapter } from 'react-remote-config-context/web';
import { createFirebaseRemoteConfigContext } from 'react-remote-config-context/context';

// define config schema and default values
const configSchema = createSchema({
  maxValue: numberType(30),
  helloMessage: stringType('Hello from Default Value'),
  featureFlag: booleanType(false),
  limit: numberType(),
});

const firebaseConfig = {
  // your firebase config
};

// Initialize Firebase
initializeApp(firebaseConfig);

// create context adapter
const webFirebaseAdapter = createWebFirebaseAdapter(configSchema);

// create context
const { RemoteConfigProvider, useRemoteConfig } =
  createFirebaseRemoteConfigContext(webFirebaseAdapter);

function App() {
  // wrap components with RemoteConfigProvider
  return (
    <RemoteConfigProvider adapter={webFirebaseAdapter}>
      <Content/>
    </RemoteConfigProvider>
  )
}

function Content() {
  // get config
  const config = useRemoteConfig();

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Source</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(config.entries).map(([configKey, entry]) => (
            <Row key={configKey} configKey={configKey} entry={entry} />
          ))}
        </tbody>
      </table>
    </>
  )
}

type RowProps = { configKey: string; entry: ConfigEntry<unknown> };

const Row = ({ configKey, entry }: RowProps) => (
  <tr>
    <td>{configKey}</td>
    <td>{entry.source}</td>
    <td>{String(entry.value)}</td>
  </tr>
);

export default App;
```

### Expo/React Native

See [complete example](examples/expo/src/App.tsx)

1. [Install React Native Firebase](https://rnfirebase.io/#installation-for-expo-projects)
2. [Install Remote Config Module](https://rnfirebase.io/remote-config/usage#installation)
3. Expo: Make sure to [configure your Expo app config](https://rnfirebase.io/#configure-react-native-firebase-modules).

```js
import {
  booleanType,
  createFirebaseRemoteConfigContext,
  createReactNativeFirebaseAdapter,
  createSchema,
  numberType,
  stringType,
  type ConfigEntry,
} from 'react-remote-config-context';

const configSchema = createSchema({
  maxValue: numberType(30),
  helloMessage: stringType('Hello from Default Value'),
  featureFlag: booleanType(false),
  limit: numberType(),
});

const rnFirebaseAdapter = createReactNativeFirebaseAdapter(configSchema);

const { RemoteConfigProvider, useRemoteConfig } =
  createFirebaseRemoteConfigContext(rnFirebaseAdapter);

export default function App() {
  return (
    <RemoteConfigProvider adapter={rnFirebaseAdapter}>
      <Body />
    </RemoteConfigProvider>
  );
}

function Body() {
  const config = useRemoteConfig();
  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={Object.entries(config.entries)}
        renderItem={({ item }) => <Item configKey={item[0]} entry={item[1]} />}
        keyExtractor={(item) => item[0]}
      />
    </SafeAreaView>
  );
}

type ItemProps = { configKey: string; entry: ConfigEntry<unknown> };

const Item = ({ configKey, entry }: ItemProps) => (
  <View style={styles.item}>
    <Text style={styles.title}>Key: {configKey}</Text>
    <Text style={styles.title}>Source: {entry.source}</Text>
    <Text style={styles.title}>Value: {String(entry.value)}</Text>
  </View>
);
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
