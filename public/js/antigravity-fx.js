/**
 * antigravity-fx.js
 * Interactive zero-gravity physics for "ADABAH MICHAEL",
 * scroll reveal entrance engine, SVG track tab switcher,
 * FAQ accordion, floating navigation dock, and minimal micro-interactions.
 */

(function () {
  'use strict';

  // 1. Colossal "ADABAH MICHAEL" Wordmark Physics
  function initWordmarkPhysics() {
    const wrapper = document.getElementById('antigravity-footer-wrapper');
    if (!wrapper) return;

    const letters = wrapper.querySelectorAll('.gravity-letter');
    const defyBtn = document.getElementById('defy-gravity-btn');

    // Scroll-triggered liftoff
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              wrapper.classList.add('defying-gravity');
            } else if (!wrapper.dataset.locked) {
              wrapper.classList.remove('defying-gravity');
            }
          });
        },
        { threshold: 0.15 }
      );
      observer.observe(wrapper);
    } else {
      wrapper.classList.add('defying-gravity');
    }

    // Individual letter hover physics
    letters.forEach((letter, index) => {
      letter.style.transition = `transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) ${index * 15}ms, fill 0.25s ease, filter 0.3s ease`;

      letter.addEventListener('mouseenter', () => {
        const floatY = -28 - Math.random() * 25;
        const rotateDeg = (Math.random() - 0.5) * 8;
        letter.style.transform = `translateY(${floatY}px) rotate(${rotateDeg}deg) scale(1.08)`;
      });

      letter.addEventListener('mouseleave', () => {
        letter.style.transform = '';
      });
    });

    // "Defy Gravity" Trigger Button
    if (defyBtn) {
      let isZeroG = false;
      defyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isZeroG = !isZeroG;
        wrapper.dataset.locked = isZeroG ? 'true' : '';

        if (isZeroG) {
          wrapper.classList.add('defying-gravity');
          defyBtn.innerHTML = '<span>✦ Ground Gravity</span>';
          defyBtn.classList.add('ring-2', 'ring-[#dfa04e]');
          createZeroGravityParticles(wrapper);

          if (window.showToast) {
            window.showToast('Zero-Gravity Engaged: ADABAH MICHAEL in flight!', 'success');
          }
        } else {
          wrapper.classList.remove('defying-gravity');
          defyBtn.innerHTML = '<span>✦ Defy Gravity</span>';
          defyBtn.classList.remove('ring-2', 'ring-[#dfa04e]');
        }
      });
    }
  }

  // Particle Dust Burst
  function createZeroGravityParticles(container) {
    const rect = container.getBoundingClientRect();
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'fixed pointer-events-none rounded-full z-50';
      const size = Math.random() * 5 + 3;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = Math.random() > 0.5 ? '#dfa04e' : '#ebb364';
      p.style.boxShadow = '0 0 8px #dfa04e';
      p.style.left = `${rect.left + Math.random() * rect.width}px`;
      p.style.top = `${rect.top + rect.height * 0.65 + (Math.random() - 0.5) * 40}px`;
      p.style.opacity = '1';
      p.style.transition = 'all 1.1s cubic-bezier(0.16, 1, 0.3, 1)';

      document.body.appendChild(p);

      requestAnimationFrame(() => {
        const liftY = -(100 + Math.random() * 150);
        const driftX = (Math.random() - 0.5) * 120;
        p.style.transform = `translate(${driftX}px, ${liftY}px) scale(0)`;
        p.style.opacity = '0';
      });

      setTimeout(() => {
        if (p.parentNode) p.parentNode.removeChild(p);
      }, 1200);
    }
  }

  // 2. Minimalist SVG Sector Track Explorer
  const trackData = {
    fintech: {
      icon: '<svg class="w-6 h-6 text-[#865237] dark:text-[#dfa04e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>',
      name: 'FinTech & Payments',
      tag: 'FINANCIAL INFRASTRUCTURE',
      headline: 'Next-Gen Financial Rails for Emerging Markets',
      desc: 'Campus wallets, micro-savings, inventory credit scoring, and frictionless mobile transactions.',
      ideas: ['Merchant Micro-POS', 'Campus Credit Identity', 'Digital Group Savings']
    },
    agritech: {
      icon: '<svg class="w-6 h-6 text-[#865237] dark:text-[#dfa04e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>',
      name: 'AgriTech & Food Security',
      tag: 'SUPPLY CHAIN & FARMS',
      headline: 'Transforming Farm Yields & Direct Market Logistics',
      desc: 'Soil analytics, IoT greenhouse controls, solar cold storage, and direct farm-to-table networks.',
      ideas: ['Solar Cold Storage', 'Crop Disease Scanner', 'Farm-to-Kitchen Wholesale']
    },
    healthtech: {
      icon: '<svg class="w-6 h-6 text-[#865237] dark:text-[#dfa04e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>',
      name: 'HealthTech & BioCare',
      tag: 'ACCESSIBLE HEALTHCARE',
      headline: 'Digitizing Diagnostic Access, Triage & Deliveries',
      desc: 'Telehealth triage, digital pharmacy fulfillment, point-of-care diagnostics, and emergency dispatch.',
      ideas: ['Fast Med Delivery', 'AI Triage Assistant', 'Maternal Alert Monitor']
    },
    deeptech: {
      icon: '<svg class="w-6 h-6 text-[#865237] dark:text-[#dfa04e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/></svg>',
      name: 'AI, DeepTech & Hardware',
      tag: 'FRONTIER ENGINEERING',
      headline: 'Autonomous Hardware, Edge AI & Applied Computing',
      desc: 'Embedded IoT telemetry, local-language AI models, and autonomous mining/safety inspection drones.',
      ideas: ['Local Voice AI', 'Mining Safety Sensors', 'Autonomous Campus Robotics']
    },
    climatetech: {
      icon: '<svg class="w-6 h-6 text-[#865237] dark:text-[#dfa04e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>',
      name: 'ClimateTech & Energy',
      tag: 'SUSTAINABILITY',
      headline: 'Decentralized Clean Energy, Recycling & Carbon Reduction',
      desc: 'Off-grid solar micro-grids, plastic upcycling, clean cooking fuel, and EV two-wheeler swapping.',
      ideas: ['Solar Battery Swapping', 'Smart E-Waste Hub', 'Biofuel Briquette Tech']
    },
    edtech: {
      icon: '<svg class="w-6 h-6 text-[#865237] dark:text-[#dfa04e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5"/></svg>',
      name: 'EdTech & Skills',
      tag: 'EDUCATION & WORK',
      headline: 'Empowering Student Learning & Practical STEM Mastery',
      desc: 'Interactive university study portals, offline digital labs, peer tutoring, and skill marketplaces.',
      ideas: ['Lecture Companion AI', 'Gamified Lab Simulation', 'Campus Talent Bureau']
    },
    consumer: {
      icon: '<svg class="w-6 h-6 text-[#865237] dark:text-[#dfa04e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>',
      name: 'Consumer Goods & Retail',
      tag: 'HIGH-VELOCITY PRODUCTS',
      headline: 'Modern Ghanaian Consumer Brands & Quick Commerce',
      desc: 'Sustainable packaging, organic cosmetics, local food processing, and hyper-local delivery.',
      ideas: ['Packaged Agro-Snacks', 'Organic Shea Skincare', 'Hyper-Local Delivery']
    }
  };

  function initTrackExplorer() {
    const tabContainer = document.getElementById('track-tabs-container');
    const cardIcon = document.getElementById('track-spotlight-icon');
    const cardTag = document.getElementById('track-spotlight-tag');
    const cardTitle = document.getElementById('track-spotlight-title');
    const cardHeadline = document.getElementById('track-spotlight-headline');
    const cardDesc = document.getElementById('track-spotlight-desc');
    const cardIdeas = document.getElementById('track-spotlight-ideas');

    if (!tabContainer || !cardTitle) return;

    const tabs = tabContainer.querySelectorAll('.track-pill-tab');

    function selectTrack(trackKey) {
      const data = trackData[trackKey];
      if (!data) return;

      tabs.forEach((t) => {
        if (t.dataset.track === trackKey) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      });

      // Smooth card transition
      const card = document.getElementById('track-spotlight-card');
      if (card) {
        card.style.opacity = '0.35';
        card.style.transform = 'translateY(6px)';
        setTimeout(() => {
          if (cardIcon) cardIcon.innerHTML = data.icon;
          if (cardTag) cardTag.textContent = data.tag;
          if (cardTitle) cardTitle.textContent = data.name;
          if (cardHeadline) cardHeadline.textContent = data.headline;
          if (cardDesc) cardDesc.textContent = data.desc;

          if (cardIdeas) {
            cardIdeas.innerHTML = data.ideas
              .map(
                (idea) =>
                  `<span class="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-[#865237]/15 dark:border-white/10 text-[11px] sm:text-xs font-semibold text-[#1A0F09] dark:text-[#f5d6b4] inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-[#dfa04e]"></span> ${idea}</span>`
              )
              .join('');
          }

          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 140);
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        selectTrack(tab.dataset.track);
      });
    });

    // Default select first track
    selectTrack('fintech');
  }

  // 3. Interactive Collapsible FAQ Accordion
  function initFaqAccordion() {
    const faqContainer = document.getElementById('faq-accordion');
    if (!faqContainer) return;

    const items = faqContainer.querySelectorAll('.faq-item');
    items.forEach((item) => {
      const btn = item.querySelector('.faq-toggle');
      const content = item.querySelector('.faq-content');
      const icon = item.querySelector('.faq-chevron');

      if (!btn || !content) return;

      btn.addEventListener('click', () => {
        const isOpen = !content.classList.contains('hidden');

        // Close all other items for a clean accordion experience
        items.forEach((other) => {
          const otherContent = other.querySelector('.faq-content');
          const otherIcon = other.querySelector('.faq-chevron');
          if (otherContent && other !== item) {
            otherContent.classList.add('hidden');
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
          }
        });

        if (isOpen) {
          content.classList.add('hidden');
          if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
          content.classList.remove('hidden');
          if (icon) icon.style.transform = 'rotate(180deg)';
        }
      });
    });
  }

  // 4. Pre-Footer Typing Effect
  function initPreFooterTyping() {
    const target = document.getElementById('antigravity-typed-tagline');
    if (!target) return;

    const phrases = [
      'Experience liftoff with The ADABAH Startup Challenge 2026',
      'From campus ideas to scalable enterprises',
      'GH₵3,000 equity-free seed prize + venture mentorship',
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

  // 5. Floating Quick-Jump Dock Active Highlighter
  function initFloatingDock() {
    const dock = document.getElementById('floating-nav-dock');
    if (!dock) return;

    const dockLinks = dock.querySelectorAll('.dock-link');
    const sections = ['about', 'tracks', 'how-it-works', 'prize', 'stories', 'tracker'];

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 220;

      sections.forEach((secId) => {
        const sec = document.getElementById(secId);
        if (sec) {
          const top = sec.offsetTop;
          const height = sec.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            dockLinks.forEach((link) => {
              if (link.getAttribute('href') === `#${secId}`) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        }
      });
    }, { passive: true });
  }

  // 6. Scroll Reveal Animation Engine (IntersectionObserver)
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.fade-up, .scroll-reveal');
    if (!revealElements.length) return;

    if (!('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('revealed'));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));
  }

  // Initialize all components
  function initAll() {
    initWordmarkPhysics();
    initTrackExplorer();
    initFaqAccordion();
    initPreFooterTyping();
    initFloatingDock();
    initScrollReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
