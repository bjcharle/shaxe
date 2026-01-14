#!/bin/bash

# Shaxe Frontend - Quick Setup Script
# This script sets up the React frontend for development

echo "╔════════════════════════════════════════════════════════════╗"
echo "║      Shaxe Frontend - Setup Script                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Navigate to frontend directory
cd frontend || exit 1

echo "📦 Installing frontend dependencies..."
npm install

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Create .env file with: REACT_APP_API_URL=http://localhost:5000/api"
echo "  2. Start backend: cd backend && npm start"
echo "  3. Start frontend: cd frontend && npm start"
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔌 Backend API at: http://localhost:5000"
echo ""

# Offer to create .env file
read -p "Create .env file now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
EOF
    echo "✓ .env file created"
fi

echo ""
echo "Ready to start development! 🚀"
