/**
 * antigravity-fx.js
 * Interactive zero-gravity physics, letter floating, and UI micro-interactions
 * inspired by https://antigravity.google
 */

(function () {
  'use strict';

  function initAntigravityFooter() {
    const wrapper = document.getElementById('antigravity-footer-wrapper');
    if (!wrapper) return;

    const letters = wrapper.querySelectorAll('.footer-antigravity path');
    const defyBtn = document.getElementById('defy-gravity-btn');

    // 1. Intersection Observer for Scroll-Driven Zero-Gravity Liftoff
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              wrapper.classList.add('defying-gravity');
            } else {
              // Only remove if not explicitly locked by user click
              if (!wrapper.dataset.locked) {
                wrapper.classList.remove('defying-gravity');
              }
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(wrapper);
    } else {
      wrapper.classList.add('defying-gravity');
    }

    // 2. Individual Letter Physics on Hover
    letters.forEach((letter, index) => {
      letter.style.transition = `transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${index * 15}ms, fill 0.25s ease, filter 0.3s ease`;

      letter.addEventListener('mouseenter', () => {
        const floatDistance = -30 - Math.random() * 25;
        const rotateAngle = (Math.random() - 0.5) * 6;
        letter.style.transform = `translateY(${floatDistance}px) rotate(${rotateAngle}deg) scale(1.05)`;
      });

      letter.addEventListener('mouseleave', () => {
        letter.style.transform = '';
      });
    });

    // 3. Interactive "Defy Gravity" Trigger Button
    if (defyBtn) {
      let isZeroG = false;
      defyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isZeroG = !isZeroG;
        wrapper.dataset.locked = isZeroG ? 'true' : '';

        if (isZeroG) {
          wrapper.classList.add('defying-gravity');
          defyBtn.innerHTML = '<span>⚡ Normal Gravity</span>';
          defyBtn.classList.add('ring-2', 'ring-[#dfa04e]');

          createZeroGravityParticles(wrapper);

          if (window.showToast) {
            window.showToast('Zero-Gravity Mode Engaged! Liftoff activated.', 'success');
          }
        } else {
          wrapper.classList.remove('defying-gravity');
          defyBtn.innerHTML = '<span>✦ Defy Gravity</span>';
          defyBtn.classList.remove('ring-2', 'ring-[#dfa04e]');
        }
      });
    }
  }

  // Visual Particle Dust on Liftoff
  function createZeroGravityParticles(container) {
    const rect = container.getBoundingClientRect();
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'fixed pointer-events-none rounded-full z-50';
      const size = Math.random() * 6 + 3;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = Math.random() > 0.5 ? '#dfa04e' : '#ebb364';
      p.style.boxShadow = '0 0 10px #dfa04e';
      p.style.left = `${rect.left + Math.random() * rect.width}px`;
      p.style.top = `${rect.top + rect.height * 0.7 + (Math.random() - 0.5) * 40}px`;
      p.style.opacity = '1';
      p.style.transition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';

      document.body.appendChild(p);

      requestAnimationFrame(() => {
        const liftY = -(100 + Math.random() * 160);
        const driftX = (Math.random() - 0.5) * 120;
        p.style.transform = `translate(${driftX}px, ${liftY}px) scale(0)`;
        p.style.opacity = '0';
      });

      setTimeout(() => {
        if (p.parentNode) p.parentNode.removeChild(p);
      }, 1300);
    }
  }

  // Pre-Footer Interactive Typing Tagline
  function initPreFooterTyping() {
    const target = document.getElementById('antigravity-typed-tagline');
    if (!target) return;

    const phrases = [
      'Experience liftoff with The ADABAH Startup Challenge 2026',
      'From campus dorms to scalable enterprise ventures',
      'GH₵3,000 equity-free seed prize + elite venture mentorship',
      'Your idea deserves a stage. Build what comes next.'
    ];

    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 50;

    function type() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        target.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 25;
      } else {
        target.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 55;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typingSpeed = 2200;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingSpeed = 400;
      }

      setTimeout(type, typingSpeed);
    }

    setTimeout(type, 800);
  }

  // DOM ready initializer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAntigravityFooter();
      initPreFooterTyping();
    });
  } else {
    initAntigravityFooter();
    initPreFooterTyping();
  }
})();
