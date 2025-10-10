# Android APK Release Guide

This guide explains how to use the `release-android.sh` script to build and release your React Native/Expo Android APK.

## 📋 Prerequisites

Before running the release script, make sure you have:

1. **Node.js and npm/yarn** installed
2. **Android development environment** set up (Android Studio, SDK, etc.)
3. **Java Development Kit (JDK)** installed
4. **Git** initialized in your project
5. **app.json** file in your project root with proper Expo configuration
6. **android** directory with a working React Native/Expo Android project

## 🚀 Quick Start

1. Make the script executable:
   ```bash
   chmod +x release-android.sh
   ```

2. Run the release script with your desired version:
   ```bash
   ./release-android.sh 1.2.3
   ```

## 📖 Detailed Usage

### Command Syntax

```bash
./release-android.sh <version>
```

**Parameters:**
- `<version>`: The new semantic version number (e.g., `1.2.3`)

**Examples:**
```bash
./release-android.sh 1.0.0    # First release
./release-android.sh 1.0.1    # Patch update
./release-android.sh 1.1.0    # Minor update
./release-android.sh 2.0.0    # Major update
```

### What the Script Does

The script performs the following actions automatically:

1. **🔍 Validation**
   - Checks if you're in the correct project directory
   - Validates version format (semantic versioning)
   - Checks if Android project exists
   - Warns about uncommitted git changes

2. **📊 Version Information**
   - Reads current version from `app.json`
   - Shows current and new version comparison
   - Automatically increments version code by 1

3. **🔨 Build Process**
   - Navigates to `android` directory
   - Runs `./gradlew clean` to clean previous builds
   - Runs `./gradlew assembleRelease` to build APK
   - Verifies APK was created successfully
   - Shows APK location and size

4. **📝 Version Update**
   - Updates `expo.version` in `app.json`
   - Auto-increments `expo.android.versionCode` in `app.json`
   - Updates `package.json` version (if file exists)

5. **📦 Git Operations**
   - Commits changes with descriptive message
   - Creates git tag (e.g., `v1.2.3`)
   - Optionally pushes to remote repository

## 🎯 Expected Project Structure

Your project should have this structure:

```
YourProject/
├── app.json                 # Expo configuration
├── package.json            # Node.js dependencies
├── release-android.sh      # This script
├── android/                # Android project directory
│   ├── gradlew            # Gradle wrapper
│   └── app/
│       └── build/
│           └── outputs/
│               └── apk/
│                   └── release/
│                       └── app-release.apk  # Generated APK
└── .git/                  # Git repository
```

## 📄 app.json Configuration

Your `app.json` should contain at minimum:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "android": {
      "versionCode": 1,
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

## 🔧 Script Behavior

### Version Code Management
- The script **automatically increments** the version code by 1
- You don't need to manually update the version code
- Version code is used by Android for app updates

### Git Integration
- Commits changes with format: `chore: release version X.Y.Z (versionCode: N)`
- Creates annotated git tag: `vX.Y.Z`
- Asks before pushing to remote (optional)

### Interactive Prompts
The script will ask for confirmation in these situations:
- When there are uncommitted changes in git
- Before pushing changes and tags to remote repository

## 🏁 Post-Release Steps

After the script completes successfully:

1. **Test the APK**
   - Install on test devices: `adb install path/to/app-release.apk`
   - Test all major functionality
   - Verify version information in app

2. **Distribute the APK**
   - Upload to your distribution platform
   - Share with beta testers
   - Deploy to production environment

3. **Documentation**
   - Update release notes
   - Document new features/fixes
   - Update app store descriptions if needed

## 📁 Output Files

After successful execution, you'll find:

- **APK File**: `android/app/build/outputs/apk/release/app-release.apk`
- **Updated Files**: `app.json` and `package.json` (with new versions)
- **Git Tag**: `vX.Y.Z` in your repository

## ❗ Troubleshooting

### Common Issues

**Error: "app.json not found"**
- Make sure you're running the script from your project root directory

**Error: "Android directory not found"**
- Ensure you have an Android project set up
- For Expo projects, run `expo run:android` first to generate the android directory

**Error: "APK build failed"**
- Check if Android development environment is properly set up
- Ensure all dependencies are installed
- Check Android SDK and Java versions

**Error: "Failed to read app.json"**
- Verify your `app.json` has valid JSON syntax
- Ensure it contains the required Expo configuration

**Build Issues**
- Clean your project: `cd android && ./gradlew clean`
- Check Android Studio for any configuration issues
- Verify Android SDK path and version compatibility

### Version Format
- Use semantic versioning: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
- Don't include 'v' prefix - the script adds it automatically for git tags

## 🔐 Security Notes

- The script doesn't handle keystore signing configuration
- Make sure your release keystore is properly configured in Android project
- Don't commit sensitive keys to version control

## 🛠 Customization

You can modify the script to:
- Change commit message format
- Add additional build commands
- Include custom validation steps
- Modify APK output location
- Add notification integrations

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your development environment setup
3. Review the script output for specific error messages
4. Ensure all prerequisites are met

---

## 📝 Script Information

- **Script Name**: `release-android.sh`
- **Purpose**: Automated Android APK release process
- **Requirements**: React Native/Expo project with Android support
- **Output**: Release APK with updated version information and git tags