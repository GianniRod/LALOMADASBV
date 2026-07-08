/* ============================================
   LA LOMADA DE PUIGGARI — Script
   Mobile menu, smooth scroll, WhatsApp CTAs,
   scroll-reveal animations
   ============================================ */

(function () {
  'use strict';

  // ---- CONFIG ----
  // Reemplazar con el número real de WhatsApp (formato internacional sin +)
  const WHATSAPP_NUMBER = '5493431234567';

  const WHATSAPP_MESSAGES = {
    general: 'Hola, me interesa recibir asesoramiento sobre los lotes disponibles en La Lomada de Puiggari.',
    map: 'Hola, quisiera solicitar el mapa actualizado con los lotes aptos para escriturar en La Lomada de Puiggari.',
    tour: 'Hola, me gustaría agendar un recorrido presencial por La Lomada de Puiggari.',
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
      ctaNavbar: 'general',
      ctaHero: 'general',
      ctaMap: 'map',
      ctaTour: 'tour',
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

    window.addEventListener('scroll', function () {
      if (window.scrollY > 60) {
        navbar.style.borderBottomColor = '#E0E0E0';
      } else {
        navbar.style.borderBottomColor = 'transparent';
      }
    });

    // Set initial state
    if (window.scrollY <= 60) {
      navbar.style.borderBottomColor = 'transparent';
    }
  }

  // ---- INIT ----
  document.addEventListener('DOMContentLoaded', function () {
    bindCTAs();
    initMobileMenu();
    initReveal();
    initNavbarScroll();
  });
})();
