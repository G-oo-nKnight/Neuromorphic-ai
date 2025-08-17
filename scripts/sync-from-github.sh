#!/bin/bash

# 🔄 Sync from GitHub - Main Source of Truth
# This script ensures your local copy is up-to-date with GitHub

echo "🧠 Enhanced Neuromorphic AI - GitHub Sync"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in project root directory"
    echo "Please run this script from the neuromorphic-ai directory"
    exit 1
fi

# Check git status
echo "📊 Checking current git status..."
git status

# Stash any local changes
echo ""
echo "💾 Stashing local changes (if any)..."
git stash

# Fetch latest from GitHub
echo ""
echo "🔄 Fetching latest from GitHub..."
git fetch origin

# Check out main branch
echo ""
echo "🔀 Switching to main branch..."
git checkout main

# Pull latest changes
echo ""
echo "⬇️ Pulling latest changes from GitHub..."
git pull origin main

# Show stash list
echo ""
echo "📦 Stashed changes (if any):"
git stash list

# Ask if user wants to apply stashed changes
if [ "$(git stash list)" != "" ]; then
    echo ""
    read -p "Do you want to apply stashed changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash pop
        echo "✅ Stashed changes applied"
    else
        echo "ℹ️ Stashed changes kept. Use 'git stash pop' to apply them later"
    fi
fi

# Install/update dependencies
echo ""
echo "📦 Updating dependencies..."
npm install

# Build the project
echo ""
echo "🔨 Building project..."
npm run build

# Show current status
echo ""
echo "✅ Sync complete! Current status:"
git log --oneline -5
echo ""
echo "🧠 Your local neuromorphic AI is now synchronized with GitHub!"
echo ""
echo "Next steps:"
echo "  - For development: npm run dev (local) or pm2 start ecosystem.config.cjs (sandbox)"
echo "  - To create feature: git checkout -b feature/your-feature"
echo "  - To contribute: Make changes, commit, and push to your branch"