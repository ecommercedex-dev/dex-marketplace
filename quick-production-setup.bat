@echo off
echo 🚀 DEX Quick Production Setup
echo ==============================

echo.
echo 1. Running production deployment script...
node deploy-production.js

echo.
echo 2. Installing production dependencies...
cd DEX_BACKEND
call npm ci --production

echo.
echo 3. Building database...
call npx prisma generate
call npx prisma migrate deploy

echo.
echo 4. Creating uploads directory...
if not exist "uploads" mkdir uploads
if not exist "uploads\products" mkdir uploads\products
if not exist "uploads\profile_pictures" mkdir uploads\profile_pictures

echo.
echo ✅ Quick setup complete!
echo.
echo 📋 IMPORTANT NEXT STEPS:
echo 1. Edit DEX_BACKEND\.env.production-generated with your real values
echo 2. Rename it to .env
echo 3. Set up your production database
echo 4. Configure SSL certificates
echo 5. Run: npm run start:prod
echo.
echo 🚨 SECURITY WARNING: Change all default passwords before going live!

pause