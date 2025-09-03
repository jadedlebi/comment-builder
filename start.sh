#!/bin/bash

# Government Comment App Startup Script

echo "🚀 Starting Government Comment Submission Tool..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure your credentials."
    exit 1
fi

# Check if node_modules exist
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install-all
fi

# Test BigQuery connection
echo "🔍 Testing BigQuery connection..."
cd server
node scripts/test-bigquery.js
if [ $? -ne 0 ]; then
    echo "❌ BigQuery connection test failed. Please check your configuration."
    exit 1
fi

# Initialize database if needed
echo "🗄️  Checking database setup..."
if [ ! -f "database-initialized.flag" ]; then
    echo "🔧 Initializing database..."
    node scripts/init-database.js
    if [ $? -eq 0 ]; then
        touch database-initialized.flag
        echo "🌱 Seeding sample data..."
        node scripts/seed-data.js
    else
        echo "❌ Database initialization failed. Please check your BigQuery configuration."
        exit 1
    fi
fi
cd ..

# Start the application
echo "🎉 Starting application..."
npm run dev
