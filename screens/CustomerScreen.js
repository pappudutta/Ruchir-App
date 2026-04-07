import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { addCustomer, addCustomerPayment, getCustomers } from "../db";
import { formatCurrency } from "../utils/format";
import { colors, radii, shadows, spacing } from "../utils/ui";

export default function CustomerScreen({ navigation }) {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [paymentAmounts, setPaymentAmounts] = useState({});

  const loadCustomers = useCallback(async () => {
    const list = await getCustomers(search);
    setCustomers(list);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadCustomers();
    }, [loadCustomers])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={loadCustomers}>
          <Text style={styles.headerButton}>Refresh</Text>
        </TouchableOpacity>
      ),
    });
  }, [loadCustomers, navigation]);

  const saveCustomer = async () => {
    if (!name.trim()) {
      Alert.alert("Missing name", "Enter customer name.");
      return;
    }

    try {
      await addCustomer(name);
      setName("");
      await loadCustomers();
      Alert.alert("Saved", "Customer added successfully.");
    } catch (error) {
      Alert.alert("Save failed", error.message);
    }
  };

  const recordPayment = async (customerId) => {
    const amount = Number(paymentAmounts[customerId] || 0);

    if (!amount) {
      Alert.alert("Missing amount", "Enter payment amount.");
      return;
    }

    try {
      await addCustomerPayment({
        customerId,
        amount,
        note: "Payment received",
      });
      setPaymentAmounts((current) => ({ ...current, [customerId]: "" }));
      await loadCustomers();
      Alert.alert("Saved", "Payment recorded.");
    } catch (error) {
      Alert.alert("Payment failed", error.message);
    }
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={customers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Customers and udhar</Text>
              <Text style={styles.sectionSubtitle}>
                Search customers, add new names quickly, and record repayments without leaving the screen.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Search customer"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={loadCustomers}
              />
              <TextInput
                style={styles.input}
                placeholder="New customer name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              <TouchableOpacity style={styles.addButton} onPress={saveCustomer}>
                <Text style={styles.addButtonText}>Add customer</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Customer list</Text>
              <Text style={styles.sectionSubtitle}>
                Open a customer to see history, or record payment directly below.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.customerCard}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("CustomerHistory", {
                  customerId: item.id,
                  customerName: item.name,
                })
              }
            >
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.balanceText}>Balance: {formatCurrency(item.balance)}</Text>
              <Text style={styles.historyLink}>View full history</Text>
            </TouchableOpacity>

            <View style={styles.paymentSection}>
              <TextInput
                style={styles.input}
                placeholder="Payment amount"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={paymentAmounts[item.id] || ""}
                onChangeText={(value) =>
                  setPaymentAmounts((current) => ({ ...current, [item.id]: value }))
                }
              />
              <TouchableOpacity style={styles.payButton} onPress={() => recordPayment(item.id)}>
                <Text style={styles.payButtonText}>Mark payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerStack: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  listHeader: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    minHeight: 54,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.md,
  },
  addButton: {
    backgroundColor: colors.accent,
    minHeight: 56,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  customerCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  customerName: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
  },
  balanceText: {
    fontSize: 16,
    color: colors.warning,
    marginTop: 6,
    fontWeight: "800",
  },
  historyLink: {
    color: colors.primary,
    marginTop: 6,
    fontWeight: "700",
  },
  paymentSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "#ebf0f8",
  },
  payButton: {
    backgroundColor: colors.success,
    minHeight: 52,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  payButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xl,
  },
  headerButton: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
  },
});
