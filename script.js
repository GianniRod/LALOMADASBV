/* ============================================
   LA LOMADA DE PUIGGARI — Script
   Mobile menu, smooth scroll, WhatsApp CTAs,
   scroll-reveal animations
   ============================================ */

(function () {
  'use strict';

  // ---- CONFIG ----
  // Reemplazar con el número real de WhatsApp (formato internacional sin +)
  const WHATSAPP_NUMBER = '5493435046423';

  const WHATSAPP_MESSAGES = {
    general: 'Hola, me interesa recibir información y asesoramiento sobre el Fideicomiso La Lomada de Puiggari.',
    asesoramiento: 'Hola, me gustaría solicitar asesoramiento sobre el Fideicomiso La Lomada de Puiggari.',
    conocer: 'Hola, quiero conocer más sobre el proyecto Fideicomiso La Lomada de Puiggari.',
    reunion: 'Hola, me gustaría agendar una reunión sobre el Fideicomiso La Lomada de Puiggari.',
    informacion: 'Hola, quisiera solicitar información detallada sobre el proyecto Fideicomiso La Lomada de Puiggari.',
    fideicomiso: 'Hola, me gustaría consultar sobre el fideicomiso de La Lomada de Puiggari.',
    escribano: 'Hola, quisiera hablar con un escribano interviniente sobre el Fideicomiso La Lomada de Puiggari.'
  };

  // ---- WHATSAPP REDIRECT ----
  function openWhatsApp(messageKey) {
    const message = WHATSAPP_MESSAGES[messageKey] || WHATSAPP_MESSAGES.general;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener');
  }

  // Bind CTA buttons
  function bindCTAs() {
    const bindings = {
      ctaNavbar: 'asesoramiento',
      ctaHero1: 'conocer',
      ctaHero2: 'reunion',
      ctaAsesoramiento: 'asesoramiento',
      ctaReunion: 'reunion',
      ctaEscribano: 'escribano'
    };

    Object.entries(bindings).forEach(([id, messageKey]) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          openWhatsApp(messageKey);
        });
      }
    });
  }

  // ---- MOBILE MENU ----
  function initMobileMenu() {
    const toggle = document.getElementById('navbarToggle');
    const menu = document.getElementById('navbarMenu');

    if (!toggle || !menu) return;

    function closeMenu() {
      toggle.classList.remove('active');
      menu.classList.remove('open');
    }

    function openMenu() {
      toggle.classList.add('active');
      menu.classList.add('open');
    }

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close menu when clicking a link
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (menu.classList.contains('open') && !menu.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    // Close menu on scroll
    window.addEventListener('scroll', function () {
      if (menu.classList.contains('open')) {
        closeMenu();
      }
    });
  }

  // ---- SCROLL REVEAL ----
  function initReveal() {
    const reveals = document.querySelectorAll('.reveal');

    if (!reveals.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15 }
      );

      reveals.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Fallback: show all
      reveals.forEach(function (el) {
        el.classList.add('visible');
      });
    }
  }

  // ---- NAVBAR BACKGROUND ON SCROLL ----
  function initNavbarScroll() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    function updateNavbar() {
      if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
        navbar.style.borderBottomColor = '#E4E4E4';
      } else {
        navbar.classList.remove('scrolled');
        navbar.style.borderBottomColor = 'rgba(228, 228, 228, 0.70)';
      }
    }

    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
  }

  // ---- INIT ----
  document.addEventListener('DOMContentLoaded', function () {
    bindCTAs();
    initMobileMenu();
    initReveal();
    initNavbarScroll();
  });
})();
