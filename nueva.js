/* ============================================
   LA LOMADA DE PUIGGARI — Nuevo diseño (versión de prueba)
   Menú, WhatsApp, animaciones y visor de fotos.
   No registra estadísticas: no llama a lalomadaTrackClick ni carga tracking.js.
   ============================================ */

(function () {
  'use strict';

  // Mismo número y mensaje que la landing actual (script.js)
  const WHATSAPP_NUMBER = '5493435046423';
  const WHATSAPP_MESSAGE = 'Hola, quisiera solicitar asesoramiento sobre el Barrio Privado La Lomada de Puiggari.';

  function openWhatsApp() {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    window.open(url, '_blank', 'noopener');
  }

  function bindCTAs() {
    ['ctaNavbar', 'ctaHero', 'ctaFooter', 'ctaWhatsappFloat'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openWhatsApp();
      });
    });
  }

  // ---- MENÚ (celular) ----
  function initMenu() {
    const toggle = document.getElementById('hdrToggle');
    const nav = document.getElementById('hdrNav');
    if (!toggle || !nav) return;

    function setOpen(open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) setOpen(false);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1060 && nav.classList.contains('open')) setOpen(false);
    });
  }

  // ---- HEADER al hacer scroll ----
  function initHeader() {
    const hdr = document.getElementById('hdr');
    if (!hdr) return;
    function update() { hdr.classList.toggle('scrolled', window.scrollY > 20); }
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ---- APARICIÓN AL HACER SCROLL ----
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  // ---- VISOR DE FOTOS ----
  function initLightbox() {
    const tiles = Array.from(document.querySelectorAll('.tile'));
    const lb = document.getElementById('lb');
    const img = document.getElementById('lbImg');
    const cap = document.getElementById('lbCap');
    if (!tiles.length || !lb) return;

    let current = 0;
    let lastFocus = null;
    let touchX = 0;

    function show(index) {
      current = (index + tiles.length) % tiles.length;
      const src = tiles[current].querySelector('img');
      img.src = src.getAttribute('src');
      img.alt = src.alt;
      cap.textContent = src.alt + ' · ' + (current + 1) + ' / ' + tiles.length;
    }

    function open(index) {
      lastFocus = document.activeElement;
      show(index);
      lb.hidden = false;
      document.body.style.overflow = 'hidden';
      document.getElementById('lbClose').focus();
    }

    function close() {
      lb.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    tiles.forEach(function (tile, i) {
      tile.addEventListener('click', function () { open(i); });
    });
    document.getElementById('lbClose').addEventListener('click', close);
    document.getElementById('lbPrev').addEventListener('click', function () { show(current - 1); });
    document.getElementById('lbNext').addEventListener('click', function () { show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      const diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) show(diff > 0 ? current + 1 : current - 1);
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', function () {
    bindCTAs();
    initMenu();
    initHeader();
    initReveal();
    initLightbox();
  });
})();
