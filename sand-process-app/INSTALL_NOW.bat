@echo off
echo Installing Supabase package...
cd /d "%~dp0"
call npm install @supabase/supabase-js
echo.
echo Installation complete!
echo.
echo Please restart your dev server (stop it with Ctrl+C, then run: npm start)
pause


