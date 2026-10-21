/* ============================================
   LA LOMADA DE PUIGGARI — Tracking
   Registra 1 visita y 1 click a WhatsApp por IP.
   El documento se guarda con el hash SHA-256 de la IP como ID,
   y las reglas de Firestore solo permiten crearlo (nunca
   sobrescribirlo), así cada IP cuenta una sola vez.
   ============================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, doc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import {
  getAnalytics, logEvent
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';
import { firebaseConfig, STATS_TIMEZONE } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // En caso de bloqueadores o entornos sin soporte de Analytics
}

const IP_SALT = 'lalomada-puiggari';
const IP_SERVICES = [
  { url: 'https://api.ipify.org?format=json', parse: (r) => r.json().then((d) => d.ip) },
  { url: 'https://api64.ipify.org?format=json', parse: (r) => r.json().then((d) => d.ip) },
  { url: 'https://icanhazip.com', parse: (r) => r.text() }
];

// ---- HELPERS ----
function safeStorage(type) {
  try { return window[type]; } catch (e) { return null; }
}

function flagKey(collection) {
  return 'lalomada_' + collection + '_ok';
}

function today() {
  // en-CA da formato YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: STATS_TIMEZONE }).format(new Date());
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

let ipHashPromise = null;
function getIpHash() {
  if (ipHashPromise) return ipHashPromise;

  ipHashPromise = (async () => {
    const session = safeStorage('sessionStorage');
    const cached = session && session.getItem('lalomada_iphash');
    if (cached) return cached;

    for (const service of IP_SERVICES) {
      try {
        const res = await fetch(service.url, { cache: 'no-store' });
        if (!res.ok) continue;
        const ip = (await service.parse(res)).trim();
        if (!ip) continue;
        const hash = await sha256(IP_SALT + ':' + ip);
        if (session) session.setItem('lalomada_iphash', hash);
        return hash;
      } catch (e) { /* probar el siguiente servicio */ }
    }
    return null;
  })();

  return ipHashPromise;
}

async function record(collection, extra) {
  const local = safeStorage('localStorage');
  const ipHash = await getIpHash();
  if (!ipHash) return; // sin IP no se registra, para no inflar datos

  // Evita escrituras innecesarias si este navegador ya registró esta IP
  if (local && local.getItem(flagKey(collection)) === ipHash) return;

  try {
    await setDoc(doc(db, collection, ipHash), {
      ts: serverTimestamp(),
      day: today(),
      ...extra
    });
  } catch (e) {
    // permission-denied = esta IP ya estaba registrada (es lo esperado)
    if (e && e.code !== 'permission-denied') {
      console.warn('[stats]', e);
      return;
    }
  }
  if (local) local.setItem(flagKey(collection), ipHash);
}

// ---- API PÚBLICA ----
// Click en cualquier botón que lleva a WhatsApp
window.lalomadaTrackClick = function (buttonId) {
  if (analytics) {
    try {
      logEvent(analytics, 'click_whatsapp', { button: String(buttonId || 'desconocido') });
    } catch (e) {}
  }
  record('clicks', { button: String(buttonId || 'desconocido').slice(0, 40) });
};

// Visita al sitio
if (analytics) {
  try {
    logEvent(analytics, 'page_view');
  } catch (e) {}
}
record('visits', {
  referrer: (document.referrer ? new URL(document.referrer).hostname : 'directo').slice(0, 100)
});
