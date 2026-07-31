# Wildeon Audio Bypass

Konverter audio Roblox (client-side, murni browser — tanpa server). Upload file audio,
atur speed/amplify/EQ, lalu unduh hasilnya sebagai **MP3**, **OGG (Opus)**, **FLAC**, atau **WAV**.

## Apa yang berubah dari versi sebelumnya

- **OGG diperbaiki.** Sebelumnya worker encoder OGG dimuat dari CDN cdnjs
  (`new Worker('https://cdnjs.../encoderWorker.min.js')`). Banyak browser (Firefox
  khususnya, dan kadang Chrome tergantung header CORS) memblokir atau tidak konsisten
  saat membuat `Worker` dari URL *cross-origin*, sehingga export OGG gagal diam-diam.
  Sekarang file worker itu **di-vendor lokal** di `lib/encoderWorker.min.js` dan di-deploy
  bareng situsnya lewat Vercel — jadi originnya selalu sama dengan halaman, dan `new Worker(...)`
  selalu berhasil dibuat.
- **Export WebM dihapus.** Fallback MediaRecorder (yang bisa menghasilkan `.webm` kalau OGG asli
  tak didukung) sudah tidak diperlukan lagi karena OGG sekarang selalu berhasil lewat WASM.
- **Export FLAC ditambahkan** — lossless, di-encode di Web Worker terpisah (`flacWorker.js`)
  memakai [libflac.js](https://github.com/mmig/libflac.js) (WebAssembly).
- **Export WAV ditambahkan** — PCM mentah, instan tanpa encoding tambahan.
- **Fitur Trim (potong audio) dihapus.**
- **Fitur Fade In / Fade Out dihapus.**
- EQ 10-band, Speed, Amplify, dan Max Duration tetap ada seperti sebelumnya.

> Catatan: Roblox hanya menerima upload **MP3** atau **OGG** (lihat
> `create.roblox.com/docs/audio/assets`). FLAC dan WAV disediakan untuk kebutuhan lain
> (master/arsip kualitas tinggi), bukan untuk di-upload langsung ke Roblox.

## Struktur file

```
.
├── index.html                  # halaman utama (semua UI & logic utama)
├── flacWorker.js                # Web Worker untuk encode FLAC (memuat lib/libflac.min.wasm.js)
├── lib/
│   ├── lame.min.js              # encoder MP3 (lamejs)
│   ├── encoderWorker.min.js     # encoder OGG/Opus (opus-recorder)
│   ├── libflac.min.wasm.js      # encoder FLAC (libflac.js, loader)
│   └── libflac.min.wasm.wasm    # encoder FLAC (libflac.js, binary WASM)
├── package.json                 # daftar dependency sumber (untuk vendoring ulang)
└── scripts/vendor.js            # script untuk menyalin ulang file dari node_modules ke lib/
```

**Penting:** folder `lib/` dan file `flacWorker.js` **wajib ikut ter-deploy** persis di
posisi yang sama (relatif terhadap `index.html`). Semua path di kode memakai path relatif
(`lib/...`, `flacWorker.js`), jadi struktur folder di atas harus dipertahankan apa adanya.

## Cara pakai / update library (opsional)

File di folder `lib/` sudah disertakan siap pakai — kamu **tidak wajib** menjalankan `npm install`
untuk deploy. Langkah ini hanya diperlukan kalau suatu saat ingin memperbarui versi
lamejs / opus-recorder / libflacjs:

```bash
npm install
npm run vendor
```

Perintah `npm run vendor` menyalin file terbaru dari `node_modules` ke folder `lib/`
(lihat isinya di `scripts/vendor.js`).

## Deploy ke GitHub

```bash
git init
git add .
git commit -m "Wildeon Audio Bypass v2.1 - fix OGG, tambah FLAC & WAV, hapus trim/fade"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

## Deploy ke Vercel

Situs ini **statis** (HTML + JS murni), tidak butuh proses build.

1. Buka [vercel.com](https://vercel.com) → **Add New... → Project**.
2. Import repo GitHub yang baru saja di-push.
3. Pada konfigurasi project:
   - **Framework Preset:** `Other`
   - **Build Command:** kosongkan (biarkan default / disable)
   - **Output Directory:** `.` (root repo — karena `index.html` ada di root)
   - **Install Command:** kosongkan (tidak perlu `npm install` untuk menjalankan situsnya,
     karena file di `lib/` sudah disertakan langsung di repo)
4. Klik **Deploy**.

Setelah deploy selesai, cek dari domain Vercel-nya:
- `https://<project>.vercel.app/lib/encoderWorker.min.js` harus bisa diakses langsung
  (bukan 404) — ini yang memastikan export OGG berfungsi.
- `https://<project>.vercel.app/flacWorker.js` dan file-file di `lib/libflac.min.wasm.*`
  juga harus bisa diakses langsung — ini yang memastikan export FLAC berfungsi.

Kalau salah satu di atas 404, berarti folder `lib/` atau file `flacWorker.js` tidak ikut
ter-commit/ter-deploy — cek lagi `git status` sebelum push, dan pastikan tidak ada
`.gitignore` yang mengecualikan folder `lib/`.

## Kenapa tidak semuanya lewat CDN saja?

Bisa saja mempertahankan `<script src="https://cdn.../lame.min.js">` untuk MP3 (itu memang
tetap aman dipakai lewat CDN karena hanya `<script>` tag, bukan `Worker`). Tapi untuk
konsistensi dan supaya semua encoder (OGG & FLAC) yang berjalan lewat `Worker`/WASM tidak
tergantung kebijakan CORS masing-masing CDN, semuanya di-vendor lokal di proyek ini.
