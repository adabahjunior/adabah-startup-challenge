/**
 * antigravity-fx.js
 * Interactive zero-gravity physics for "ADABAH MICHAEL",
 * track tab switcher, FAQ accordion, floating navigation dock,
 * and high-energy micro-interactions inspired by https://antigravity.google
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
          defyBtn.innerHTML = '<span>⚡ Ground Gravity</span>';
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
    const particleCount = 24;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'fixed pointer-events-none rounded-full z-50';
      const size = Math.random() * 6 + 3;
      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.background = Math.random() > 0.5 ? '#dfa04e' : '#ebb364';
      p.style.boxShadow = '0 0 10px #dfa04e';
      p.style.left = `${rect.left + Math.random() * rect.width}px`;
      p.style.top = `${rect.top + rect.height * 0.65 + (Math.random() - 0.5) * 40}px`;
      p.style.opacity = '1';
      p.style.transition = 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)';

      document.body.appendChild(p);

      requestAnimationFrame(() => {
        const liftY = -(120 + Math.random() * 180);
        const driftX = (Math.random() - 0.5) * 140;
        p.style.transform = `translate(${driftX}px, ${liftY}px) scale(0)`;
        p.style.opacity = '0';
      });

      setTimeout(() => {
        if (p.parentNode) p.parentNode.removeChild(p);
      }, 1300);
    }
  }

  // 2. Interactive Sector Track Explorer (Replaces long text walls)
  const trackData = {
    fintech: {
      icon: '💳',
      name: 'FinTech & Digital Payments',
      tag: 'FINANCIAL INCLUSION',
      headline: 'Next-Generation Financial Infrastructure for Emerging Markets',
      desc: 'Digital campus wallets, micro-savings, automated inventory credit scoring, decentralized remittances, and frictionless mobile transactions.',
      ideas: ['Campus Merchant Micro-POS', 'Student Credit Identity Engine', 'Peer-to-Peer Group Savings (Susu 2.0)']
    },
    agritech: {
      icon: '🌾',
      name: 'AgriTech & Food Security',
      tag: 'AGRICULTURE & SUPPLY CHAIN',
      headline: 'Transforming Farm Productivity & Direct Farmer-to-Consumer Logistics',
      desc: 'Drone soil analytics, IoT greenhouse sensors, cold-chain solar storage, predictive harvest pricing, and smart wholesale marketplaces.',
      ideas: ['Solar Cold-Hub Network', 'Crop Disease Vision Scanner', 'Direct Farm-to-Kitchen Wholesale']
    },
    healthtech: {
      icon: '🏥',
      name: 'HealthTech & BioCare',
      tag: 'ACCESSIBLE HEALTHCARE',
      headline: 'Digitizing Diagnostic Access, Pharmacy Deliveries & Maternal Care',
      desc: 'Telehealth triage, digital pharmacy fulfillment, point-of-care diagnostics, and automated emergency ambulance dispatch networks.',
      ideas: ['Campus Drone Medicine Delivery', 'AI Symptom & Triage Assistant', 'Preventative Maternal Alert App']
    },
    deeptech: {
      icon: '🤖',
      name: 'AI, DeepTech & Robotics',
      tag: 'FRONTIER ENGINEERING',
      headline: 'Autonomous Hardware, Edge AI & Applied Machine Learning',
      desc: 'Embedded systems, local-language AI models, robotics for mining/agriculture, and autonomous aerial or ground sensor systems.',
      ideas: ['Akan/Twi Voice AI Agent', 'Smart Mining Safety Drones', 'Automated Lab Sensor Telemetry']
    },
    climatetech: {
      icon: '🌱',
      name: 'ClimateTech & Clean Energy',
      tag: 'SUSTAINABILITY & CIRCULARITY',
      headline: 'Decentralized Clean Energy, Waste Upcycling & Carbon Reduction',
      desc: 'Off-grid solar micro-grids, plastic-to-building-material recycling, clean cooking fuel, and EV charging for two-wheelers.',
      ideas: ['Solar Battery Swapping Station', 'Smart Campus E-Waste Hub', 'Biofuel Briquette Manufacturing']
    },
    edtech: {
      icon: '📚',
      name: 'EdTech & Campus Innovation',
      tag: 'EDUCATION & SKILLS',
      headline: 'Empowering Student Learning, Practical STEM & Career Acceleration',
      desc: 'Interactive university study portals, offline-first digital textbooks, peer tutoring micro-marketplaces, and practical coding labs.',
      ideas: ['University Lecture Companion AI', 'Gamified STEM Lab Simulation', 'Campus Freelance Talent Bureau']
    },
    consumer: {
      icon: '🛍️',
      name: 'Consumer Goods & Retail',
      tag: 'HIGH-VELOCITY PRODUCTS',
      headline: 'Modern Made-in-Ghana Consumer Brands & Social Commerce',
      desc: 'Sustainable packaging, organic cosmetics, local food processing, and hyper-local campus quick-commerce delivery.',
      ideas: ['Artisanal Packaged Snacks', 'Natural Shea Skincare Brand', '15-Minute Campus Essentials Delivery']
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
        card.style.opacity = '0.4';
        card.style.transform = 'translateY(6px)';
        setTimeout(() => {
          if (cardIcon) cardIcon.textContent = data.icon;
          if (cardTag) cardTag.textContent = data.tag;
          if (cardTitle) cardTitle.textContent = data.name;
          if (cardHeadline) cardHeadline.textContent = data.headline;
          if (cardDesc) cardDesc.textContent = data.desc;

          if (cardIdeas) {
            cardIdeas.innerHTML = data.ideas
              .map(
                (idea) =>
                  `<span class="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-[#865237]/15 dark:border-white/10 text-[11px] sm:text-xs font-semibold text-[#1A0F09] dark:text-[#f5d6b4] inline-flex items-center gap-1.5"><span class="text-[#dfa04e]">✦</span> ${idea}</span>`
              )
              .join('');
          }

          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, 150);
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

  // 5. Floating Quick-Jump Dock Active Highlighter
  function initFloatingDock() {
    const dock = document.getElementById('floating-nav-dock');
    if (!dock) return;

    const dockLinks = dock.querySelectorAll('.dock-link');
    const sections = ['about', 'tracks', 'how-it-works', 'prize', 'stories', 'tracker'];

    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 200;

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
    });
  }

  // Initialize all components
  function initAll() {
    initWordmarkPhysics();
    initTrackExplorer();
    initFaqAccordion();
    initPreFooterTyping();
    initFloatingDock();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
