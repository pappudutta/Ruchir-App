import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getCustomerHistory } from "../db";
import { formatDateTime } from "../utils/date";
import { formatCurrency } from "../utils/format";
import { colors, radii, shadows, spacing } from "../utils/ui";

export default function CustomerHistoryScreen({ route, navigation }) {
  const { customerId, customerName } = route.params;
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    const list = await getCustomerHistory(customerId);
    setHistory(list);
    navigation.setOptions({ title: customerName });
  }, [customerId, customerName, navigation]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  return (
    <FlatList
      data={history}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>
            Track udhar sales and payments in one clean timeline.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.typeText}>{item.type === "sale" ? "Udhar sale" : "Payment"}</Text>
            <Text
              style={[
                styles.amountText,
                item.type === "sale" ? styles.saleAmount : styles.paymentAmount,
              ]}
            >
              {item.type === "sale" ? "+" : "-"} {formatCurrency(item.amount)}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDateTime(item.createdAt)}</Text>
          {item.note ? <Text style={styles.noteText}>{item.note}</Text> : null}
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No customer history found.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  typeText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "700",
  },
  amountText: {
    fontSize: 24,
    fontWeight: "800",
  },
  saleAmount: {
    color: colors.danger,
  },
  paymentAmount: {
    color: colors.success,
  },
  dateText: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xl,
  },
});
