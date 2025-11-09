#!/bin/bash

# Flowbit Analytics Dashboard - Setup Script
# This script sets up the entire application with Docker Compose

set -e  # Exit on error

echo "🚀 Flowbit Analytics Dashboard - Quick Setup"
echo "=============================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    echo "Please install Docker from: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    echo "Please install Docker Compose from: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit the .env file and add your GROQ_API_KEY"
    echo "   Get your key from: https://console.groq.com"
    echo ""
    read -p "Press Enter after you've added your GROQ_API_KEY to .env..."
fi

# Verify GROQ_API_KEY is set
source .env
if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "your_groq_api_key_here" ]; then
    echo "❌ GROQ_API_KEY not set in .env file"
    echo "Please edit .env and add your Groq API key"
    exit 1
fi

echo ""
echo "🐳 Starting services with Docker Compose..."
echo ""

# Build and start services
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
echo "   This may take 30-60 seconds on first run..."
echo ""

# Wait for database
echo "   ⏳ Waiting for database..."
sleep 10

# Wait for backend
echo "   ⏳ Waiting for backend API..."
until curl -s http://localhost:5000/api/stats > /dev/null 2>&1; do
    sleep 2
done

# Wait for Vanna AI
echo "   ⏳ Waiting for Vanna AI service..."
until curl -s http://localhost:8000/health > /dev/null 2>&1; do
    sleep 2
done

# Wait for frontend
echo "   ⏳ Waiting for frontend..."
until curl -s http://localhost:3000 > /dev/null 2>&1; do
    sleep 2
done

echo ""
echo "✅ Setup complete! All services are running."
echo ""
echo "📊 Access the application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5000"
echo "   Vanna AI:  http://localhost:8000"
echo "   Database:  localhost:5432"
echo ""
echo "📖 Quick Commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo "   Reset all:     docker-compose down -v"
echo ""
echo "🎉 Happy analyzing!"
