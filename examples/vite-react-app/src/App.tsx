import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';

import { initializeApp } from 'firebase/app';

import {
  booleanType,
  createSchema,
  numberType,
  stringType,
  type ConfigEntry,
} from 'react-remote-config-context/firebase-schema';

import { createWebFirebaseAdapter } from 'react-remote-config-context/web';

import { createFirebaseRemoteConfigContext } from 'react-remote-config-context/context';

const configSchema = createSchema({
  maxValue: numberType(30),
  helloMessage: stringType('Hello from Default Value'),
  featureFlag: booleanType(false),
  limit: numberType(),
});

const firebaseConfig = {
  apiKey: 'AIzaSyCUW5iFuj8PdbI2FzJmvYKriZyyU6dsUOU',
  authDomain: 'react-remote-config-context.firebaseapp.com',
  projectId: 'react-remote-config-context',
  storageBucket: 'react-remote-config-context.firebasestorage.app',
  messagingSenderId: '772511651992',
  appId: '1:772511651992:web:60eedb3199088e69afd8ed',
  measurementId: 'G-SJL16X430L',
};

// Initialize Firebase
initializeApp(firebaseConfig);

const webFirebaseAdapter = createWebFirebaseAdapter(configSchema);

const { RemoteConfigProvider, useRemoteConfig } =
  createFirebaseRemoteConfigContext(webFirebaseAdapter);

function App() {
  return (
    <RemoteConfigProvider adapter={webFirebaseAdapter}>
      <Content />
    </RemoteConfigProvider>
  );
}

function Content() {
  const config = useRemoteConfig();

  return (
    <RemoteConfigProvider adapter={webFirebaseAdapter}>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
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
    </RemoteConfigProvider>
  );
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
