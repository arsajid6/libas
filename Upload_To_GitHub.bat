@echo off
echo =========================================
echo GitHub Code Upload Script by Antigravity
echo =========================================
echo.
cd /d "c:\Users\Dell\OneDrive\Desktop\google work\libas"

echo 1. Initializing Git...
git init

echo 2. Adding files...
git add .

echo 3. Committing files...
git commit -m "Initial commit"

echo 4. Setting branch to main...
git branch -M main

echo 5. Connecting to GitHub...
git remote add origin https://github.com/arsajid6/libas.git

echo 6. Pushing to GitHub...
echo (Agar browser open ho tou "Authorize" par click kar dijiye ga)
git push -u origin main

echo.
echo =========================================
echo Upload Complete! Aap is window ko band kar sakte hain.
echo =========================================
pause
