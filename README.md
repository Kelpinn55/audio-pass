# Wildeon Audio Bypass (v3.0)

Konverter audio Roblox (client-side, murni browser — tanpa server). Upload satu atau
banyak file audio, atur speed/amplify/max duration, lalu unduh hasilnya sebagai
**MP3**, **OGG (Opus)**, **FLAC**, atau **WAV** — semua file di antrian sekaligus,
dibungkus jadi satu **.zip**.

## Apa yang berubah di v3.0

1. **Equalizer 10-band dihapus.** Card, slider, preset EQ, dan filter biquad-nya
   sudah dibuang total dari pipeline audio (`processItem`). Amplify (dB) dan Speed
   tetap ada seperti biasa.
2. **Export sekarang bulk-zip, bukan satu-per-satu.** Sebelumnya klik tombol
   MP3/OGG/FLAC/WAV hanya meng-encode dan mengunduh **satu** file (item aktif/preview
   terakhir). Sekarang setiap klik akan meng-encode **semua** item di antrian yang
   berstatus "selesai diproses", membungkusnya jadi satu `.zip` lewat
   [JSZip](https://stuk.github.io/jszip/) (di-vendor lokal, `lib/jszip.min.js`), lalu
   memicu **satu** unduhan `.zip`. Riwayat bypass tetap mencatat tiap file secara
   individual di dalamnya.
3. **Skema penamaan output berubah.** Sebelumnya nama file hasil unduhan diacak
   penuh. Sekarang formatnya `XXX-KODEACAK`, di mana `XXX` = 3 huruf pertama
   (huruf saja, diambil dari nama file asli, di-uppercase) dan `KODEACAK` = 6–10
   karakter alfanumerik acak (uppercase). Contoh:
   `Goo goo dolls - Iris (Slowed and reverb).mp3` → **`GOO-86ASDQ.mp3`**.
   Kalau nama asli kurang dari 3 huruf, sisanya diisi `X` (mis. file bernama `1.mp3`
   → prefix `1XX`).
4. **Deterrent anti-inspect (dengan catatan jujur di bawah).** Klik-kanan dan
   shortcut umum (F12, Ctrl+Shift+I/J/C, Ctrl+U) diblokir, dan ada overlay
   peringatan sederhana kalau ukuran window vs viewport mengindikasikan panel
   DevTools sedang terbuka. Script produksi (`index.html`) juga sudah di-obfuscate
   lewat `javascript-obfuscator` (rename variabel, string di-encode, control-flow
   flattening) via `npm run build`.

   **Batasan yang perlu dipahami:** ini semua cuma mempersulit orang awam yang
   iseng klik-kanan atau tekan F12 — **bukan proteksi yang benar-benar tidak bisa
   ditembus**. Browser tetap *harus* mengunduh dan menjalankan kode itu apa
   adanya supaya halamannya bisa jalan, jadi siapa pun yang cukup niat tetap bisa
   membaca / menyalinnya lewat cara lain: curl langsung ke URL, tab Network, mode
   "disable JavaScript", proxy, atau deobfuscator online. Tidak ada teknik client-side
   (obfuscation, devtools-detection, dsb.) yang bisa mengubah fakta ini — ini
   keterbatasan fundamental semua web app statis, bukan cuma proyek ini.

## Struktur file

```
.
├── index.html                  # VERSI PRODUKSI — script sudah di-obfuscate, ini yang di-deploy
├── index.source.html           # VERSI SUMBER — mudah dibaca, edit di sini sehari-hari
├── flacWorker.js                # Web Worker untuk encode FLAC (memuat lib/libflac.min.wasm.js)
├── lib/
│   ├── lame.min.js              # encoder MP3 (lamejs)
│   ├── encoderWorker.min.js     # encoder OGG/Opus (opus-recorder)
│   ├── libflac.min.wasm.js      # encoder FLAC (libflac.js, loader)
│   ├── libflac.min.wasm.wasm    # encoder FLAC (libflac.js, binary WASM)
│   └── jszip.min.js             # bundling semua hasil export jadi satu .zip
├── package.json                 # daftar dependency sumber (untuk vendoring & build)
└── scripts/
    ├── vendor.js                 # menyalin encoder dari node_modules ke lib/
    └── obfuscate.js              # build index.source.html -> index.html (obfuscated)
```

**Penting:** folder `lib/` dan file `flacWorker.js` **wajib ikut ter-deploy** persis di
posisi yang sama (relatif terhadap `index.html`). Semua path di kode memakai path relatif
(`lib/...`, `flacWorker.js`), jadi struktur folder di atas harus dipertahankan apa adanya.

## Alur kerja: edit vs deploy

- **Untuk edit fitur:** ubah `index.source.html` (versi mudah dibaca).
- **Untuk deploy:** jalankan build supaya `index.html` (versi obfuscated) ter-generate
  ulang dari `index.source.html`. **Jangan edit `index.html` langsung** — perubahan akan
  hilang tiap kali build dijalankan ulang, dan lebih susah di-debug karena sudah
  di-obfuscate.

```bash
npm install
npm run build      # index.source.html -> index.html (obfuscated)
```

## Cara pakai / update library encoder (opsional)

File di folder `lib/` sudah disertakan siap pakai — kamu **tidak wajib** menjalankan
`npm install` untuk deploy. Langkah ini hanya diperlukan kalau suatu saat ingin
memperbarui versi lamejs / opus-recorder / libflacjs / jszip:

```bash
npm install
npm run vendor
```

## Deploy ke GitHub

```bash
git init
git add .
git commit -m "Wildeon Audio Bypass v3.0 - hapus EQ, bulk zip export, naming XXX-KODE, deterrent anti-inspect"
git branch -M main
git remote add origin https://github.com/<username>/<nama-repo>.git
git push -u origin main
```

## Deploy ke Vercel

Situs ini **statis** (HTML + JS murni), tidak butuh proses build saat deploy — cukup
pastikan `npm run build` sudah dijalankan sebelum push, supaya `index.html` yang
ter-commit sudah versi obfuscated terbaru.

> **Fix error "No Output Directory named public found":** ini terjadi kalau
> Project Settings di dashboard Vercel-nya ke-set Output Directory = `public`
> (biasanya karena auto-detect framework yang salah), padahal `index.html` ada
> di **root** repo, bukan di folder `public/`. Sudah disertakan `vercel.json`
> di root project yang override setting itu (`"outputDirectory": "."`), jadi
> harusnya langsung kepakai begitu file ini ikut ter-commit & di-deploy ulang.
> Kalau masih gagal, cek juga manual di dashboard: **Project → Settings →
> Build & Deployment → Output Directory**, kosongkan atau isi `.` (root), lalu
> **Redeploy**.

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
- `https://<project>.vercel.app/lib/jszip.min.js`, `https://<project>.vercel.app/flacWorker.js`,
  dan file-file di `lib/libflac.min.wasm.*` juga harus bisa diakses langsung.

Kalau salah satu di atas 404, berarti folder `lib/` atau file `flacWorker.js` tidak ikut
ter-commit/ter-deploy — cek lagi `git status` sebelum push, dan pastikan tidak ada
`.gitignore` yang mengecualikan folder `lib/`.
