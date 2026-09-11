// app.js - Core UI Interactivity, Tracker & Eligibility Quiz

// Toast Notification Helper styled with Brand Colors
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const isDark = document.documentElement.classList.contains('dark');
  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-xl border text-xs font-semibold shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto flex items-center gap-2.5 ${
    type === 'success'
      ? (isDark ? 'bg-[#2b1910]/95 border-[#dfa04e] text-[#f5d6b4]' : 'bg-white/98 border-[#865237] text-[#1a0f09] shadow-xl')
      : type === 'error'
      ? (isDark ? 'bg-[#2a0e08]/95 border-red-500/50 text-red-300' : 'bg-red-50 border-red-400 text-red-900 shadow-xl')
      : (isDark ? 'bg-[#1e120b]/95 border-[#f5d6b4]/30 text-[#fbf1e6]' : 'bg-white/98 border-[#865237]/30 text-[#1a0f09] shadow-xl')
  }`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ';
  toast.innerHTML = `<span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${isDark ? 'bg-white/10 text-[#dfa04e]' : 'bg-[#865237]/15 text-[#865237]'}">${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Countdown Timer Logic
function initCountdown() {
  // Target date: 2 November 2026 (Official Programme Start)
  const targetDate = new Date('2026-11-02T09:00:00Z');

  function update() {
    const now = new Date().getTime();
    const distance = targetDate - now;

    if (distance < 0) {
      document.getElementById('count-days').innerText = '00';
      document.getElementById('count-hours').innerText = '00';
      document.getElementById('count-mins').innerText = '00';
      document.getElementById('count-secs').innerText = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    if (document.getElementById('count-days')) document.getElementById('count-days').innerText = pad(days);
    if (document.getElementById('count-hours')) document.getElementById('count-hours').innerText = pad(hours);
    if (document.getElementById('count-mins')) document.getElementById('count-mins').innerText = pad(minutes);
    if (document.getElementById('count-secs')) document.getElementById('count-secs').innerText = pad(seconds);
  }

  update();
  setInterval(update, 1000);
}

// FAQ Accordion Behavior
function initFaq() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const toggle = item.querySelector('.faq-toggle');
    const content = item.querySelector('.faq-content');
    const icon = toggle.querySelector('svg');

    toggle.addEventListener('click', () => {
      const isHidden = content.classList.contains('hidden');
      items.forEach(other => {
        other.querySelector('.faq-content').classList.add('hidden');
        other.querySelector('svg').classList.remove('rotate-180');
      });

      if (isHidden) {
        content.classList.remove('hidden');
        icon.classList.add('rotate-180');
      } else {
        content.classList.add('hidden');
        icon.classList.remove('rotate-180');
      }
    });
  });
}

// Eligibility Quiz Evaluation
function initEligibilityQuiz() {
  const form = document.getElementById('eligibility-form');
  const resultCard = document.getElementById('eligibility-result');
  const badge = document.getElementById('eligibility-badge');
  const title = document.getElementById('eligibility-title');
  const text = document.getElementById('eligibility-text');
  const applyBtn = document.getElementById('eligibility-apply-btn');

  const options = document.querySelectorAll('.eligibility-option');
  options.forEach(opt => {
    const input = opt.querySelector('input[type="radio"]');
    if (input.checked) {
      opt.classList.add('border-[#dfa04e]', 'bg-[#865237]/30', 'text-[#f5d6b4]');
    }
    opt.addEventListener('click', () => {
      const name = input.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(sibling => {
        sibling.closest('.eligibility-option').classList.remove('border-[#dfa04e]', 'bg-[#865237]/30', 'text-[#f5d6b4]');
      });
      opt.classList.add('border-[#dfa04e]', 'bg-[#865237]/30', 'text-[#f5d6b4]');
      input.checked = true;
    });
  });

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const stage = form.stage.value;
    const founders = form.founders.value;
    const tech = form.tech.value;
    const commitment = form.commitment.value;

    let score = 50;
    if (stage === 'prototype') score += 20;
    if (stage === 'mvp') score += 30;
    if (stage === 'revenue') score += 35;
    if (stage === 'idea') score += 5;

    if (founders === '2-4') score += 15;
    if (founders === '5+') score += 10;
    if (founders === '1') score += 5;

    if (tech === 'yes') score += 15;
    if (commitment === 'yes') score += 10;

    score = Math.min(score, 98);

    badge.innerText = `${score}%`;

    if (score >= 80) {
      badge.className = 'w-16 h-16 rounded-2xl bg-[#865237]/40 text-[#f5d6b4] font-display font-black text-2xl flex items-center justify-center border border-[#dfa04e]';
      title.innerText = 'High Match: Ready For Cohort 2026!';
      text.innerText = `Your startup scored ${score}%. Your stage, team structure, and commitment strongly align with the Adabah Challenge criteria.`;
      applyBtn.innerText = 'Proceed to Application Form →';
    } else if (score >= 65) {
      badge.className = 'w-16 h-16 rounded-2xl bg-[#2b1910] text-[#dfa04e] font-display font-black text-2xl flex items-center justify-center border border-[#dfa04e]/60';
      title.innerText = 'Strong Contender with Growth Potential';
      text.innerText = `Your startup scored ${score}%. We welcome your submission—ensure your pitch highlights your execution plan.`;
      applyBtn.innerText = 'Apply to Challenge →';
    } else {
      badge.className = 'w-16 h-16 rounded-2xl bg-[#2b1910] text-[#f5d6b4] font-display font-black text-2xl flex items-center justify-center border border-[#f5d6b4]/30';
      title.innerText = 'Early-Stage / Additional Prep Advised';
      text.innerText = `Your startup scored ${score}%. Consider strengthening your prototype. You are still fully eligible to submit!`;
      applyBtn.innerText = 'Submit Application Anyway →';
    }

    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      window.openApplicationModal();
    });
  }
}

// Application Status Tracker
function initStatusTracker() {
  const form = document.getElementById('tracker-form');
  const input = document.getElementById('tracker-input');
  const resultDiv = document.getElementById('tracker-result');
  const errorDiv = document.getElementById('tracker-error');

  document.querySelectorAll('.sample-id-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      input.value = id;
      lookupStatus(id);
    });
  });

  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    lookupStatus(query);
  });

  async function lookupStatus(query) {
    resultDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');

    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        errorDiv.innerText = data.message || 'Application not found. Please verify your ID or registered email.';
        errorDiv.classList.remove('hidden');
        return;
      }

      const app = data.data;
      renderTrackerResult(app);
      resultDiv.classList.remove('hidden');
      resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      errorDiv.innerText = 'Failed to connect to server. Please check your network connection.';
      errorDiv.classList.remove('hidden');
    }
  }

  function renderTrackerResult(app) {
    const dateFormatted = new Date(app.submittedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const stages = [
      { key: 'submitted', label: '1. Submitted' },
      { key: 'under_review', label: '2. Technical Review' },
      { key: 'shortlisted', label: '3. Top 50 Semifinals' },
      { key: 'finalist', label: '4. Top 15 Finalist' },
      { key: 'accepted', label: '5. Demo Day Winner' }
    ];

    const currentOrder = ['submitted', 'under_review', 'shortlisted', 'finalist', 'accepted'].indexOf(app.status);

    let progressHtml = `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs text-[#f5d6b4]/70 font-semibold">
          <span>Application Progress</span>
          <span class="text-[#dfa04e] capitalize font-bold">${app.status.replace('_', ' ')}</span>
        </div>
        <div class="grid grid-cols-5 gap-1.5">
    `;

    stages.forEach((st, idx) => {
      const isPastOrCurrent = currentOrder >= idx;
      const isCurrent = currentOrder === idx;
      progressHtml += `
        <div class="p-2 rounded-lg text-center text-[10px] font-bold ${
          isCurrent
            ? 'btn-adabah-primary text-[#120904] ring-2 ring-[#dfa04e]'
            : isPastOrCurrent
            ? 'bg-[#865237]/40 text-[#f5d6b4] border border-[#dfa04e]/50'
            : 'bg-black/30 text-stone-500 border border-white/5'
        }">
          ${st.label}
        </div>
      `;
    });
    progressHtml += `</div></div>`;

    resultDiv.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f5d6b4]/15 pb-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="font-mono text-sm font-bold text-[#120904] bg-[#f5d6b4] px-2.5 py-0.5 rounded-md border border-[#dfa04e]">${app.id}</span>
            <span class="status-badge status-${app.status}">${app.status.replace('_', ' ')}</span>
          </div>
          <h3 class="font-display font-extrabold text-2xl text-white">${app.startupName}</h3>
          <p class="text-xs text-[#f5d6b4]/70 mt-0.5">${app.tagline || 'Innovative venture'}</p>
        </div>
        <div class="text-left sm:text-right">
          <div class="text-[11px] text-[#f5d6b4]/50 uppercase font-semibold">Submitted On</div>
          <div class="text-xs text-[#f5d6b4] font-medium">${dateFormatted}</div>
          ${app.score ? `<div class="mt-1 inline-block px-2.5 py-0.5 rounded bg-[#865237]/50 text-[#f5d6b4] font-bold text-xs border border-[#dfa04e]/40">Jury Score: ${app.score}/100</div>` : ''}
        </div>
      </div>

      ${progressHtml}

      <div class="p-4 rounded-xl bg-black/40 border border-[#f5d6b4]/15 space-y-1.5">
        <div class="text-[11px] font-bold uppercase tracking-wider text-[#dfa04e]">Jury Committee Note:</div>
        <div class="text-xs text-[#f5d6b4]">${app.statusNotes || 'Your application is progressing normally through the evaluation pipeline.'}</div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span class="text-[#f5d6b4]/60 block">Assigned Track</span>
          <span class="font-bold text-white capitalize">${app.track}</span>
        </div>
        <div>
          <span class="text-[#f5d6b4]/60 block">Stage</span>
          <span class="font-bold text-white uppercase">${app.stage}</span>
        </div>
        <div>
          <span class="text-[#f5d6b4]/60 block">Location</span>
          <span class="font-bold text-white">${app.city ? `${app.city}, ` : ''}${app.country}</span>
        </div>
        <div>
          <span class="text-[#f5d6b4]/60 block">Lead Founder</span>
          <span class="font-bold text-white">${app.founderName}</span>
        </div>
      </div>

      ${app.deckUrl ? `
        <div class="pt-2 flex items-center justify-between">
          <a href="${app.deckUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-[#dfa04e] hover:underline font-bold">
            <span>View Submitted Pitch Materials</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>
      ` : ''}
    `;
  }
}

// Contact Form Handler
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const payload = {
      name: document.getElementById('contact-name').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      inquiryType: document.getElementById('contact-type').value,
      message: document.getElementById('contact-message').value.trim()
    };

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Message sent! Our committee will review your inquiry.', 'success');
        form.reset();
      } else {
        showToast(data.message || 'Failed to send message', 'error');
      }
    } catch (err) {
      showToast('Network error while sending message', 'error');
    }
  });
}

// Newsletter Form Handler
function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value.trim();
    if (!email) return;

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Subscribed! You will receive Adabah Challenge updates.', 'success');
        form.reset();
      } else {
        showToast(data.message || 'Failed to subscribe', 'error');
      }
    } catch (err) {
      showToast('Network error while subscribing', 'error');
    }
  });
}

// Mobile Menu
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  });
}

// Partner Modal Behavior
function initPartnerModal() {
  const openBtn = document.getElementById('open-partner-modal-btn');
  const closeBtn = document.getElementById('close-partner-modal-btn');
  const modal = document.getElementById('partner-modal');
  const form = document.getElementById('partner-form');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('partner-name').value.trim(),
        email: document.getElementById('partner-email').value.trim(),
        inquiryType: document.getElementById('partner-type').value,
        message: document.getElementById('partner-message').value.trim()
      };

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Thank you for partnering! Our team will get in touch.', 'success');
          form.reset();
          if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
          }
        } else {
          showToast(data.message || 'Error submitting partner inquiry', 'error');
        }
      } catch (err) {
        showToast('Network error while sending partner inquiry', 'error');
      }
    });
  }
}

// Theme Management: Default Light Theme with Dark Mode Toggle
function applyTheme(theme) {
  const isDark = theme === 'dark';
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Update all theme toggle buttons across the page
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach(btn => {
    btn.setAttribute('title', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    btn.setAttribute('aria-label', isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme');
    btn.innerHTML = isDark
      ? `<svg class="w-4 h-4 text-[#ebb364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span class="text-xs font-semibold text-[#f5d6b4] hidden sm:inline">Light</span>`
      : `<svg class="w-4 h-4 text-[#865237]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg><span class="text-xs font-semibold text-[#5c3d2e] hidden sm:inline">Dark</span>`;
  });
}

function initTheme() {
  // Default to light theme if no preference is stored
  const savedTheme = localStorage.getItem('adabah_theme') || 'light';
  applyTheme(savedTheme);

  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem('adabah_theme', next);
      showToast(`Switched to ${next === 'dark' ? 'Dark' : 'Light'} theme`, 'info');
    });
  });
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCountdown();
  initFaq();
  initEligibilityQuiz();
  initStatusTracker();
  initContactForm();
  initNewsletterForm();
  initMobileMenu();
  initPartnerModal();
});


