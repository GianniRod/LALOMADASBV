/* ============================================
   LA LOMADA DE PUIGGARI — Píxel de Meta
   Registra la visita (PageView) en las dos landings. El click a WhatsApp se envía como
   evento "Contact" desde tracking.js. Si META_PIXEL_ID queda vacío, no hace nada.
   No se activa en la vista previa del panel ni cuando la A está por redirigir a la B
   (para no contar dos visitas).
   ============================================ */

(function () {
  'use strict';

  // ID del píxel (solo números): Administrador de eventos de Meta → Orígenes de datos → el píxel
  var META_PIXEL_ID = '1071414762553379';

  if (!/^\d{5,20}$/.test(META_PIXEL_ID)) return;
  if (window.LALOMADA_REDIRECTING || window.LALOMADA_PREVIEW) return;
  if (window.LALOMADA_TRACK === false) return; // landing nueva abierta como vista previa

  /* Código base del píxel de Meta */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
    n.queue = []; t = b.createElement(e); t.async = !0;
    t.src = v; s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView', { variant: window.LALOMADA_VARIANT || 'sin_prueba' });
})();
