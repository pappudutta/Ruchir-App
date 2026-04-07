# Ruchi Bill Book

Offline Android shop billing app built with Expo React Native and SQLite.

## Features

- Product management with image and barcode
- Sale entry with cash and udhar
- Purchase entry to increase stock
- Customer balance tracking and payment history
- Barcode scanning using camera
- Daily sales, purchase, and profit report
- CSV backup export for Excel

## Run locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start Expo:

   ```bash
   npm run start
   ```

3. Run on Android device:

   - Install Expo Go and scan the QR code
   - Or run:

   ```bash
   npm run android
   ```

## Build APK

1. Install EAS CLI if needed:

   ```bash
   npm install -g eas-cli
   ```

2. Login and configure:

   ```bash
   eas login
   eas build:configure
   ```

3. Build Android APK:

   ```bash
   eas build -p android --profile preview
   ```

4. Download the generated APK from the Expo build link.
