#!/bin/bash

# Android APK Release Script for React Native/Expo App
# This script builds the Android APK, updates version in app.json, and commits changes

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if version parameter is provided
if [ $# -eq 0 ]; then
    print_error "Version parameter is required!"
    echo ""
    echo "Usage: ./release-android.sh <version>"
    echo "Example: ./release-android.sh 1.2.3"
    echo ""
    exit 1
fi

NEW_VERSION=$1

# Validate version format (basic semver check)
if ! [[ $NEW_VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    print_error "Invalid version format. Use semantic versioning (x.y.z)"
    echo "Example: 1.2.3"
    exit 1
fi

print_status "🚀 Starting Android APK release process for version $NEW_VERSION"
echo ""

# Check if we're in the right directory
if [ ! -f "app.json" ]; then
    print_error "app.json not found. Make sure you're in the project root."
    exit 1
fi

# Check if android directory exists
if [ ! -d "android" ]; then
    print_error "Android directory not found. Make sure this is a React Native/Expo project with Android."
    exit 1
fi

# Check if git working directory is clean
if ! git diff-index --quiet HEAD --; then
    print_warning "Git working directory is not clean. Uncommitted changes detected."
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Release cancelled."
        exit 1
    fi
    echo ""
fi

# Get current version info from app.json
CURRENT_VERSION=$(node -p "require('./app.json').expo.version || '0.0.0'" 2>/dev/null)
CURRENT_VERSION_CODE=$(node -p "require('./app.json').expo.android?.versionCode || 1" 2>/dev/null)

if [ $? -ne 0 ]; then
    print_error "Failed to read app.json. Please check the file format."
    exit 1
fi

NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

print_status "📋 Version Information:"
print_status "   Current: $CURRENT_VERSION (versionCode: $CURRENT_VERSION_CODE)"
print_status "   New: $NEW_VERSION (versionCode: $NEW_VERSION_CODE)"
echo ""

# Step 1: Build Android APK
print_status "🔨 Building Android APK..."
echo ""

cd android

# Clean build
print_status "Cleaning previous builds..."
if ! ./gradlew clean; then
    print_error "Clean build failed!"
    exit 1
fi

# Build release APK
print_status "Building release APK..."
if ! ./gradlew assembleRelease; then
    print_error "APK build failed!"
    exit 1
fi

# Check if APK was built successfully
APK_PATH="app/build/outputs/apk/release/app-release.apk"

if [ ! -f "$APK_PATH" ]; then
    print_error "APK build failed! Expected file not found: $APK_PATH"
    exit 1
fi

APK_FULL_PATH="$(pwd)/$APK_PATH"
APK_SIZE=$(du -h "$APK_PATH" | cut -f1)

print_success "✅ APK built successfully!"
print_status "   Location: $APK_FULL_PATH"
print_status "   Size: $APK_SIZE"
echo ""

# Go back to project root
cd ..

# Step 2: Update Expo version in app.json
print_status "📝 Updating app.json..."

# Update app.json using Node.js
UPDATE_RESULT=$(node -e "
    const fs = require('fs');
    const path = './app.json';
    
    try {
        const appJson = JSON.parse(fs.readFileSync(path, 'utf8'));
        
        // Update version
        appJson.expo.version = '$NEW_VERSION';
        
        // Ensure android object exists and update versionCode
        if (!appJson.expo.android) {
            appJson.expo.android = {};
        }
        appJson.expo.android.versionCode = $NEW_VERSION_CODE;
        
        // Write back to file with proper formatting
        fs.writeFileSync(path, JSON.stringify(appJson, null, 2) + '\n');
        
        console.log('SUCCESS');
    } catch (error) {
        console.log('ERROR: ' + error.message);
        process.exit(1);
    }
" 2>&1)

if [[ "$UPDATE_RESULT" == "SUCCESS" ]]; then
    print_success "✅ Updated app.json"
    print_status "   Version: $CURRENT_VERSION → $NEW_VERSION"
    print_status "   Version Code: $CURRENT_VERSION_CODE → $NEW_VERSION_CODE"
else
    print_error "Failed to update app.json: $UPDATE_RESULT"
    exit 1
fi
echo ""

# Step 3: Update package.json version (if exists)
if [ -f "package.json" ]; then
    print_status "📝 Updating package.json version..."
    if npm version $NEW_VERSION --no-git-tag-version >/dev/null 2>&1; then
        print_success "✅ Updated package.json to version $NEW_VERSION"
    else
        print_warning "Failed to update package.json version"
    fi
    echo ""
fi

# Step 4: Commit and tag
print_status "📦 Committing changes and creating git tag..."

# Add changed files
git add app.json
if [ -f "package.json" ]; then
    git add package.json
fi

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes detected in version files."
else
    # Commit with version message
    COMMIT_MESSAGE="chore: release version $NEW_VERSION (versionCode: $NEW_VERSION_CODE)"
    if git commit -m "$COMMIT_MESSAGE"; then
        print_success "✅ Committed changes"
        print_status "   Message: $COMMIT_MESSAGE"
    else
        print_error "Failed to commit changes"
        exit 1
    fi
fi

# Create git tag
TAG_NAME="v$NEW_VERSION"
if git tag -l | grep -q "^$TAG_NAME$"; then
    print_warning "⚠️  Tag $TAG_NAME already exists. Skipping tag creation."
else
    if git tag -a "$TAG_NAME" -m "Release $NEW_VERSION"; then
        print_success "✅ Created git tag: $TAG_NAME"
    else
        print_error "Failed to create git tag"
        exit 1
    fi
fi
echo ""

# Step 5: Ask about pushing to remote
read -p "🌐 Do you want to push changes and tags to remote? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Pushing to remote..."
    
    # Get current branch name
    CURRENT_BRANCH=$(git branch --show-current)
    
    # Push commits
    if git push origin "$CURRENT_BRANCH" 2>/dev/null; then
        print_success "✅ Pushed commits to remote"
    else
        print_error "Failed to push commits to remote"
        exit 1
    fi
    
    # Push tags
    if git push origin "$TAG_NAME" 2>/dev/null; then
        print_success "✅ Pushed tag to remote"
    else
        print_error "Failed to push tag to remote"
        exit 1
    fi
else
    print_status "Skipped pushing to remote. You can push manually later with:"
    print_status "   git push origin $(git branch --show-current)"
    print_status "   git push origin $TAG_NAME"
fi

echo ""

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_success "🎉 Android APK release completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📦 RELEASE SUMMARY"
echo "   Version: $NEW_VERSION"
echo "   Version Code: $NEW_VERSION_CODE"
echo "   Git Tag: $TAG_NAME"
echo "   APK Size: $APK_SIZE"
echo ""
echo "📁 APK LOCATION"
echo "   $APK_FULL_PATH"
echo ""
echo "🚀 NEXT STEPS"
echo "   1. Test the APK on different devices"
echo "   2. Distribute the APK for testing/deployment"
echo "   3. Create release notes"
echo "   4. Backup the APK file"
echo ""
echo "💡 QUICK COMMANDS"
echo "   Install APK: adb install \"$APK_FULL_PATH\""
echo "   Open APK folder: open \"$(dirname "$APK_FULL_PATH")\""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"