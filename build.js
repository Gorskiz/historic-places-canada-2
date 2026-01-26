#!/usr/bin/env node

/**
 * Build script for unified Workers deployment
 * 1. Builds React frontend
 * 2. Copies to Worker's public/ directory
 * 3. Ready for deployment as one Worker
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WEBSITE_DIR = path.join(__dirname, 'website-src');
const PUBLIC_DIR = path.join(__dirname, 'public');

console.log('🏗️  Building Historic Places Canada (Unified Worker)\n');

// Step 1: Install website dependencies
console.log('1️⃣  Installing website dependencies...');
try {
  execSync('npm install --legacy-peer-deps', {
    cwd: WEBSITE_DIR,
    stdio: 'inherit'
  });
  console.log('✅ Dependencies installed\n');
} catch (error) {
  console.error('❌ Dependency installation failed:', error.message);
  process.exit(1);
}

// Step 2: Build React frontend
console.log('2️⃣  Building React frontend...');
try {
  execSync('npm run build', {
    cwd: WEBSITE_DIR,
    stdio: 'inherit'
  });
  console.log('✅ Frontend built\n');
} catch (error) {
  console.error('❌ Frontend build failed:', error.message);
  process.exit(1);
}

// Step 2: Clean and create public directory
console.log('2️⃣  Preparing public directory...');
if (fs.existsSync(PUBLIC_DIR)) {
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
}
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
console.log('✅ Public directory ready\n');

// Step 3: Copy built frontend to public
console.log('3️⃣  Copying frontend to Worker public/...');
const DIST_DIR = path.join(WEBSITE_DIR, 'dist');

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  copyRecursive(DIST_DIR, PUBLIC_DIR);
  console.log('✅ Frontend copied to public/\n');
} catch (error) {
  console.error('❌ Copy failed:', error.message);
  process.exit(1);
}

// Step 4: Summary
console.log('━'.repeat(50));
console.log('✅ Build complete!');
console.log('━'.repeat(50));
console.log('\n📦 Unified Worker Structure:');
console.log('  • Frontend: ./public/ (static assets)');
console.log('  • API: ./src/index.ts (routes under /api/*)');
console.log('  • Database: D1 binding (DB)');
console.log('  • Images: R2 binding (IMAGES)');
console.log('\n🚀 Deploy with:');
console.log('  npm run deploy');
console.log('\n🧪 Test locally with:');
console.log('  npm run dev');
console.log('');
