import React, { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { getCustomers, getProductByBarcode, getProducts, saveSale } from "../db";
import { formatCurrency } from "../utils/format";
import { colors, radii, shadows, spacing } from "../utils/ui";

const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"];

export default function SaleScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentType, setPaymentType] = useState("cash");
  const [customerId, setCustomerId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [cart]
  );

  const loadData = useCallback(async () => {
    const [productList, customerList] = await Promise.all([getProducts(search), getCustomers()]);
    setProducts(productList);
    setCustomers(customerList);
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={loadData}>
          <Text style={styles.headerButton}>Refresh</Text>
        </TouchableOpacity>
      ),
    });
  }, [loadData, navigation]);

  const addToCart = (product) => {
    if (product.stockQty <= 0) {
      Alert.alert("Out of stock", `${product.name} has no stock left.`);
      return;
    }

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stockQty) {
          Alert.alert("Stock limit", `Only ${product.stockQty} items available.`);
          return current;
        }

        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          quantity: 1,
          stockQty: Number(product.stockQty),
        },
      ];
    });
  };

  const changeQuantity = (productId, delta) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.id !== productId) {
            return item;
          }

          const nextQty = item.quantity + delta;

          if (nextQty <= 0) {
            return null;
          }

          if (nextQty > item.stockQty) {
            Alert.alert("Stock limit", `Only ${item.stockQty} items available.`);
            return item;
          }

          return { ...item, quantity: nextQty };
        })
        .filter(Boolean)
    );
  };

  const openScanner = async () => {
    if (!cameraPermission?.granted) {
      const response = await requestCameraPermission();
      if (!response.granted) {
        Alert.alert("Permission needed", "Allow camera access to scan barcode.");
        return;
      }
    }

    setScannerVisible(true);
  };

  const handleScannedBarcode = async (barcode) => {
    setScannerVisible(false);
    const product = await getProductByBarcode(barcode);

    if (!product) {
      Alert.alert("Not found", "No product found for this barcode.");
      return;
    }

    addToCart(product);
  };

  const submitSale = async () => {
    if (!cart.length) {
      Alert.alert("Empty sale", "Add at least one product.");
      return;
    }

    if (paymentType === "udhar" && !customerId) {
      Alert.alert("Customer needed", "Select a customer for udhar sale.");
      return;
    }

    try {
      setSaving(true);
      await saveSale({
        items: cart,
        paymentType,
        customerId,
      });
      setCart([]);
      setPaymentType("cash");
      setCustomerId(null);
      await loadData();
      Alert.alert("Saved", "Sale saved successfully.");
    } catch (error) {
      Alert.alert("Sale failed", error.message);
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
              <Text style={styles.sectionTitle}>Create sale</Text>
              <Text style={styles.sectionSubtitle}>
                Search items fast, scan barcodes, and save cash or udhar bills with fewer taps.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Search product by name or barcode"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={loadData}
              />

              <TouchableOpacity style={styles.scanButton} onPress={openScanner}>
                <Text style={styles.scanButtonText}>Scan barcode</Text>
              </TouchableOpacity>

              <Text style={styles.subheading}>Payment type</Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity
                  style={[styles.typeButton, paymentType === "cash" && styles.typeButtonActive]}
                  onPress={() => setPaymentType("cash")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      paymentType === "cash" && styles.typeButtonTextActive,
                    ]}
                  >
                    Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, paymentType === "udhar" && styles.typeButtonActive]}
                  onPress={() => setPaymentType("udhar")}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      paymentType === "udhar" && styles.typeButtonTextActive,
                    ]}
                  >
                    Udhar
                  </Text>
                </TouchableOpacity>
              </View>

              {paymentType === "udhar" ? (
                <View style={styles.customerSection}>
                  <Text style={styles.subheading}>Select customer</Text>
                  <View style={styles.customerList}>
                    {customers.map((customer) => (
                      <TouchableOpacity
                        key={customer.id}
                        style={[
                          styles.customerChip,
                          customerId === customer.id && styles.customerChipActive,
                        ]}
                        onPress={() => setCustomerId(customer.id)}
                      >
                        <Text
                          style={[
                            styles.customerChipText,
                            customerId === customer.id && styles.customerChipTextActive,
                          ]}
                        >
                          {customer.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {!customers.length ? (
                      <Text style={styles.smallMutedText}>
                        Add customers first for udhar sales.
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.card}>
              <View style={styles.cartHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Cart</Text>
                  <Text style={styles.sectionSubtitle}>
                    Review quantities before saving the sale.
                  </Text>
                </View>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalBadgeLabel}>Total</Text>
                  <Text style={styles.totalBadgeValue}>{formatCurrency(total)}</Text>
                </View>
              </View>

              {cart.length ? (
                cart.map((item) => (
                  <View key={item.id} style={styles.cartRow}>
                    <View style={styles.cartInfo}>
                      <Text style={styles.cartName}>{item.name}</Text>
                      <Text style={styles.smallMutedText}>
                        {formatCurrency(item.price)} x {item.quantity}
                      </Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => changeQuantity(item.id, -1)}
                      >
                        <Text style={styles.qtyButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => changeQuantity(item.id, 1)}
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.smallMutedText}>No items selected yet.</Text>
              )}

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.disabledButton]}
                onPress={submitSale}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save sale"}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Products</Text>
              <Text style={styles.sectionSubtitle}>
                Tap any product below to add it straight to the cart.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.productCard} onPress={() => addToCart(item)}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.smallMutedText}>{formatCurrency(item.price)}</Text>
              <Text style={styles.smallMutedText}>Stock: {item.stockQty}</Text>
            </View>
            <View style={styles.addPill}>
              <Text style={styles.addText}>Add</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
      />

      <Modal visible={scannerVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
            onBarcodeScanned={({ data }) => handleScannedBarcode(data)}
          />
          <TouchableOpacity style={styles.closeButton} onPress={() => setScannerVisible(false)}>
            <Text style={styles.closeButtonText}>Close scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  subheading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: "#f8fbff",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.sm,
    minHeight: 54,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  scanButton: {
    backgroundColor: "#0f766e",
    minHeight: 54,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
  paymentRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeButton: {
    flex: 1,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fbff",
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  typeButtonTextActive: {
    color: "#ffffff",
  },
  customerSection: {
    marginTop: spacing.md,
  },
  customerList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  customerChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.pill,
  },
  customerChipActive: {
    backgroundColor: colors.accent,
  },
  customerChipText: {
    color: colors.text,
    fontWeight: "700",
  },
  customerChipTextActive: {
    color: "#ffffff",
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  totalBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: "flex-start",
  },
  totalBadgeLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  totalBadgeValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
    marginTop: 2,
  },
  cartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#ebf0f8",
  },
  cartInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  cartName: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  qtyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primary,
  },
  qtyText: {
    fontSize: 18,
    fontWeight: "800",
    minWidth: 24,
    textAlign: "center",
    color: colors.text,
  },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.success,
    minHeight: 56,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
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
  productInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  productName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  addPill: {
    backgroundColor: "#dcfce7",
    borderRadius: radii.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addText: {
    color: colors.success,
    fontWeight: "800",
    fontSize: 15,
  },
  smallMutedText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xl,
  },
  disabledButton: {
    opacity: 0.7,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    backgroundColor: colors.primary,
    margin: spacing.md,
    borderRadius: radii.md,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  headerButton: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
});
