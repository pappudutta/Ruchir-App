import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "./db";
import { colors, radii } from "./utils/ui";
import HomeScreen from "./screens/HomeScreen";
import ProductScreen from "./screens/ProductScreen";
import SaleScreen from "./screens/SaleScreen";
import PurchaseScreen from "./screens/PurchaseScreen";
import CustomerScreen from "./screens/CustomerScreen";
import CustomerHistoryScreen from "./screens/CustomerHistoryScreen";
import ReportScreen from "./screens/ReportScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
        setReady(true);
      } catch (setupError) {
        setError(setupError.message || "Database setup failed");
      }
    };

    setup();
  }, []);

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Ruchi Bill Book</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={styles.loadingText}>Preparing offline database...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "800", fontSize: 20 },
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Ruchi Bill Book" }}
        />
        <Stack.Screen name="Products" component={ProductScreen} />
        <Stack.Screen name="Sale" component={SaleScreen} />
        <Stack.Screen name="Purchase" component={PurchaseScreen} />
        <Stack.Screen name="Customers" component={CustomerScreen} />
        <Stack.Screen
          name="CustomerHistory"
          component={CustomerHistoryScreen}
          options={{ title: "Customer History" }}
        />
        <Stack.Screen name="Reports" component={ReportScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textMuted,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.danger,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
});
