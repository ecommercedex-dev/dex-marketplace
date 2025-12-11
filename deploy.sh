#!/bin/bash

# DEX Production Deployment Script

set -e

echo "🚀 Starting DEX deployment..."

# Check if .env exists
if [ ! -f "DEX_BACKEND/.env" ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Create necessary directories
mkdir -p logs uploads/products uploads/profile_pictures uploads/seller_profile_pictures

# Install dependencies
echo "📦 Installing dependencies..."
cd DEX_BACKEND
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build and start with Docker Compose
echo "🐳 Starting services with Docker Compose..."
cd ..
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:5000/health; then
    echo "✅ Deployment successful! DEX is running."
    echo "🌐 Frontend: http://localhost"
    echo "🔧 API: http://localhost:5000"
else
    echo "❌ Health check failed. Check logs:"
    docker-compose logs api
    exit 1
fi