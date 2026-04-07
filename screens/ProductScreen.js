import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import { addProduct, getProducts } from "../db";
import { formatCurrency } from "../utils/format";
import { colors, radii, shadows, spacing } from "../utils/ui";

const BARCODE_TYPES = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39"];

export default function ProductScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stockQty, setStockQty] = useState("");
  const [barcode, setBarcode] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [saving, setSaving] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

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

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow gallery access to select product image.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets?.length) {
      setImageUri(result.assets[0].uri);
    }
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

  const saveProduct = async () => {
    if (!name.trim() || !price || !stockQty) {
      Alert.alert("Missing details", "Please enter product name, price, and stock quantity.");
      return;
    }

    try {
      setSaving(true);
      await addProduct({
        name,
        price: Number(price),
        stockQty: Number(stockQty),
        imageUri,
        barcode: barcode.trim(),
      });

      setName("");
      setPrice("");
      setStockQty("");
      setBarcode("");
      setImageUri("");
      await loadProducts();
      Alert.alert("Saved", "Product added successfully.");
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
          <View style={styles.headerContent}>
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Add product</Text>
              <Text style={styles.sectionSubtitle}>
                Search existing items, then add new products with price, stock, barcode, and photo.
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Search product"
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                onSubmitEditing={loadProducts}
              />
              <TextInput
                style={styles.input}
                placeholder="Product name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              <View style={styles.twoColumnRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Price"
                  placeholderTextColor={colors.textMuted}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Stock quantity"
                  placeholderTextColor={colors.textMuted}
                  value={stockQty}
                  onChangeText={setStockQty}
                  keyboardType="number-pad"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Barcode (manual)"
                placeholderTextColor={colors.textMuted}
                value={barcode}
                onChangeText={setBarcode}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
                  <Text style={styles.secondaryButtonText}>
                    {imageUri ? "Change image" : "Pick image"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={openScanner}>
                  <Text style={styles.secondaryButtonText}>Scan barcode</Text>
                </TouchableOpacity>
              </View>

              {imageUri ? (
                <View style={styles.previewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                  <Text style={styles.helperText}>Selected image preview</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabledButton]}
                disabled={saving}
                onPress={saveProduct}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? "Saving..." : "Save product"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Product list</Text>
              <Text style={styles.sectionSubtitle}>
                Tap refresh anytime if stock or pricing has changed.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.productCard}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productMeta}>{formatCurrency(item.price)}</Text>
              <Text style={styles.productMeta}>Stock: {item.stockQty}</Text>
              <Text style={styles.productMeta}>Barcode: {item.barcode || "-"}</Text>
            </View>
            {item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.productImage} /> : null}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No products found.</Text>}
      />

      <Modal visible={scannerVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: BARCODE_TYPES }}
            onBarcodeScanned={({ data }) => {
              setBarcode(data);
              setScannerVisible(false);
            }}
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
  headerContent: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    ...shadows.card,
  },
  listHeader: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
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
    marginBottom: spacing.md,
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
    marginBottom: spacing.sm,
  },
  twoColumnRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  halfInput: {
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
  previewWrap: {
    alignItems: "flex-start",
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  previewImage: {
    width: 110,
    height: 110,
    borderRadius: radii.md,
  },
  helperText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 13,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    minHeight: 56,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  primaryButtonText: {
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
  productMeta: {
    fontSize: 15,
    color: colors.textMuted,
    marginTop: 2,
  },
  productImage: {
    width: 78,
    height: 78,
    borderRadius: radii.md,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xl,
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
