/* ============================================
   LA LOMADA DE PUIGGARI — Tracking
   Registra 1 visita y 1 click a WhatsApp por IP.
   El documento se guarda con el hash SHA-256 de la IP como ID,
   y las reglas de Firestore solo permiten crearlo (nunca
   sobrescribirlo), así cada IP cuenta una sola vez.
   ============================================ */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore, doc, setDoc, addDoc, collection, serverTimestamp
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

// Ubicación aproximada según la IP (país, provincia, ciudad, coordenadas). Va aparte del hash
// para no cambiar el ID de los visitantes ya registrados. La IP no se guarda.
const GEO_SERVICES = [
  'https://get.geojs.io/v1/ip/geo.json',
  'https://ipapi.co/json/'
];
const GEO_TIMEOUT_MS = 3000;
// Cambiar la versión invalida lo que haya quedado guardado en la sesión con un formato viejo
const GEO_CACHE_KEY = 'lalomada_geo_v2';

let geoPromise = null;
function getGeo() {
  if (geoPromise) return geoPromise;

  geoPromise = (async () => {
    const session = safeStorage('sessionStorage');
    try {
      const cached = session && session.getItem(GEO_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    let best = null; // si un servicio no trae la ciudad, se prueba el siguiente
    for (const url of GEO_SERVICES) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS);
        const res = await fetch(url, { cache: 'no-store', signal: ctrl.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const d = await res.json();
        const geo = {};
        if (d.country_code) geo.country = String(d.country_code).slice(0, 2).toUpperCase();
        if (d.region) geo.region = String(d.region).slice(0, 60);
        if (d.city) geo.city = String(d.city).slice(0, 60);
        // Coordenadas aproximadas (redondeadas a ~1 km) para ubicar el departamento en el mapa.
        // Sin ciudad, las coordenadas son el centro de la provincia y ubicarían mal el departamento.
        const lat = parseFloat(d.latitude), lon = parseFloat(d.longitude);
        if (geo.city && isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
          geo.lat = Math.round(lat * 100) / 100;
          geo.lon = Math.round(lon * 100) / 100;
        }
        if (!geo.country && !geo.region) continue;
        if (!best) best = geo;
        if (geo.city) { best = geo; break; }
      } catch (e) { /* probar el siguiente servicio */ }
    }
    if (best && session) session.setItem(GEO_CACHE_KEY, JSON.stringify(best));
    return best || {}; // sin ubicación igual se registra la visita
  })();

  return geoPromise;
}

// Visitas que no se registran: robots que revisan la página (Vercel, buscadores),
// que entran desde San José, California, o se identifican como bots en el user agent
const BOT_UA = /bot|crawler|spider|headless|lighthouse|vercel|facebookexternalhit/i;
let excludedPromise = null;
function isExcludedVisitor() {
  if (!excludedPromise) {
    excludedPromise = BOT_UA.test(navigator.userAgent || '')
      ? Promise.resolve(true)
      : getGeo().then((geo) => geo.country === 'US' && /^san jose$/i.test(geo.city || ''));
  }
  return excludedPromise;
}

async function record(collection, extra) {
  if (await isExcludedVisitor()) return;
  // sessionStorage (no localStorage): si se borran los datos desde el panel,
  // en la próxima sesión la IP se vuelve a registrar
  const local = safeStorage('sessionStorage');
  const ipHash = await getIpHash();
  if (!ipHash) return; // sin IP no se registra, para no inflar datos

  // Evita escrituras innecesarias si en esta sesión ya se registró esta IP
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

// Historial completo: guarda cada acceso/click (no solo el primero por IP),
// con el hash de la IP para poder cruzar accesos con clicks
async function log(name, extra) {
  if (await isExcludedVisitor()) return true; // "ok": no hay nada que reintentar
  const ipHash = await getIpHash();
  if (!ipHash) return false;
  try {
    await addDoc(collection(db, name), {
      ipHash,
      ts: serverTimestamp(),
      day: today(),
      ...extra
    });
    return true;
  } catch (e) {
    console.warn('[stats]', e);
    return false;
  }
}

// ---- API PÚBLICA ----
// Click en cualquier botón que lleva a WhatsApp
window.lalomadaTrackClick = function (buttonId) {
  if (analytics) {
    try {
      logEvent(analytics, 'click_whatsapp', { button: String(buttonId || 'desconocido') });
    } catch (e) {}
  }
  const button = String(buttonId || 'desconocido').slice(0, 40);
  record('clicks', { button });
  log('clickLog', { button });
};

// Visita al sitio
if (analytics) {
  try {
    logEvent(analytics, 'page_view');
  } catch (e) {}
}
// Origen de la visita. Instagram y Facebook abren los links en su propio navegador
// y muchas veces no mandan referrer, así que también se mira la URL (utm_source,
// fbclid de los anuncios de Meta) y el user agent del navegador interno de cada app.
function detectSource() {
  let params;
  try { params = new URLSearchParams(location.search); } catch (e) { params = new URLSearchParams(); }
  const utmSource = (params.get('utm_source') || '').toLowerCase();
  const utmMedium = (params.get('utm_medium') || '').toLowerCase();
  const ua = navigator.userAgent || '';
  let host = '';
  try { host = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}

  let source = null;
  if (/^(ig|instagram)/.test(utmSource) || /Instagram/.test(ua) || /instagram\.com$/.test(host)) {
    source = 'instagram';
  } else if (/^(fb|facebook)/.test(utmSource) || /FBAN|FBAV|FB_IAB|FBIOS/.test(ua) || /(facebook\.com|fb\.com|fb\.me)$/.test(host)) {
    source = 'facebook';
  }

  // "Pauta" solo si el anuncio lo indica en la URL. fbclid NO sirve: Meta lo agrega
  // a cualquier link tocado dentro de sus apps (mensajes, historias, bio).
  // Se reconoce utm_medium=paid (o similar) y los valores que pone Meta con
  // utm_source={{site_source_name}}: ig, fb, msg (Messenger), an (Audience Network).
  // Pero Instagram agrega solo utm_source=ig&utm_medium=social&utm_content=link_in_bio
  // al link de la bio: utm_source=ig cuenta como pauta únicamente si no hay otro utm_medium.
  const utmContent = (params.get('utm_content') || '').toLowerCase();
  const organic = utmMedium === 'social' || /link_in_bio/.test(utmContent);
  const paid = /paid|cpc|ads?$|pauta/.test(utmMedium)
    || (!organic && !utmMedium && /^(ig|fb|msg|an)$/.test(utmSource));
  // fbclid solo indica que vino de una app de Meta, sin decir si fue Facebook o Instagram
  if (!source && params.has('fbclid')) source = 'meta';

  if (source) return source + (paid ? ' (pauta)' : '');
  return host || 'directo';
}

const referrer = detectSource().slice(0, 100);
getGeo().then((geo) => {
  record('visits', { referrer, ...geo });

  // Un acceso por sesión del navegador: recargar o navegar dentro del sitio no suma otro
  const session = safeStorage('sessionStorage');
  if (!session || !session.getItem('lalomada_visitlog_ok')) {
    log('visitLog', { referrer, ...geo }).then((ok) => {
      if (ok && session) session.setItem('lalomada_visitlog_ok', '1');
    });
  }
});
