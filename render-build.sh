#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npm run build

# Install Puppeteer and its dependencies
npx puppeteer browsers install chrome
