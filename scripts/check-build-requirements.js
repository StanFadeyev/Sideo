#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Checking build requirements...');

// Check if FFmpeg binary exists
const ffmpegPath = path.join(__dirname, '..', 'assets', 'ffmpeg', 'ffmpeg.exe');

if (!fs.existsSync(ffmpegPath)) {
  console.error('❌ FFmpeg binary not found!');
  console.log('📁 Expected location:', ffmpegPath);
  console.log('');
  console.log('To fix this:');
  console.log('1. Run: cd assets/ffmpeg');
  console.log('2. Run: download-ffmpeg.bat');
  console.log('3. Or manually place ffmpeg.exe in assets/ffmpeg/');
  console.log('');
  console.log('You can download FFmpeg from:');
  console.log('- https://www.gyan.dev/ffmpeg/builds/');
  console.log('- https://ffmpeg.org/download.html');
  
  process.exit(1);
}

console.log('✅ FFmpeg binary found');

// Check icon files
const iconPath = path.join(__dirname, '..', 'assets', 'icon.png');
if (!fs.existsSync(iconPath)) {
  console.warn('⚠️  Icon file not found:', iconPath);
} else {
  console.log('✅ Icon file found');
}

console.log('✅ Build requirements check passed');