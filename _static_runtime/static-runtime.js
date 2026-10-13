/* Smile Study Koshigaya static compatibility runtime */
(function () {
  'use strict';
  document.documentElement.classList.add('ss-static-runtime');

  var C = {
    reveal: 'Reveal-module__vCs_Ea__reveal',
    visible: 'Reveal-module__vCs_Ea__visible',
    header: 'Header-module__Af2_WG__header',
    scrolled: 'Header-module__Af2_WG__scrolled',
    burger: 'Header-module__Af2_WG__burger',
    mobilePanel: 'Header-module__Af2_WG__mobilePanel',
    mobilePanelOpen: 'Header-module__Af2_WG__mobilePanelOpen',
    faqQuestion: 'FaqAccordion-module__77O0pG__question',
    faqPanel: 'FaqAccordion-module__77O0pG__panel',
    faqPanelInner: 'FaqAccordion-module__77O0pG__panelInner',
    faqIcon: 'FaqAccordion-module__77O0pG__icon',
    faqIconOpen: 'FaqAccordion-module__77O0pG__iconOpen',
    carouselFrame: 'HeroCarousel-module__glPAvq__frame',
    carouselSlide: 'HeroCarousel-module__glPAvq__slide',
    carouselActive: 'HeroCarousel-module__glPAvq__active',
    carouselDot: 'HeroCarousel-module__glPAvq__dot',
    carouselDotActive: 'HeroCarousel-module__glPAvq__dotActive'
  };

  function q(cls, root) { return (root || document).querySelector('.' + cls); }
  function qa(cls, root) { return Array.prototype.slice.call((root || document).querySelectorAll('.' + cls)); }

  function initReveal() {
    var items = qa(C.reveal);
    if (!items.length) return;

    /* Normalize DOM captured by "Save Page, Complete".
       A saved page may already contain the visible class if it had been
       scrolled before saving. Remove it so every page starts from the same
       pre-animation state and IntersectionObserver can replay the reveal. */
    items.forEach(function (el) { el.classList.remove(C.visible); });
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add(C.visible); });
      return;
    }
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add(C.visible); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add(C.visible);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  function initHeader() {
    var header = q(C.header);
    var burger = q(C.burger);
    var panel = q(C.mobilePanel);

    if (header) {
      var update = function () {
        header.classList.toggle(C.scrolled, window.scrollY > 8);
      };
      update();
      window.addEventListener('scroll', update, { passive: true });
    }

    if (!burger || !panel) return;
    var navItems = Array.prototype.slice.call(panel.querySelectorAll('nav li'));
    var openSvg = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M4 4L18 18M18 4L4 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>';
    var closedSvg = '<svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M2 6H20M2 11H20M2 16H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>';

    function setOpen(open) {
      panel.classList.toggle(C.mobilePanelOpen, open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
      burger.innerHTML = open ? openSvg : closedSvg;
      document.documentElement.style.overflow = open ? 'hidden' : '';
      navItems.forEach(function (li, i) { li.style.transitionDelay = open ? (60 + 40 * i) + 'ms' : '0ms'; });
    }

    setOpen(false);
    burger.addEventListener('click', function () { setOpen(burger.getAttribute('aria-expanded') !== 'true'); });
    panel.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1260) setOpen(false); }, { passive: true });
  }

  function initFaq() {
    var questions = qa(C.faqQuestion);
    if (!questions.length) return;

    // Build independent accordion groups from each nearest list container.
    var groups = [];
    questions.forEach(function (button) {
      var list = button.closest('[class*="FaqAccordion-module__77O0pG__list"]') || button.parentElement.parentElement;
      if (groups.indexOf(list) < 0) groups.push(list);
    });

    groups.forEach(function (list) {
      var buttons = Array.prototype.slice.call(list.querySelectorAll('.' + C.faqQuestion));
      function apply(button, open) {
        var id = button.getAttribute('aria-controls');
        var panel = id ? document.getElementById(id) : null;
        var icon = q(C.faqIcon, button);
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (icon) icon.classList.toggle(C.faqIconOpen, open);
        if (panel) {
          var inner = q(C.faqPanelInner, panel) || panel.firstElementChild;
          panel.style.maxHeight = open && inner ? inner.scrollHeight + 'px' : '0px';
        }
      }

      buttons.forEach(function (button) {
        apply(button, button.getAttribute('aria-expanded') === 'true');
        button.addEventListener('click', function () {
          var wasOpen = button.getAttribute('aria-expanded') === 'true';
          buttons.forEach(function (b) { apply(b, false); });
          if (!wasOpen) apply(button, true);
        });
      });

      window.addEventListener('resize', function () {
        buttons.forEach(function (button) {
          if (button.getAttribute('aria-expanded') === 'true') apply(button, true);
        });
      }, { passive: true });
    });
  }

  function initCarousels() {
    qa(C.carouselFrame).forEach(function (frame) {
      var slides = qa(C.carouselSlide, frame);
      var dots = qa(C.carouselDot, frame);
      if (slides.length <= 1) return;
      var current = Math.max(0, slides.findIndex(function (s) { return s.classList.contains(C.carouselActive); }));
      var timer = null;

      function show(index) {
        current = ((index % slides.length) + slides.length) % slides.length;
        slides.forEach(function (s, i) { s.classList.toggle(C.carouselActive, i === current); });
        dots.forEach(function (d, i) {
          d.classList.toggle(C.carouselDotActive, i === current);
          d.setAttribute('aria-selected', i === current ? 'true' : 'false');
        });
      }
      function start() {
        if (timer) clearInterval(timer);
        timer = setInterval(function () { show(current + 1); }, 4500);
      }
      dots.forEach(function (dot, i) { dot.addEventListener('click', function () { show(i); start(); }); });
      show(current);
      start();
    });
  }

  function initContactLocalGuard() {
    var form = document.querySelector('form');
    if (!form || !form.querySelector('[class*="ContactForm-module"]')) return;
    // Preserve all native field interactions. Do not fake a successful submission locally.
    form.addEventListener('submit', function (ev) {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:') {
        ev.preventDefault();
        var old = form.querySelector('.ss-local-form-notice');
        if (old) old.remove();
        var p = document.createElement('p');
        p.className = 'ss-local-form-notice';
        p.setAttribute('role', 'status');
        p.textContent = 'ローカル再現版のため送信処理は無効です。本番WordPress化の際にフォーム送信先を接続します。';
        form.appendChild(p);
      }
    });
  }

  function initSplashOnce() {
    // Original client component: fade begins at 2500ms and is removed at 3600ms.
    // Show once per tab/session so static page-to-page reloads do not replay it on every navigation.
    try {
      if (sessionStorage.getItem('ss-koshigaya-splash-shown')) return;
      sessionStorage.setItem('ss-koshigaya-splash-shown', '1');
    } catch (e) {}
    var cssExists = Array.prototype.some.call(document.styleSheets, function (sheet) {
      try { return Array.prototype.some.call(sheet.cssRules || [], function (r) { return (r.selectorText || '').indexOf('SplashScreen-module__EV1mtW__splash') >= 0; }); }
      catch (e) { return false; }
    });
    if (!cssExists) return;
    var logo = document.querySelector('img[class*="Header-module__Af2_WG__logoImg"]');
    if (!logo) return;
    var splash = document.createElement('div');
    splash.className = 'SplashScreen-module__EV1mtW__splash ss-runtime-splash';
    splash.setAttribute('aria-hidden', 'true');
    splash.innerHTML = '<div class="SplashScreen-module__EV1mtW__content"><span class="SplashScreen-module__EV1mtW__iconSlot"><img class="SplashScreen-module__EV1mtW__logoImg" alt=""></span><span class="SplashScreen-module__EV1mtW__logoText">１対１スマイルスタディ</span></div>';
    splash.querySelector('img').src = logo.currentSrc || logo.src;
    document.body.appendChild(splash);
    setTimeout(function () { splash.classList.add('SplashScreen-module__EV1mtW__fadeOut'); }, 2500);
    setTimeout(function () { splash.remove(); }, 3600);
  }

  function init() {
    initHeader();
    initReveal();
    initFaq();
    initCarousels();
    initContactLocalGuard();
    // Splash is intentionally last so layout is already painted beneath it.
    initSplashOnce();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
