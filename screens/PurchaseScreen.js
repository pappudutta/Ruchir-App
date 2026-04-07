import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getProducts, savePurchase } from "../db";
import { formatCurrency } from "../utils/format";
import { colors, radii, shadows, spacing } from "../utils/ui";

export default function PurchaseScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProducts = useCallback(async () => {
    const list = await getProducts(search);
    setProducts(list);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={loadProducts}>
          <Text style={styles.headerButton}>Refresh</Text>
        </TouchableOpacity>
      ),
    });
  }, [loadProducts, navigation]);

  const saveEntry = async () => {
    if (!selectedProduct || !quantity || !costPrice) {
      Alert.alert("Missing details", "Select a product and enter quantity and cost price.");
      return;
    }

    try {
      setSaving(true);
      await savePurchase({
        productId: selectedProduct.id,
        quantity: Number(quantity),
        costPrice: Number(costPrice),
      });
      setSelectedProduct(null);
      setQuantity("");
      setCostPrice("");
      await loadProducts();
      Alert.alert("Saved", "Purchase entry saved and stock updated.");
    } catch (error) {
      Alert.alert("Save failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Add stock</Text>
              <Text style={styles.sectionSubtitle}>
                Choose a product, enter incoming quantity and cost price, then update stock in one step.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Search product"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={loadProducts}
              />
              <View style={styles.selectedCard}>
                <Text style={styles.selectedLabel}>Selected product</Text>
                <Text style={styles.selectedValue}>
                  {selectedProduct ? selectedProduct.name : "Choose from the list below"}
                </Text>
              </View>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Quantity to add"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Cost price"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="decimal-pad"
                  value={costPrice}
                  onChangeText={setCostPrice}
                />
              </View>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={saveEntry}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save purchase entry"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Products</Text>
              <Text style={styles.sectionSubtitle}>
                Tap a product to select it before recording the purchase.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.productCard, selectedProduct?.id === item.id && styles.productCardActive]}
            onPress={() => setSelectedProduct(item)}
          >
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.metaText}>Selling price: {formatCurrency(item.price)}</Text>
              <Text style={styles.metaText}>Current stock: {item.stockQty}</Text>
            </View>
            <View
              style={[
                styles.selectPill,
                selectedProduct?.id === item.id && styles.selectPillActive,
              ]}
            >
              <Text
                style={[
                  styles.selectText,
                  selectedProduct?.id === item.id && styles.selectTextActive,
                ]}
              >
                {selectedProduct?.id === item.id ? "Selected" : "Select"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
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
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  selectedCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  selectedLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  selectedValue: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: colors.warning,
    minHeight: 56,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  disabledButton: {
    opacity: 0.7,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...shadows.card,
  },
  productCardActive: {
    borderWidth: 2,
    borderColor: colors.warning,
  },
  productInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  productName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 4,
  },
  selectPill: {
    backgroundColor: "#ffedd5",
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  selectPillActive: {
    backgroundColor: colors.warning,
  },
  selectText: {
    color: colors.warning,
    fontWeight: "800",
    fontSize: 15,
  },
  selectTextActive: {
    color: "#ffffff",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  headerButton: {
    color: colors.warning,
    fontWeight: "700",
    fontSize: 15,
  },
});
