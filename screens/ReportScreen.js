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
import {
  getDailyTotals,
  getExportData,
  getRecentPurchases,
  getRecentSales,
} from "../db";
import { exportDatabaseCsv } from "../utils/csv";
import { toDateInputValue, formatDateTime } from "../utils/date";
import { formatCurrency } from "../utils/format";
import { colors, radii, shadows, spacing } from "../utils/ui";

export default function ReportScreen({ navigation }) {
  const [date, setDate] = useState(toDateInputValue());
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPurchase: 0,
    profit: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [exporting, setExporting] = useState(false);

  const loadReports = useCallback(async () => {
    const [daily, sales, purchases] = await Promise.all([
      getDailyTotals(date),
      getRecentSales(),
      getRecentPurchases(),
    ]);

    setSummary(daily);
    setRecentSales(sales);
    setRecentPurchases(purchases);
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={loadReports}>
          <Text style={styles.headerButton}>Refresh</Text>
        </TouchableOpacity>
      ),
    });
  }, [loadReports, navigation]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await getExportData();
      await exportDatabaseCsv(data);
    } catch (error) {
      Alert.alert("Export failed", error.message);
    } finally {
      setExporting(false);
    }
  };

  const entries = [
    ...recentSales.map((item) => ({ ...item, section: "sale" })),
    ...recentPurchases.map((item) => ({ ...item, section: "purchase" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const summaryCards = [
    { label: "Total sales", value: summary.totalSales, accent: colors.primary },
    { label: "Total purchase", value: summary.totalPurchase, accent: colors.warning },
    { label: "Profit", value: summary.profit, accent: colors.success },
  ];

  return (
    <FlatList
      data={entries}
      keyExtractor={(item) => `${item.section}-${item.id}`}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.headerStack}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Daily report</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a date to review totals, then scroll down to recent sales and purchase entries.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={date}
              onChangeText={setDate}
              onSubmitEditing={loadReports}
            />

            <View style={styles.summaryGrid}>
              {summaryCards.map((item) => (
                <View key={item.label} style={styles.summaryCard}>
                  <View style={[styles.summaryDot, { backgroundColor: item.accent }]} />
                  <Text style={styles.summaryLabel}>{item.label}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(item.value)}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.exportButton, exporting && styles.disabledButton]}
              onPress={handleExport}
              disabled={exporting}
            >
              <Text style={styles.exportButtonText}>
                {exporting ? "Exporting..." : "Export backup CSV"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Recent entries</Text>
            <Text style={styles.sectionSubtitle}>
              Latest sales and purchases are combined below in time order.
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.entryCard}>
          <View style={styles.entryRow}>
            <Text style={styles.entryTitle}>
              {item.section === "sale" ? "Sale" : "Purchase"} #{item.id}
            </Text>
            <Text style={styles.entryAmount}>{formatCurrency(item.total)}</Text>
          </View>
          <Text style={styles.entryMeta}>
            {item.section === "sale"
              ? `${item.paymentType.toUpperCase()}${item.customerName ? ` - ${item.customerName}` : ""}`
              : item.productName}
          </Text>
          <Text style={styles.entryMeta}>{formatDateTime(item.createdAt)}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyText}>No sales or purchases yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  container: {
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
  summaryGrid: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  summaryCard: {
    backgroundColor: "#f8fbff",
    borderRadius: radii.md,
    padding: spacing.md,
  },
  summaryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 15,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4,
  },
  exportButton: {
    backgroundColor: "#0f766e",
    minHeight: 56,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  exportButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.7,
  },
  entryCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  entryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  entryAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.primary,
  },
  entryMeta: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: spacing.xs,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xl,
  },
  headerButton: {
    color: "#0f766e",
    fontWeight: "700",
    fontSize: 15,
  },
});
