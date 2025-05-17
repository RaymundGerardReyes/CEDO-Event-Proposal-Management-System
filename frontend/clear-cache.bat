@echo off
echo Clearing Next.js cache...
rmdir /s /q .next
rmdir /s /q node_modules\.cache

echo Cache cleared successfully!
