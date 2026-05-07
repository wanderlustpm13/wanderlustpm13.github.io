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

  const parallaxEnd = () => '+=' + window.innerHeight * 3;

  gsap.to('.parallax-column--left', {
    yPercent: -15,
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

  window.addEventListener('load', () => ScrollTrigger.refresh());
  window.addEventListener('resize', () => ScrollTrigger.refresh());
}

function initLightbox() {
  const cards = document.querySelectorAll('.parallax-card');
  if (!cards.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  const lightboxImg = document.createElement('img');
  lightboxImg.className = 'lightbox-img';
  lightbox.appendChild(lightboxImg);
  document.body.appendChild(lightbox);

  function open(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('is-open');
  }

  function close() {
    lightbox.classList.remove('is-open');
  }

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      if (!img) return;
      open(img.src, img.alt);
    });
  });

  lightbox.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
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
  initLightbox();

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

  // Paging scroll: intro ↔ projects ↔ outro
  const intro = introEl;
  let scrolling = false;

  function snapTo(target) {
    scrolling = true;
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    setTimeout(() => { scrolling = false; }, 800);
  }

  window.addEventListener('wheel', (e) => {
    if (scrolling) {
      e.preventDefault();
      return;
    }

    const scrollTop = window.scrollY;
    const projectsBottom = projectsSection.offsetTop + projectsSection.offsetHeight;
    const vh = window.innerHeight;

    // Past the bottom of projects: scroll down snaps to outro (with overscroll buffer)
    if (outroSection && (scrollTop + vh) - projectsBottom >= 200 && scrollTop < outroSection.offsetTop - 20 && e.deltaY > 0) {
      e.preventDefault();
      snapTo(outroSection);
      return;
    }

    // At top of outro, scrolling up returns to end of projects
    if (outroSection && Math.abs(scrollTop - outroSection.offsetTop) < 10 && e.deltaY < 0) {
      e.preventDefault();
      snapTo(outroSection.offsetTop - vh);
      return;
    }
  }, { passive: false });

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
