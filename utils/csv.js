import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value).replace(/"/g, '""');

  return `"${text}"`;
};

const toCsv = (rows) => {
  if (!rows.length) {
    return "";
  }

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];

  return lines.join("\n");
};

export const exportDatabaseCsv = async (tables) => {
  const sections = Object.entries(tables)
    .map(([tableName, rows]) => {
      const csvBlock = toCsv(rows);
      return `# ${tableName}\n${csvBlock}`;
    })
    .join("\n\n");

  const fileName = `ruchi-bill-book-backup-${Date.now()}.csv`;
  const localUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(localUri, sections, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (Platform.OS === "android") {
    const permission = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (permission.granted) {
      const targetUri = await FileSystem.StorageAccessFramework.createFileAsync(
        permission.directoryUri,
        fileName,
        "text/csv"
      );

      await FileSystem.writeAsStringAsync(targetUri, sections, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert("Backup saved", "CSV file saved to selected folder.");
      return;
    }
  }

  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(localUri, {
      mimeType: "text/csv",
      dialogTitle: "Export CSV Backup",
    });
    return;
  }

  Alert.alert("Backup saved", `File stored at ${localUri}`);
};
