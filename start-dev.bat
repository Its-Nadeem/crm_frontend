@echo off
REM CliennCRM Development Startup Script for Windows
echo 🚀 Starting CliennCRM Development Environment...
echo.

echo 📋 Checking MongoDB status...
sc query MongoDB >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB service is not running.
    echo    Please start MongoDB manually:
    echo    - Open Services (services.msc)
    echo    - Find and start "MongoDB" service
    echo    - Or install MongoDB if not installed
    echo.
) else (
    echo ✅ MongoDB service is running
)

echo.
echo 🔧 Starting Backend Server...
echo    Terminal 1: Backend ^(http://localhost:5000^)
echo    Command: cd backend && npm run dev
echo.

echo 🎨 Starting Frontend Server...
echo    Terminal 2: Frontend ^(http://localhost:5173^)
echo    Command: cd frontend && npm run client
echo.

echo 🌐 Starting Ngrok Tunnel...
echo    Terminal 3: Ngrok ^(External Access^)
echo    Command: npx ngrok http 5000
echo.

echo ✅ Setup Complete!
echo.
echo 📝 Quick Access URLs:
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:5000/api
echo    - Ngrok Web Interface: http://localhost:4040
echo    - Facebook Webhook: Check ngrok URL + /webhook/facebook
echo.
echo 🔄 To restart servers:
echo    - Backend: Ctrl+C in Terminal 1, then 'npm run dev'
echo    - Frontend: Ctrl+C in Terminal 2, then 'npm run client'
echo    - Ngrok: Ctrl+C in Terminal 3, then 'npx ngrok http 5000'
echo.
echo 💡 Tip: Keep all 3 terminals running for full functionality!
echo.
pause