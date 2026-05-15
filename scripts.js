const FADE_MS = 500;

function initFadingVideo(video) {
  let rafId = null;
  let loaded = false;
  let visible = false;
  let loadTriggered = false;

  video.style.opacity = '0';
  video.preload = 'none';

  function fadeTo(target, duration) {
    if (rafId) cancelAnimationFrame(rafId);
    const start = parseFloat(video.style.opacity) || 0;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      video.style.opacity = start + (target - start) * progress;
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
      }
    }
    rafId = requestAnimationFrame(step);
  }

  function onReady() {
    loaded = true;
    fadeTo(1, FADE_MS);
    if (visible) {
      video.play();
    }
  }

  video.addEventListener('loadeddata', onReady, { once: true });

  return function setVisible(v) {
    visible = v;
    if (v) {
      if (!loaded) {
        if (!loadTriggered) {
          loadTriggered = true;
          video.preload = 'auto';
          video.load();
        }
        if (video.readyState >= 2) {
          onReady();
        }
      } else {
        video.play();
      }
    } else if (loaded) {
      video.pause();
    }
  };
}

function initFadingImage(img) {
  const originalSrc = img.src;
  img.style.opacity = '0';
  img.style.transition = `opacity ${FADE_MS}ms ease`;
  img.src = '';

  function reveal() {
    img.style.opacity = '1';
  }

  img.addEventListener('load', reveal, { once: true });

  return function trigger() {
    img.src = originalSrc;
    if (img.complete && img.naturalWidth > 0) {
      requestAnimationFrame(reveal);
    }
  };
}

function animateHeroWords() {
  const heroTitle = document.querySelector('.hero-title');
  if (!heroTitle) return;

  const nodes = Array.from(heroTitle.childNodes);
  const fragment = document.createDocumentFragment();
  const elementQueue = [];
  let wordIndex = 0;
  const DELAY = 35;
  const INITIAL_DELAY = 300;

  nodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parts = node.textContent.split(/(\s+)/);
      parts.forEach(part => {
        if (!part || /^\s+$/.test(part)) {
          if (part) fragment.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement('span');
          span.className = 'word';
          span.style.animationDelay = `${INITIAL_DELAY + wordIndex * DELAY}ms`;
          span.textContent = part;
          fragment.appendChild(span);
          wordIndex++;
        }
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node.cloneNode(true);
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.4s ease';
      fragment.appendChild(el);
      elementQueue.push({ el, delay: INITIAL_DELAY + wordIndex * DELAY });
      wordIndex++;
    }
  });

  heroTitle.textContent = '';
  heroTitle.appendChild(fragment);
  heroTitle.style.opacity = '1';

  elementQueue.forEach(({ el, delay }) => {
    setTimeout(() => { el.style.opacity = '1'; }, delay);
  });
}

function initHoverFollow() {
  document.querySelectorAll('.hover-reveal').forEach(reveal => {
    const img = reveal.querySelector('.hover-img');
    if (!img) return;

    const rotation = (Math.random() - 0.5) * 6;
    img.style.rotate = `${rotation}deg`;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let rafId = null;
    let active = false;
    let imgW = 0, imgH = 0;

    const preload = new Image();
    preload.src = img.src;
    preload.onload = () => {
      const iw = parseInt(img.style.width) || 0;
      const ih = parseInt(img.style.height) || 0;
      const nw = preload.naturalWidth;
      const nh = preload.naturalHeight;
      if (iw && ih) { imgW = iw; imgH = ih; }
      else if (ih) { imgH = ih; imgW = (nw / nh) * ih; }
      else if (iw) { imgW = iw; imgH = (nh / nw) * iw; }
      else { imgW = nw; imgH = nh; }
    };

    function pos(cx, cy) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const gap = 24;
      let x = cx + gap;
      let y = cy + gap;
      if (x + imgW > vw - 8) x = cx - imgW - gap;
      if (y + imgH > vh - 8) y = cy - imgH - gap;
      if (x < 8) x = 8;
      if (y < 8) y = 8;
      return [x, y];
    }

    function animate() {
      if (!active) return;
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      img.style.translate = `${currentX}px ${currentY}px`;
      rafId = requestAnimationFrame(animate);
    }

    reveal.addEventListener('mouseenter', (e) => {
      active = true;
      document.body.appendChild(img);
      if (img.offsetWidth > 0) imgW = img.offsetWidth;
      if (img.offsetHeight > 0) imgH = img.offsetHeight;
      const [x, y] = pos(e.clientX, e.clientY);
      targetX = x;
      targetY = y;
      currentX = x;
      currentY = y;
      img.style.translate = `${x}px ${y}px`;
      img.style.opacity = '1';
      img.style.animation = 'hoverBounce 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
      animate();
    });

    reveal.addEventListener('mousemove', (e) => {
      const [x, y] = pos(e.clientX, e.clientY);
      targetX = x;
      targetY = y;
    });

    reveal.addEventListener('mouseleave', () => {
      active = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      img.style.opacity = '0';
      img.style.animation = '';
      setTimeout(() => {
        if (!active) reveal.appendChild(img);
      }, 250);
    });
  });
}

function initParallax() {
  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  const parallaxEnd = () => '+=' + window.innerHeight * 3.5;

  gsap.to('.parallax-column--left', {
    yPercent: -22,
    ease: 'none',
    scrollTrigger: {
      trigger: '.intro',
      start: 'top top',
      end: parallaxEnd,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  gsap.to('.parallax-column--right', {
    yPercent: -28,
    ease: 'none',
    scrollTrigger: {
      trigger: '.intro',
      start: 'top top',
      end: parallaxEnd,
      scrub: 1,
      invalidateOnRefresh: true,
    },
  });

  // Short viewports only: hero is no longer sticky-pinned (see CSS),
  // so it scrolls naturally with the page. Translate it down so its
  // bottom edge reaches the viewport top exactly when the last
  // parallax card finishes exiting — keeping intro text behind the
  // images the entire time, then both exit together.
  //
  // Card exit timing depends on each column's actual height (which
  // scales with viewport height + card pixel sizes), so we compute it
  // dynamically. We also size .intro to match — its bottom = last
  // card exit + 1 viewport — so Projects enters the viewport exactly
  // as the cards/hero leave it (no overlap, no dead scroll).
  const computeLastCardExit = () => {
    let maxExit = 0;
    document.querySelectorAll('.parallax-column').forEach((col) => {
      const isLeft = col.classList.contains('parallax-column--left');
      const ratio = isLeft ? 0.22 : 0.28;
      maxExit = Math.max(maxExit, col.offsetHeight * (1 - ratio));
    });
    return maxExit;
  };

  const mm = gsap.matchMedia();
  mm.add('(max-height: 760px)', () => {
    const intro = document.querySelector('.intro');

    const updateIntroHeight = () => {
      if (intro) {
        intro.style.minHeight = (computeLastCardExit() + window.innerHeight) + 'px';
      }
    };

    updateIntroHeight();
    window.addEventListener('resize', updateIntroHeight);

    gsap.to('.intro-pin', {
      y: () => {
        const heroEl = document.querySelector('.intro .hero');
        if (!heroEl) return 0;
        const heroHeight = heroEl.getBoundingClientRect().height;
        const padTop = 140; // matches .intro-pin padding-top in short mode
        return Math.max(0, computeLastCardExit() - padTop - heroHeight);
      },
      ease: 'none',
      scrollTrigger: {
        trigger: '.intro',
        start: 'top top',
        end: () => '+=' + computeLastCardExit(),
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      window.removeEventListener('resize', updateIntroHeight);
      if (intro) intro.style.minHeight = '';
    };
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('resize', () => ScrollTrigger.refresh());
}

function initCursorDots() {
  const canvas = document.querySelector('.halftone-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const root = document.body;

  const SPACING = 16;
  const DOT = 1.8;
  const FALLOFF = 300;
  const MAX_PUSH = 6;
  const COLOR = 'rgba(184, 74, 58, 0.4)';
  const IDLE_DELAY = 1500;

  let targetXNorm = 0.5, targetYNorm = 0.5;
  let currentXNorm = 0.5, currentYNorm = 0.5;
  let mx = 0, my = 0;
  let tx = 0, ty = 0;
  let w = 0, h = 0;
  let dpr = 1;
  let lastInteractionTime = 0;
  let cursorInViewport = false;
  let firstFrame = true;

  // Drift anchoring: when drift starts, capture an offset between the
  // last cursor position and the drift function's value at that moment,
  // so the drift begins exactly at the cursor's last position. The
  // offset decays exponentially so the drift gradually settles back
  // into its natural pattern across the viewport.
  let driftWasActive = false;
  let driftStartTime = 0;
  let driftAnchorOffsetX = 0;
  let driftAnchorOffsetY = 0;
  const DRIFT_ANCHOR_DECAY_MS = 3000;

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  function setCursor(cx, cy) {
    tx = cx;
    ty = cy;
    targetXNorm = cx / window.innerWidth;
    targetYNorm = cy / window.innerHeight;
    lastInteractionTime = performance.now();
  }

  window.addEventListener('mousemove', (e) => {
    cursorInViewport = true;
    setCursor(e.clientX, e.clientY);
  }, { passive: true });

  document.addEventListener('mouseenter', () => {
    cursorInViewport = true;
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    cursorInViewport = false;
  }, { passive: true });

  // Window blur (alt-tab / focus another app): treat as cursor-out so
  // the glow starts drifting until interaction resumes.
  window.addEventListener('blur', () => {
    cursorInViewport = false;
  }, { passive: true });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length === 0) return;
    cursorInViewport = true;
    setCursor(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length === 0) return;
    cursorInViewport = true;
    setCursor(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  window.addEventListener('scroll', () => {
    lastInteractionTime = performance.now();
  }, { passive: true });

  function getDrift(t) {
    const s = t / 1000;
    const nx = 0.5 + 0.32 * Math.sin(s * 0.18) + 0.13 * Math.sin(s * 0.43 + 1.7);
    const ny = 0.5 + 0.30 * Math.cos(s * 0.22) + 0.12 * Math.cos(s * 0.37 + 2.3);
    return [nx * w, ny * h];
  }

  function tick(now) {
    if (now == null) now = performance.now();

    // Drift when the cursor is outside the viewport, or inside but
    // idle for longer than IDLE_DELAY. When drift first kicks in we
    // anchor it to the cursor's last position (so the glow doesn't
    // jump to wherever the drift function happens to be). The anchor
    // offset then decays exponentially, letting the drift slowly
    // wander back into its full-viewport pattern.
    const isIdle = now - lastInteractionTime > IDLE_DELAY;
    const shouldDrift = !cursorInViewport || isIdle;

    if (shouldDrift) {
      if (!driftWasActive) {
        const [dx0, dy0] = getDrift(now);
        // On the very first frame there's no prior cursor position,
        // so don't apply an anchor offset — start at the natural
        // drift point instead of (0, 0).
        driftAnchorOffsetX = firstFrame ? 0 : tx - dx0;
        driftAnchorOffsetY = firstFrame ? 0 : ty - dy0;
        driftStartTime = now;
        driftWasActive = true;
      }
      const fade = Math.exp(-(now - driftStartTime) / DRIFT_ANCHOR_DECAY_MS);
      const [dx, dy] = getDrift(now);
      tx = dx + driftAnchorOffsetX * fade;
      ty = dy + driftAnchorOffsetY * fade;
      targetXNorm = tx / w;
      targetYNorm = ty / h;
    } else {
      driftWasActive = false;
    }

    if (firstFrame) {
      // Snap to the first target on initial frame so the glow doesn't
      // sweep in from (0, 0) when the page first loads.
      mx = tx;
      my = ty;
      currentXNorm = targetXNorm;
      currentYNorm = targetYNorm;
      firstFrame = false;
    } else {
      mx += (tx - mx) * 0.12;
      my += (ty - my) * 0.12;
      currentXNorm += (targetXNorm - currentXNorm) * 0.06;
      currentYNorm += (targetYNorm - currentYNorm) * 0.06;
    }

    root.style.setProperty('--mx', currentXNorm.toFixed(4));
    root.style.setProperty('--my', currentYNorm.toFixed(4));

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = COLOR;

    const ff2 = FALLOFF * FALLOFF;
    for (let y = SPACING / 2; y < h; y += SPACING) {
      for (let x = SPACING / 2; x < w; x += SPACING) {
        const dx = x - mx;
        const dy = y - my;
        const d2 = dx * dx + dy * dy;
        let ox = 0, oy = 0, s = DOT;
        if (d2 < ff2) {
          const d = Math.sqrt(d2);
          const t = 1 - d / FALLOFF;
          const push = MAX_PUSH * t * t;
          if (d > 0.5) {
            ox = (dx / d) * push;
            oy = (dy / d) * push;
          }
          s = DOT * (1 + t * 0.6);
        }
        ctx.fillRect(x + ox - s / 2, y + oy - s / 2, s, s);
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
}

function initEmoticonEyes() {
  const outro = document.querySelector('.outro');
  const eyes = Array.from(document.querySelectorAll('.emoticon .eye'));
  if (!outro || !eyes.length) return;

  let mouseX = 0, mouseY = 0;
  let mouseInit = false;
  let inView = false;
  let rafId = null;

  const state = eyes.map(el => ({ el, current: 0 }));

  function tick() {
    if (!inView) {
      rafId = null;
      return;
    }
    if (mouseInit) {
      state.forEach(s => {
        const rect = s.el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = mouseX - cx;
        const dy = mouseY - cy;
        // ◕ glyph has its filled "iris" in the upper-left quadrant (~10:30).
        // CSS rotate is clockwise from 12 o'clock, so the rotation needed
        // to point the iris at the cursor is atan2 + 90° (cursor angle in
        // CSS frame) + 45° (offset of iris from 12 o'clock).
        const target = Math.atan2(dy, dx) * 180 / Math.PI + 135;
        let diff = target - s.current;
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;
        s.current += diff * 0.18;
        s.el.style.rotate = s.current.toFixed(2) + 'deg';
      });
    }
    rafId = requestAnimationFrame(tick);
  }

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    mouseInit = true;
  }, { passive: true });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      inView = entry.isIntersecting;
      if (inView && !rafId) {
        rafId = requestAnimationFrame(tick);
      }
    });
  }, { threshold: 0 });

  observer.observe(outro);
}

function initSparkleTrail() {
  const intro = document.querySelector('.intro');
  if (!intro) return;
  let lastSparkle = 0;

  intro.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastSparkle < 50) return;
    lastSparkle = now;

    const dot = document.createElement('div');
    dot.className = 'sparkle';
    const size = Math.random() * 4 + 2;
    dot.style.width = size + 'px';
    dot.style.height = size + 'px';
    dot.style.left = e.clientX + 'px';
    dot.style.top = e.clientY + 'px';
    document.body.appendChild(dot);
    dot.addEventListener('animationend', () => dot.remove());
  });
}

document.addEventListener('DOMContentLoaded', () => {
  animateHeroWords();
  initHoverFollow();
  initSparkleTrail();
  initParallax();
  initCursorDots();
  initEmoticonEyes();

  const projects = document.querySelectorAll('.project');

  projects.forEach((project) => {
    project.style.opacity = '0';
    project.style.transform = 'translateY(24px)';
    project.style.transition = `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`;

    const media = project.querySelector('video.project-screenshot');
    const img = project.querySelector('img.project-screenshot');

    if (media) {
      media._setVisible = initFadingVideo(media);
    } else if (img) {
      project._mediaTrigger = initFadingImage(img);
    }
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const project = entry.target;
        project.style.opacity = '1';
        project.style.transform = 'translateY(0)';

        if (project._mediaTrigger) {
          project._mediaTrigger();
          delete project._mediaTrigger;
        }

        observer.unobserve(project);
      }
    });
  }, {
    rootMargin: '0px',
    threshold: 0.1
  });

  projects.forEach((project) => observer.observe(project));

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (video._setVisible) {
        video._setVisible(entry.intersectionRatio >= 0.5);
      }
    });
  }, {
    threshold: [0, 0.5, 1]
  });

  document.querySelectorAll('video.project-screenshot').forEach((video) => {
    videoObserver.observe(video);
  });

  // Logo text click → scroll to top
  const logoTextLink = document.querySelector('.logo-text');
  if (logoTextLink) {
    logoTextLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // About Me link → smooth-scroll to outro.
  // Project images lazy-load (initFadingImage clears img.src until in view),
  // so before they load each project container has ~0 height. A native
  // smooth scroll computes the outro's target position once and locks in,
  // landing in the wrong spot once images load and push layout down.
  // Fix: (1) preempt all project loads so the page expands now, and
  // (2) use a custom rAF scroll that re-targets each frame.
  const aboutLink = document.querySelector('.nav-about');
  const outroEl = document.querySelector('#outro');
  if (aboutLink && outroEl) {
    aboutLink.addEventListener('click', (e) => {
      e.preventDefault();

      document.querySelectorAll('.project').forEach((project) => {
        if (project._mediaTrigger) {
          project._mediaTrigger();
          delete project._mediaTrigger;
        }
        project.style.opacity = '1';
        project.style.transform = 'translateY(0)';
      });

      const startY = window.scrollY;
      const startTime = performance.now();
      const duration = 900;

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const target = outroEl.getBoundingClientRect().top + window.scrollY;
        window.scrollTo(0, startY + (target - startY) * eased);

        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }

  // Logo swap: image on intro & outro, text on projects
  const header = document.querySelector('.header');
  const introEl = document.querySelector('.intro');
  const projectsSection = document.querySelector('.projects');
  const outroSection = document.querySelector('.outro');

  function updateLogo() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    const pastIntro = scrollY >= introEl.offsetHeight - 10;
    const atOutro = outroSection && scrollY >= outroSection.offsetTop - vh / 2;
    header.classList.toggle('header--scrolled', pastIntro && !atOutro);
  }

  window.addEventListener('scroll', updateLogo);
  updateLogo();

  // Tilt effect on project screenshots
  const MAX_TILT = 1.5;

  document.querySelectorAll('.project-screenshot').forEach((el) => {
    el.style.willChange = 'transform';

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateY = (x - 0.5) * MAX_TILT * 2;
      const rotateX = (0.5 - y) * MAX_TILT * 2;
      el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transition = 'transform 0.4s ease';
      el.style.transform = 'perspective(800px) rotateX(0) rotateY(0)';
      setTimeout(() => { el.style.transition = ''; }, 400);
    });
  });
});
