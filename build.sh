#!/bin/bash
# Force npm usage and prevent yarn
echo "🚀 Starting build with npm..."

# Remove any yarn files
rm -f yarn.lock
rm -rf .yarn

# Force npm usage
npm config set package-lock true
npm config set prefer-npm true

# Install dependencies with npm
echo "📦 Installing dependencies with npm..."
npm ci --only=production --no-optional

echo "✅ Build completed successfully!"
