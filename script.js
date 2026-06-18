/* ============================================================
   Kshama Bhatt — Portfolio
   Cursor-follow blob, click ripples, scroll reveals, project carousel.
   ============================================================ */

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Cursor-following pink blob ---------- */
  const cursorBlob = document.querySelector('.blob-cursor');
  const bgCanvas   = document.querySelector('.bg-canvas');

  if (cursorBlob && !prefersReducedMotion) {
    let targetX = window.innerWidth * 0.5;
    let targetY = window.innerHeight * 0.35;
    let blobX   = targetX;
    let blobY   = targetY;
    let active  = false;

    const setTarget = (x, y) => {
      targetX = x; targetY = y;
      if (!active) {
        active = true;
        cursorBlob.classList.add('is-active');
      }
    };

    window.addEventListener('pointermove', (e) => setTarget(e.clientX, e.clientY), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length) setTarget(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    const tick = () => {
      blobX += (targetX - blobX) * 0.045;
      blobY += (targetY - blobY) * 0.045;
      cursorBlob.style.transform =
        `translate3d(${blobX}px, ${blobY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    document.addEventListener('mouseleave', () => {
      active = false;
      cursorBlob.classList.remove('is-active');
    });
  }

  /* ---------- Click ripple ---------- */
  if (bgCanvas && !prefersReducedMotion) {
    const COLORS = [
      'rgba(255, 102, 196, 0.6)',
      'rgba(255, 61, 166, 0.55)',
      'rgba(192, 38, 211, 0.5)',
      'rgba(255, 75, 110, 0.55)',
    ];

    let lastRipple = 0;

    document.addEventListener('pointerdown', (e) => {
      const now = performance.now();
      if (now - lastRipple < 120) return;
      lastRipple = now;
      if (e.target.closest('a, button')) return;

      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top  = `${e.clientY}px`;
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      ripple.style.background = `radial-gradient(circle, ${color}, transparent 65%)`;
      bgCanvas.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }, { passive: true });
  }

  /* ---------- Parallax on static blobs ---------- */
  if (!prefersReducedMotion) {
    const layers = [
      { el: document.querySelector('.blob-magenta'), factor: -0.04 },
      { el: document.querySelector('.blob-purple'),  factor:  0.06 },
      { el: document.querySelector('.blob-rose'),    factor: -0.08 },
    ].filter(l => l.el);

    let lastScroll = 0;
    let ticking = false;
    const update = () => {
      const y = lastScroll;
      layers.forEach(({ el, factor }) => {
        el.style.translate = `0 ${y * factor}px`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      lastScroll = window.scrollY;
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in-view'));
  }

  /* ---------- Top nav ---------- */
  const topnav = document.getElementById('topnav');
  const hero   = document.getElementById('home');
  if (topnav && hero) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        topnav.classList.toggle('is-visible', !entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    navObserver.observe(hero);
  }

  /* ---------- Smooth-scroll for anchors ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', id);
    });
  });

  /* ---------- Projects carousel ---------- */
  const track  = document.getElementById('carousel-track');
  const dotsEl = document.getElementById('carousel-dots');
  const prevBtn = document.querySelector('.carousel-prev');
  const nextBtn = document.querySelector('.carousel-next');

  if (track) {
    const cards = Array.from(track.querySelectorAll('.proj'));

    // Build dot pagination
    if (dotsEl) {
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Go to project ${i + 1}`);
        dot.addEventListener('click', () => scrollToCard(i));
        dotsEl.appendChild(dot);
      });
    }
    const dots = dotsEl ? Array.from(dotsEl.querySelectorAll('button')) : [];

    const cardWidth = () => {
      if (cards.length < 2) return cards[0]?.offsetWidth || 0;
      return cards[1].offsetLeft - cards[0].offsetLeft;
    };

    const scrollToCard = (index) => {
      const clamped = Math.max(0, Math.min(cards.length - 1, index));
      track.scrollTo({ left: cards[clamped].offsetLeft - track.offsetLeft, behavior: 'smooth' });
    };

    const updateActive = () => {
      const w = cardWidth();
      if (!w) return;
      const index = Math.round(track.scrollLeft / w);
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
      if (prevBtn) prevBtn.disabled = index === 0;
      if (nextBtn) nextBtn.disabled = index === cards.length - 1;
    };

    if (prevBtn) prevBtn.addEventListener('click', () => {
      const w = cardWidth();
      const index = Math.round(track.scrollLeft / w);
      scrollToCard(index - 1);
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      const w = cardWidth();
      const index = Math.round(track.scrollLeft / w);
      scrollToCard(index + 1);
    });

    track.addEventListener('scroll', () => {
      requestAnimationFrame(updateActive);
    }, { passive: true });

    // initial active state
    updateActive();
    window.addEventListener('resize', updateActive);
  }
})();
