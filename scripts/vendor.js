// scripts/vendor.js
// Menyalin file encoder yang dibutuhkan dari node_modules ke folder lib/,
// supaya semua ter-host di origin yang sama saat di-deploy (bukan dari CDN).
// Jalankan: npm install && npm run vendor

const fs = require('fs');
const path = require('path');

const files = [
  ['lamejs/lame.min.js', 'lame.min.js'],
  ['opus-recorder/dist/encoderWorker.min.js', 'encoderWorker.min.js'],
  ['libflacjs/dist/libflac.min.wasm.js', 'libflac.min.wasm.js'],
  ['libflacjs/dist/libflac.min.wasm.wasm', 'libflac.min.wasm.wasm'],
  ['jszip/dist/jszip.min.js', 'jszip.min.js'],
];

const libDir = path.join(__dirname, '..', 'lib');
if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

for (const [src, dest] of files) {
  const srcPath = path.join(__dirname, '..', 'node_modules', src);
  const destPath = path.join(libDir, dest);
  fs.copyFileSync(srcPath, destPath);
  console.log(`copied ${src} -> lib/${dest}`);
}

console.log('Selesai. Semua file encoder sudah ada di folder lib/.');
