// flacWorker.js
// Worker untuk meng-encode audio PCM (hasil OfflineAudioContext) menjadi FLAC
// menggunakan libflac.js (dikompilasi ke WebAssembly). Semua library dimuat
// dari folder lib/ secara lokal (bukan CDN) supaya tidak kena masalah
// same-origin saat Worker di-instantiate — lihat README.md.

self.FLAC_SCRIPT_LOCATION = 'lib/';
importScripts('lib/libflac.min.wasm.js');

let flacReady = false;
const pendingJobs = [];

function runJob(job) {
  const { channelData, sampleRate, channels, compression } = job;
  try {
    const bps = 16;
    const encoder = Flac.create_libflac_encoder(sampleRate, channels, bps, compression, 0, true, 0);
    if (!encoder) {
      postMessage({ type: 'error', message: 'Gagal membuat FLAC encoder.' });
      return;
    }

    const chunks = [];
    const writeCb = function (encodedData /* Uint8Array */) {
      chunks.push(encodedData.slice());
    };
    const metaCb = function () {};

    const status = Flac.init_encoder_stream(encoder, writeCb, metaCb);
    if (status !== 0) {
      Flac.FLAC__stream_encoder_delete(encoder);
      postMessage({ type: 'error', message: 'Gagal inisialisasi FLAC encoder.' });
      return;
    }

    const numSamples = channelData[0].length;
    const chBufI32 = channelData.map(function (arr) {
      const i32 = new Int32Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        const s = Math.max(-1, Math.min(1, arr[i]));
        i32[i] = Math.round(s < 0 ? s * 0x8000 : s * 0x7fff);
      }
      return i32;
    });

    const ok = Flac.FLAC__stream_encoder_process(encoder, chBufI32, numSamples);
    Flac.FLAC__stream_encoder_finish(encoder);
    Flac.FLAC__stream_encoder_delete(encoder);

    if (!ok) {
      postMessage({ type: 'error', message: 'Proses encoding FLAC gagal di tengah jalan.' });
      return;
    }

    let total = 0;
    chunks.forEach(function (c) { total += c.length; });
    const out = new Uint8Array(total);
    let offset = 0;
    chunks.forEach(function (c) { out.set(c, offset); offset += c.length; });

    postMessage({ type: 'done', data: out }, [out.buffer]);
  } catch (err) {
    postMessage({ type: 'error', message: (err && err.message) ? err.message : String(err) });
  }
}

if (typeof Flac !== 'undefined' && Flac.on) {
  Flac.on('ready', function () {
    flacReady = true;
    postMessage({ type: 'ready' });
    while (pendingJobs.length) runJob(pendingJobs.shift());
  });
} else {
  postMessage({ type: 'error', message: 'libflac.js gagal dimuat di worker.' });
}

onmessage = function (e) {
  const data = e.data || {};
  if (data.command === 'encode') {
    if (flacReady) runJob(data);
    else pendingJobs.push(data);
  }
};
