#!/bin/bash
# Script to clear Next.js cache and node_modules

echo "Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

echo "Cache cleared successfully!"
