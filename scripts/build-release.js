#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Preparing Sideo for packaging...\n');

// Configuration
const FFMPEG_URL = 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip';
const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const FFMPEG_DIR = path.join(ASSETS_DIR, 'ffmpeg');
const FFMPEG_PATH = path.join(FFMPEG_DIR, 'ffmpeg.exe');

async function checkNodeVersion() {
  console.log('📋 Checking Node.js version...');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  
  if (majorVersion < 18) {
    throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
  }
  
  console.log(`✅ Node.js ${nodeVersion} is compatible\n`);
}

async function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    execSync('npm ci', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Dependencies installed\n');
  } catch (error) {
    throw new Error(`Failed to install dependencies: ${error.message}`);
  }
}

async function checkFFmpeg() {
  console.log('🎬 Checking FFmpeg availability...');
  
  // Check if bundled FFmpeg exists
  if (fs.existsSync(FFMPEG_PATH)) {
    console.log('✅ Bundled FFmpeg found');
    return true;
  }
  
  // Check if system FFmpeg is available
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    console.log('✅ System FFmpeg found');
    console.log('⚠️  Warning: Using system FFmpeg. For distribution, consider bundling FFmpeg.');
    return true;
  } catch (error) {
    console.log('❌ FFmpeg not found');
    return false;
  }
}

async function downloadFFmpeg() {
  console.log('⬇️  Downloading FFmpeg...');
  
  // Ensure ffmpeg directory exists
  if (!fs.existsSync(FFMPEG_DIR)) {
    fs.mkdirSync(FFMPEG_DIR, { recursive: true });
  }
  
  const zipPath = path.join(FFMPEG_DIR, 'ffmpeg-temp.zip');
  const extractDir = path.join(FFMPEG_DIR, 'extracted');
  
  try {
    console.log('   Downloading from:', FFMPEG_URL);
    
    // Download using PowerShell (available on all Windows systems)
    execSync(`powershell -Command "Invoke-WebRequest -Uri '${FFMPEG_URL}' -OutFile '${zipPath}'"`, {
      stdio: 'inherit'
    });
    
    console.log('   Extracting archive...');
    
    // Extract using PowerShell
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, {
      stdio: 'inherit'
    });
    
    // Find ffmpeg.exe in extracted files
    console.log('   Locating FFmpeg binary...');
    
    const findFFmpeg = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          const found = findFFmpeg(fullPath);
          if (found) return found;
        } else if (file.name === 'ffmpeg.exe') {
          return fullPath;
        }
      }
      
      return null;
    };
    
    const ffmpegBinary = findFFmpeg(extractDir);
    
    if (!ffmpegBinary) {
      throw new Error('FFmpeg binary not found in downloaded archive');
    }
    
    // Copy to final location
    fs.copyFileSync(ffmpegBinary, FFMPEG_PATH);
    
    // Cleanup
    fs.rmSync(zipPath, { force: true });
    fs.rmSync(extractDir, { recursive: true, force: true });
    
    console.log('✅ FFmpeg downloaded and installed');
    
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(zipPath)) fs.rmSync(zipPath, { force: true });
    if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    
    throw new Error(`Failed to download FFmpeg: ${error.message}`);
  }
}

async function buildApplication() {
  console.log('🔨 Building application...');
  
  try {
    execSync('npm run build', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Application built successfully\n');
  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('🧪 Running tests...');
  
  try {
    execSync('npm test -- --passWithNoTests', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Tests passed\n');
  } catch (error) {
    console.warn('⚠️  Some tests failed, but continuing with build...\n');
  }
}

async function packageApplication(target = 'all') {
  console.log(`📦 Packaging application (${target})...`);
  
  const commands = {
    'all': 'npm run pack:all',
    'installer': 'npm run pack:installer', 
    'portable': 'npm run pack:portable'
  };
  
  const command = commands[target] || commands['all'];
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    console.log('✅ Packaging completed\n');
  } catch (error) {
    throw new Error(`Packaging failed: ${error.message}`);
  }
}

async function printSummary() {
  console.log('📋 Build Summary:');
  console.log('================');
  
  const releaseDir = path.join(__dirname, '..', 'release');
  
  if (fs.existsSync(releaseDir)) {
    const files = fs.readdirSync(releaseDir)
      .filter(file => file.endsWith('.exe') || file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(releaseDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
        return `  📁 ${file} (${sizeMB} MB)`;
      });
    
    if (files.length > 0) {
      console.log('📁 Generated packages:');
      files.forEach(file => console.log(file));
    } else {
      console.log('⚠️  No packages found in release directory');
    }
  } else {
    console.log('⚠️  Release directory not found');
  }
  
  console.log('\\n🎉 Build process completed!');
  console.log('\\nNext steps:');
  console.log('1. Test the generated packages');
  console.log('2. Check FFmpeg functionality in packaged app');
  console.log('3. Verify all features work as expected');
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const target = args[0] || 'all';
    const skipFFmpeg = args.includes('--skip-ffmpeg');
    const skipTests = args.includes('--skip-tests');
    
    await checkNodeVersion();
    await installDependencies();
    
    if (!skipFFmpeg) {
      const ffmpegAvailable = await checkFFmpeg();
      
      if (!ffmpegAvailable) {
        console.log('\\n🤖 FFmpeg not found. Attempting to download...');
        await downloadFFmpeg();
      }
    }
    
    await buildApplication();
    
    if (!skipTests) {
      await runTests();
    }
    
    await packageApplication(target);
    await printSummary();
    
  } catch (error) {
    console.error('\\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  main();
}

module.exports = {
  checkNodeVersion,
  installDependencies,
  checkFFmpeg,
  downloadFFmpeg,
  buildApplication,
  runTests,
  packageApplication
};