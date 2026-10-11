// Phone camera barcode scanning. Uses the native BarcodeDetector where available
// (Chrome on Android), otherwise falls back to ZXing (iOS Safari, Firefox).

const video = document.getElementById('video');
const statusEl = document.getElementById('status');
const startBtn = document.getElementById('start');
const FORMATS = ['ean_13', 'ean_8', 'upc_a'];
const DEBOUNCE_MS = 3000;

let last = { code: null, at: 0 };
let busy = false;

function showStatus(kind, html) {
  statusEl.className = 'status ' + kind;
  statusEl.innerHTML = html;
}

async function submit(code, source) {
  busy = true;
  showStatus('working', `Checking ${escapeHtml(code)}…`);
  try {
    const r = await api('POST', '/api/scan', { ean: code, source });
    if (r.status === 'added') {
      showStatus('added', `✓ Added <b>${escapeHtml(r.name)}</b>`);
    } else if (r.status === 'unknown') {
      showStatus('unknown', `? Unknown ${escapeHtml(r.ean)}: <a href="/missing">name it</a>`);
    } else {
      showStatus('error', `✗ ${escapeHtml(r.message || r.status)}`);
    }
  } catch (err) {
    showStatus('error', `✗ ${escapeHtml(err.message)}`);
  } finally {
    busy = false;
  }
}

function onCode(code) {
  const now = Date.now();
  if (busy || (code === last.code && now - last.at < DEBOUNCE_MS)) return;
  last = { code, at: now };
  if (navigator.vibrate) navigator.vibrate(80);
  submit(code, 'phone');
}

async function startNative() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
  video.srcObject = stream;
  await video.play();
  const detector = new BarcodeDetector({ formats: FORMATS });
  setInterval(async () => {
    if (video.readyState < 2) return;
    try {
      const codes = await detector.detect(video);
      if (codes.length) onCode(codes[0].rawValue);
    } catch { /* frame not ready */ }
  }, 200);
}

async function startZxing() {
  const reader = new ZXingBrowser.BrowserMultiFormatReader();
  await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (result) => {
    if (result) onCode(result.getText());
  });
}

async function nativeSupported() {
  if (!('BarcodeDetector' in window)) return false;
  try {
    return (await BarcodeDetector.getSupportedFormats()).includes('ean_13');
  } catch {
    return false;
  }
}

startBtn.addEventListener('click', async () => {
  if (!window.isSecureContext) {
    showStatus('error', 'The camera needs HTTPS. Open this page via the https:// address (or type the code below).');
    return;
  }
  startBtn.disabled = true;
  try {
    if (await nativeSupported()) await startNative();
    else await startZxing();
    startBtn.hidden = true;
    showStatus('idle', 'Point the camera at a barcode');
  } catch (err) {
    startBtn.disabled = false;
    showStatus('error', `Camera error: ${escapeHtml(err.message)}`);
  }
});

document.getElementById('manual').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('manual-ean');
  const code = input.value.trim();
  if (code) submit(code, 'manual');
  input.value = '';
});
