import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radii, shadows, spacing } from "../utils/ui";

const actions = [
  {
    title: "Products",
    subtitle: "Add items, price them, and keep stock updated.",
    route: "Products",
    color: "#2563eb",
  },
  {
    title: "New Sale",
    subtitle: "Create a bill quickly and handle cash or udhar.",
    route: "Sale",
    color: "#15803d",
  },
  {
    title: "Purchase",
    subtitle: "Update stock when new items arrive.",
    route: "Purchase",
    color: "#c2410c",
  },
  {
    title: "Customers",
    subtitle: "Manage balances and record payments clearly.",
    route: "Customers",
    color: "#7c3aed",
  },
  {
    title: "Reports",
    subtitle: "Check daily numbers and export your records.",
    route: "Reports",
    color: "#0f766e",
  },
];

export default function HomeScreen({ navigation }) {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Offline ready</Text>
        </View>
        <Text style={styles.heroTitle}>Ruchi Bill Book</Text>
        <Text style={styles.heroSubtitle}>
          Keep billing, stock, purchases, udhar, and reports organized in one simple workflow.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Quick actions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Place to manage shop records</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Choose what you want to do</Text>
        <Text style={styles.sectionSubtitle}>
          Bigger cards, clearer labels, and more breathing room for faster navigation.
        </Text>
      </View>

      <View style={styles.actionList}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.route}
            style={styles.actionCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate(action.route)}
          >
            <View style={[styles.actionAccent, { backgroundColor: action.color }]} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <View style={[styles.actionPill, { backgroundColor: action.color }]}>
              <Text style={styles.actionPillText}>Open</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadows.card,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: spacing.md,
  },
  heroBadgeText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  heroStats: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 18,
  },
  sectionHeader: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: 6,
  },
  actionList: {
    gap: spacing.md,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.card,
  },
  actionAccent: {
    width: 12,
    alignSelf: "stretch",
    borderRadius: radii.sm,
    marginRight: spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: colors.text,
  },
  actionSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: 4,
  },
  actionPill: {
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: spacing.md,
  },
  actionPillText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
