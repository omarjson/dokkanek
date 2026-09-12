@echo off
REM مثبت دكّانك لنظام ويندوز — نقرة مزدوجة بعد تثبيت Node.js LTS من nodejs.org
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [خطأ] ثبت Node.js LTS أولا من https://nodejs.org ثم أعد التشغيل
  pause
  exit /b 1
)
if not exist node_modules (
  echo تثبيت المكتبات أول مرة (قد يأخذ دقائق)...
  call npm install --legacy-peer-deps --no-audit --no-fund
)
if not exist prisma\dev.db (
  echo تجهيز قاعدة البيانات...
  call npx prisma generate
  call npx prisma db push
)
echo.
echo افتح المتصفح على: http://localhost:3000
echo معالج التثبيت سيظهر تلقائيا ويرشدك خطوة بخطوة.
call npm run dev
pause
