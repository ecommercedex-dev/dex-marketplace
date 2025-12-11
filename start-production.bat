@echo off
title DEX Production Server
color 0A

echo ========================================
echo    🚀 DEX Production Server Starting
echo ========================================
echo.

echo 📋 Checking system requirements...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found! Please install Node.js
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo.

echo 🔧 Setting up environment...
cd /d "%~dp0\DEX_BACKEND"

echo 📦 Installing dependencies...
call npm ci --production --silent

echo 🗄️ Setting up database...
call npx prisma generate --silent
call npx prisma migrate deploy --silent

echo 🚀 Starting DEX server...
echo.
echo ========================================
echo    Server running on http://localhost:5000
echo    Frontend: http://localhost:3000
echo    Admin: http://localhost:3000/secret-dex-admin-2024
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js