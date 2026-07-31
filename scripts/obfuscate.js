// scripts/obfuscate.js
// Build step: mengambil index.html (versi sumber, mudah dibaca/di-maintain)
// dan menghasilkan index.html versi produksi dengan <script> yang di-obfuscate
// (rename variabel, string di-encode base64, control-flow flattening, dst).
//
// PENTING (baca ini dulu): obfuscation JS di sisi client TIDAK PERNAH benar-benar
// "anti-inspect". Browser wajib mengunduh & menjalankan kode itu apa adanya, jadi
// siapa pun yang cukup niat tetap bisa membacanya (view-source, tab Network,
// deobfuscator online, dsb). Yang didapat dari langkah ini hanyalah membuat kode
// tidak enak dibaca / lebih makan waktu untuk disalin ulang oleh orang iseng —
// bukan proteksi yang tidak bisa ditembus.
//
// Jalankan: npm install && npm run build
// Sumber yang di-edit sehari-hari: index.source.html
// Hasil build (yang di-deploy):     index.html

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

const ROOT = path.join(__dirname, '..');
const SRC_FILE = path.join(ROOT, 'index.source.html');
const OUT_FILE = path.join(ROOT, 'index.html');

const html = fs.readFileSync(SRC_FILE, 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*)<\/script>\s*<\/body>/);
if (!scriptMatch) {
  console.error('Tidak menemukan blok <script> utama di ' + SRC_FILE);
  process.exit(1);
}
const src = scriptMatch[1];

// selfDefending / debugProtection sengaja DIMATIKAN: pada versi javascript-obfuscator
// yang dipakai di sini, kombinasi itu bisa menghasilkan kode yang rusak atau memicu
// regex "self-defense" yang berat di browser (berisiko nge-freeze halaman untuk user
// biasa). Deteksi devtools yang aman ada di index.source.html (fungsi devtoolsWatch),
// dan itu tetap ikut ter-obfuscate di bawah ini.
const result = JavaScriptObfuscator.obfuscate(src, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.3,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.1,
  debugProtection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  numbersToExpressions: false,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayEncoding: ['base64'],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
});

const obfuscated = result.getObfuscatedCode();
const outHtml = html.replace(scriptMatch[0], `<script>${obfuscated}</script>\n</body>`);
fs.writeFileSync(OUT_FILE, outHtml);
console.log(`OK: ${SRC_FILE} -> ${OUT_FILE} (${obfuscated.length} chars, obfuscated)`);
