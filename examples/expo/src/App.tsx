import {
  Text,
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    flex: 1,
    backgroundColor: '#cccccc',
    padding: 5,
    marginVertical: 2,
    marginHorizontal: 2,
  },
  title: {
    fontSize: 12,
    marginVertical: 2,
    marginHorizontal: 2,
  },
});
