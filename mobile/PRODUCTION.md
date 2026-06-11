# Chapel System — Mobile Production & Deployment Guide

This guide provides step-by-step instructions on how to package, compile, and deploy the **Chapel System** mobile application for production.

---

## 📋 Production Environment Configurations

Before compiling the app, verify that the API configuration points to the live production server.

- **API Configuration File**: [api.ts](file:///c:/Users/HP/Desktop/chapel-system/mobile/src/services/api.ts)
- **Production Endpoint**: `https://chapel-system-api.onrender.com/api`

```typescript
// src/services/api.ts
export const API_URL = 'https://chapel-system-api.onrender.com/api';
```

---

## 🚀 Option 1: EAS Build (Cloud-Based — Recommended)

[Expo Application Services (EAS) Build](https://docs.expo.dev/build/introduction/) is the standard, cloud-based tool chain to build binaries. You do not need Android Studio, Xcode, or a Mac to use EAS.

### 1. Log In to Expo
Log in to your Expo developer account (create one at [expo.dev](https://expo.dev) if you haven't already):
```bash
npx eas-cli login
```

### 2. Initialize EAS Project
Link this local project to your Expo account:
```bash
npx eas-cli project:init
```
Follow the prompts to link the app. This creates an `projectId` in your [app.json](file:///c:/Users/HP/Desktop/chapel-system/mobile/app.json).

### 4. Build for Testing (Android APK)
To build a shareable Android APK that can be installed on any Android device for QA testing, run:
```bash
npm run build:android:apk
```
*This uses the `preview` profile defined in `eas.json` to generate an APK instead of an AAB bundle.*

### 5. Build for Store Release
To build final release binaries ready for store submission:

#### Android (App Bundle - `.aab`)
```bash
npm run build:android
```

#### iOS (App Store - `.ipa`)
```bash
npm run build:ios
```
*Note: iOS App Store builds require an Apple Developer Account.*

---

## 🛠️ Option 2: Local Native Build (Self-Hosted)

If you prefer to compile binaries on your own computer without using Expo Cloud Services, you can eject the project into full native configurations.

### 1. Requirements
Ensure you have the following installed locally:
- **Node.js** (v18+)
- **Java Development Kit (JDK)**: JDK 17 (recommended for Expo 56)
- **Android SDK / Android Studio** (for Android builds)
- **macOS & Xcode** (only required for local iOS builds)

### 2. Prebuild Native Folders
Generate the native `/android` and `/ios` directories:
```bash
npm run prebuild
```
This runs `npx expo prebuild`, which creates the actual native Android Gradle project and iOS Xcode project using the credentials and assets defined in [app.json](file:///c:/Users/HP/Desktop/chapel-system/mobile/app.json).

### 3. Compile Local Release Binaries

#### Compile Android Release APK
To compile the release APK directly on your machine:
```bash
npm run build:local:android
```
Alternatively, navigate to `/android` and build with Gradle:
```bash
cd android
./gradlew assembleRelease
```
The compiled APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`

#### Compile iOS Release App
To build the iOS release scheme (requires macOS and Xcode):
```bash
npm run build:local:ios
```

---

## 📲 Option 3: Static Web Export

If you want to compile the web-based version of the mobile app to host it as a Web App:
```bash
npx expo export
```
The static files will be exported to the `dist` directory. You can host these files on Netlify, Vercel, or any static file hosting service.

---

## 🔑 Credential & Release Checklist

- [ ] **Android Package Name / iOS Bundle Identifier**: Configured as `com.chapelsystem.mobile` in `app.json`.
- [ ] **Keystore Credentials**: EAS manages your signing keys by default. If you run local builds, you must generate a release keystore (`keytool -genkey -v -keystore my-release-key.jks ...`) and reference it in `/android/app/build.gradle`.
- [ ] **Icons & Splash Screens**: Ensure assets are set up in `/assets/images/` and references in `app.json` are correct.
- [ ] **App Version**: Update `"version": "1.0.0"` and `"versionCode": 1` in `app.json` before publishing each release update.
