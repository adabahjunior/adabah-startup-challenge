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
      opt.classList.add('border-[#865237]', 'bg-[#F4EDE4]', 'text-[#1A0F09]', 'font-bold', 'dark:border-[#dfa04e]', 'dark:bg-[#865237]/40', 'dark:text-[#f5d6b4]');
    }
    opt.addEventListener('click', () => {
      const name = input.name;
      document.querySelectorAll(`input[name="${name}"]`).forEach(sibling => {
        sibling.closest('.eligibility-option').classList.remove('border-[#865237]', 'bg-[#F4EDE4]', 'text-[#1A0F09]', 'font-bold', 'dark:border-[#dfa04e]', 'dark:bg-[#865237]/40', 'dark:text-[#f5d6b4]', 'border-[#dfa04e]', 'bg-[#865237]/30', 'text-[#f5d6b4]');
      });
      opt.classList.add('border-[#865237]', 'bg-[#F4EDE4]', 'text-[#1A0F09]', 'font-bold', 'dark:border-[#dfa04e]', 'dark:bg-[#865237]/40', 'dark:text-[#f5d6b4]');
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
      badge.className = 'w-16 h-16 rounded-2xl bg-[#F4EDE4] dark:bg-[#865237]/40 text-[#6B3410] dark:text-[#f5d6b4] font-display font-black text-2xl flex items-center justify-center border-2 border-[#865237] dark:border-[#dfa04e] shadow-sm';
      title.innerText = 'High Match: Ready For Cohort 2026!';
      text.innerText = `Your startup scored ${score}%. Your stage, team structure, and commitment strongly align with the Adabah Challenge criteria.`;
      applyBtn.innerText = 'Proceed to Application Form →';
    } else if (score >= 65) {
      badge.className = 'w-16 h-16 rounded-2xl bg-[#F4EDE4] dark:bg-[#2b1910] text-[#8F4C15] dark:text-[#dfa04e] font-display font-black text-2xl flex items-center justify-center border-2 border-[#8F4C15] dark:border-[#dfa04e]/60 shadow-sm';
      title.innerText = 'Strong Contender with Growth Potential';
      text.innerText = `Your startup scored ${score}%. We welcome your submission—ensure your pitch highlights your execution plan.`;
      applyBtn.innerText = 'Apply to Challenge →';
    } else {
      badge.className = 'w-16 h-16 rounded-2xl bg-[#F4EDE4] dark:bg-[#2b1910] text-[#5C3D2E] dark:text-[#f5d6b4] font-display font-black text-2xl flex items-center justify-center border border-[#865237]/40 dark:border-[#f5d6b4]/30 shadow-sm';
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

// HTML Escape Helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Application Status Tracker
function initStatusTracker() {
  const form = document.getElementById('tracker-form');
  const input = document.getElementById('tracker-input');
  const resultDiv = document.getElementById('tracker-result');
  const errorDiv = document.getElementById('tracker-error');


  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) return;
      lookupApplication(query);
    });
  }

  async function lookupApplication(query) {
    errorDiv.classList.add('hidden');
    resultDiv.classList.add('hidden');

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
      { key: 'under_review', label: '2. Review' },
      { key: 'shortlisted', label: '3. Top 50' },
      { key: 'finalist', label: '4. Finalist' },
      { key: 'accepted', label: '5. Winner' }
    ];

    const currentOrder = ['submitted', 'under_review', 'shortlisted', 'finalist', 'accepted'].indexOf(app.status);

    let progressHtml = `
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs text-[#4A2E1F] dark:text-[#f5d6b4]/70 font-bold">
          <span>Application Progress</span>
          <span class="text-[#8F4C15] dark:text-[#dfa04e] capitalize font-black">${app.status.replace('_', ' ')}</span>
        </div>
        <div class="grid grid-cols-5 gap-1 sm:gap-1.5">
    `;

    stages.forEach((st, idx) => {
      const isPastOrCurrent = currentOrder >= idx;
      const isCurrent = currentOrder === idx;
      progressHtml += `
        <div class="p-1.5 sm:p-2 rounded-lg text-center text-[10px] font-bold ${
          isCurrent
            ? 'btn-adabah-primary text-white ring-2 ring-[#865237] dark:ring-[#dfa04e]'
            : isPastOrCurrent
            ? 'bg-[#F4EDE4] dark:bg-[#865237]/40 text-[#6B3410] dark:text-[#f5d6b4] border border-[#865237]/40 dark:border-[#dfa04e]/50'
            : 'bg-[#F4EDE4]/60 dark:bg-black/30 text-[#5C3D2E] dark:text-[#f5d6b4]/50 border border-[#865237]/20 dark:border-white/10 font-semibold'
        }">
          ${st.label}
        </div>
      `;
    });
    progressHtml += `</div></div>`;

    resultDiv.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#865237]/20 dark:border-[#f5d6b4]/15 pb-4">
        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="font-mono text-sm font-black text-white bg-[#865237] px-2.5 py-0.5 rounded-md border border-[#865237] shadow-sm">${app.id}</span>
            <span class="status-badge status-${app.status}">${app.status.replace('_', ' ')}</span>
          </div>
          <h3 class="font-display font-black text-xl sm:text-2xl text-[#1A0F09] dark:text-white">${escapeHtml(app.startupName)}</h3>
          <p class="text-xs text-[#4A2E1F] dark:text-[#f5d6b4]/70 mt-0.5">${escapeHtml(app.tagline || 'Innovative venture')}</p>
        </div>
        <div class="text-left sm:text-right">
          <div class="text-[11px] text-[#5C3D2E] dark:text-[#f5d6b4]/70 uppercase font-bold">Submitted On</div>
          <div class="text-xs text-[#1A0F09] dark:text-[#f5d6b4] font-bold font-mono">${dateFormatted}</div>
          ${app.score ? `<div class="mt-1 inline-block px-2.5 py-0.5 rounded bg-[#F4EDE4] dark:bg-[#865237]/50 text-[#6B3410] dark:text-[#f5d6b4] font-black text-xs border border-[#865237]/30 dark:border-[#dfa04e]/40">Jury Score: ${app.score}/100</div>` : ''}
        </div>
      </div>

      ${progressHtml}

      <div class="p-4 rounded-xl bg-white dark:bg-black/40 border border-[#865237]/20 dark:border-[#f5d6b4]/15 space-y-1.5 shadow-sm">
        <div class="text-[11px] font-bold uppercase tracking-wider text-[#8F4C15] dark:text-[#dfa04e]">Jury Committee Note:</div>
        <div class="text-xs text-[#2E180D] dark:text-[#f5d6b4] leading-relaxed font-medium">${escapeHtml(app.statusNotes || 'Your application is progressing normally through the evaluation pipeline.')}</div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
        <div class="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-[#865237]/15 dark:border-[#f5d6b4]/10">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Assigned Track</span>
          <span class="font-bold text-[#1A0F09] dark:text-white capitalize">${escapeHtml(app.track)}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-[#865237]/15 dark:border-[#f5d6b4]/10">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Stage</span>
          <span class="font-bold text-[#1A0F09] dark:text-white uppercase">${escapeHtml(app.stage)}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-[#865237]/15 dark:border-[#f5d6b4]/10">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Location</span>
          <span class="font-bold text-[#1A0F09] dark:text-white truncate block">${escapeHtml(app.city ? `${app.city}, ` : '')}${escapeHtml(app.country)}</span>
        </div>
        <div class="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-[#865237]/15 dark:border-[#f5d6b4]/10">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Lead Founder</span>
          <span class="font-bold text-[#1A0F09] dark:text-white truncate block">${escapeHtml(app.founderName)}</span>
        </div>
      </div>

      <div class="pt-3 border-t border-[#865237]/15 dark:border-[#f5d6b4]/10 flex flex-wrap items-center justify-between gap-2.5">
        ${app.deckUrl ? `
          <a href="${escapeHtml(app.deckUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-[#8F4C15] dark:text-[#dfa04e] hover:underline font-bold">
            <span>View Pitch Deck</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        ` : '<div></div>'}
        <a href="/dashboard?id=${encodeURIComponent(app.id)}" class="px-4 py-2 rounded-xl btn-adabah-primary text-xs font-bold inline-flex items-center gap-1.5 shadow-sm">
          <span>Open Founder Dashboard</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </a>
      </div>
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
    if (btn.classList.contains('rounded-full')) {
      btn.innerHTML = isDark
        ? `<svg class="w-4 h-4 text-[#ebb364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`
        : `<svg class="w-4 h-4 text-[#865237]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;
    } else {
      btn.innerHTML = isDark
        ? `<svg class="w-4 h-4 text-[#ebb364]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg><span class="text-xs font-semibold text-[#f5d6b4] hidden sm:inline">Light</span>`
        : `<svg class="w-4 h-4 text-[#865237]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg><span class="text-xs font-semibold text-[#5c3d2e] hidden sm:inline">Dark</span>`;
    }
  });
}

function initTheme() {
  // Default to dark theme if no preference is stored
  const savedTheme = localStorage.getItem('adabah_theme') || 'dark';
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

// Public Blog Stories Logic
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderArticleMarkdown(text) {
  if (!text) return '';
  const blocks = text.split(/\n\n+/);
  return blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('### ')) {
      return `<h4 class="font-display font-bold text-base sm:text-lg text-[#1A0F09] dark:text-white mt-4 mb-1">${escapeHtml(block.slice(4))}</h4>`;
    }
    if (block.startsWith('## ')) {
      return `<h3 class="font-display font-bold text-lg sm:text-xl text-[#1A0F09] dark:text-white mt-5 mb-2">${escapeHtml(block.slice(3))}</h3>`;
    }
    if (block.startsWith('# ')) {
      return `<h2 class="font-display font-black text-xl sm:text-2xl text-[#1A0F09] dark:text-white mt-6 mb-2">${escapeHtml(block.slice(2))}</h2>`;
    }
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').map(li => {
        const clean = li.replace(/^[-*]\s+/, '');
        return `<li class="ml-4 list-disc">${formatInline(clean)}</li>`;
      }).join('');
      return `<ul class="space-y-1.5 my-2.5 text-[#5C3D2E] dark:text-[#f5d6b4]/85">${items}</ul>`;
    }
    return `<p class="mb-3 leading-relaxed text-[#5C3D2E] dark:text-[#f5d6b4]/90">${formatInline(block)}</p>`;
  }).join('');
}

function formatInline(str) {
  let clean = escapeHtml(str);
  clean = clean.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#1A0F09] dark:text-white">$1</strong>');
  clean = clean.replace(/\*(.*?)\*/g, '<em>$1</em>');
  clean = clean.replace(/\[(.*?)\]\((https?:\/\/[^\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#865237] dark:text-[#dfa04e] underline font-semibold">$1</a>');
  return clean;
}

let publicBlogsCache = [];

function openBlogReader(blogId) {
  const blog = publicBlogsCache.find(b => b.id === blogId);
  if (!blog) return;

  const modal = document.getElementById('blog-reader-modal');
  if (!modal) return;

  const tagEl = document.getElementById('reader-blog-tag');
  const authorEl = document.getElementById('reader-blog-author');
  const dateEl = document.getElementById('reader-blog-date');
  const readtimeEl = document.getElementById('reader-blog-readtime');
  const titleEl = document.getElementById('reader-blog-title');
  const coverContainer = document.getElementById('reader-cover-container');
  const coverEl = document.getElementById('reader-blog-cover');
  const contentEl = document.getElementById('reader-blog-content');

  if (tagEl) tagEl.textContent = (blog.tags && blog.tags[0]) ? blog.tags[0].toUpperCase() : 'ANNOUNCEMENT';
  if (authorEl) authorEl.textContent = blog.author || 'Adabah Team';
  if (dateEl) dateEl.textContent = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '2026';
  if (readtimeEl) readtimeEl.textContent = blog.readTime || '4 min read';
  if (titleEl) titleEl.textContent = blog.title;

  if (coverContainer && coverEl) {
    if (blog.coverImage) {
      coverEl.src = blog.coverImage;
      coverContainer.classList.remove('hidden');
    } else {
      coverContainer.classList.add('hidden');
    }
  }

  if (contentEl) {
    contentEl.innerHTML = renderArticleMarkdown(blog.content || blog.excerpt || '');
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeBlogReader() {
  const modal = document.getElementById('blog-reader-modal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
}

window.openBlogReader = openBlogReader;
window.closeBlogReader = closeBlogReader;

async function initPublicBlogs() {
  const grid = document.getElementById('public-blogs-grid');
  if (!grid) return;

  const closeBtn = document.getElementById('close-reader-modal-btn');
  const modal = document.getElementById('blog-reader-modal');
  if (closeBtn) closeBtn.addEventListener('click', closeBlogReader);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeBlogReader();
    });
  }

  try {
    const res = await fetch('/api/blogs');
    const data = await res.json();
    const blogList = (data && (data.blogs || data.data)) || [];
    if (!res.ok || !data.success || blogList.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-10 rounded-2xl bg-white dark:bg-[#24140b] border border-[#865237]/15 dark:border-[#f5d6b4]/15">
          <p class="text-xs text-[#5C3D2E] dark:text-[#f5d6b4]/70">No articles published yet. Check back soon for challenge updates!</p>
        </div>
      `;
      return;
    }

    publicBlogsCache = blogList;

    grid.innerHTML = blogList.map(blog => {
      const dateStr = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '2026';
      const mainTag = (blog.tags && blog.tags[0]) ? blog.tags[0] : 'Insight';
      const coverHtml = blog.coverImage
        ? `<div class="w-full h-44 overflow-hidden bg-[#865237]/10"><img src="${escapeHtml(blog.coverImage)}" alt="${escapeHtml(blog.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy"></div>`
        : `<div class="w-full h-44 bg-gradient-to-tr from-[#865237] via-[#a46543] to-[#dfa04e] flex items-center justify-center p-6 text-center text-white"><span class="font-display font-black text-xl text-[#f5d6b4]">${escapeHtml(blog.title.slice(0, 30))}...</span></div>`;

      return `
        <article class="group rounded-3xl bg-white dark:bg-[#24140b] border border-[#865237]/15 dark:border-[#f5d6b4]/15 shadow-sm hover:shadow-xl hover:border-[#865237]/30 transition-all duration-300 flex flex-col overflow-hidden">
          ${coverHtml}
          <div class="p-5 sm:p-6 flex-1 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-2.5">
                <span class="px-2.5 py-1 rounded-full bg-[#865237]/10 dark:bg-[#dfa04e]/15 text-[#865237] dark:text-[#dfa04e] text-[10px] font-bold uppercase tracking-wider">
                  ${escapeHtml(mainTag)}
                </span>
                <span class="text-[11px] text-[#5C3D2E]/70 dark:text-[#f5d6b4]/60 font-medium">${escapeHtml(blog.readTime || '4 min')}</span>
              </div>
              <h3 class="font-display font-bold text-lg text-[#1A0F09] dark:text-white leading-snug group-hover:text-[#865237] dark:group-hover:text-[#dfa04e] transition-colors line-clamp-2">
                ${escapeHtml(blog.title)}
              </h3>
              <p class="text-xs text-[#5C3D2E] dark:text-[#f5d6b4]/80 mt-2 line-clamp-3 leading-relaxed">
                ${escapeHtml(blog.excerpt || '')}
              </p>
            </div>

            <div class="pt-4 mt-4 border-t border-[#865237]/10 dark:border-[#f5d6b4]/10 flex items-center justify-between">
              <div class="text-[11px] text-[#5C3D2E] dark:text-[#f5d6b4]/70">
                <span class="font-bold text-[#1A0F09] dark:text-white block truncate max-w-[120px]">${escapeHtml(blog.author || 'Adabah')}</span>
                <span>${escapeHtml(dateStr)}</span>
              </div>
              <button type="button" onclick="openBlogReader('${escapeHtml(blog.id)}')" class="px-3.5 py-1.5 rounded-xl btn-adabah-primary font-bold text-xs shadow-sm hover:scale-[1.02] cursor-pointer">
                Read Story →
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('Error fetching blogs:', err);
    grid.innerHTML = `
      <div class="col-span-full text-center py-8 text-xs text-[#5C3D2E] dark:text-[#f5d6b4]/70">
        Unable to load stories at this moment. Please refresh later.
      </div>
    `;
  }
}

// Hero Background Video Streamer
async function initHeroBackgroundVideo() {
  const wrap = document.getElementById('hero-video-wrap');
  const video = document.getElementById('hero-bg-video');
  if (!wrap || !video) return;

  try {
    const res = await fetch('/api/content/hero-video');
    if (!res.ok) return;
    const data = await res.json();
    if (!data || !data.success || !data.videoEnabled || !data.videoUrl) {
      wrap.classList.add('hidden');
      return;
    }

    video.src = data.videoUrl;
    if (data.posterUrl) {
      video.poster = data.posterUrl;
    }
    const targetOpacity = typeof data.videoOpacity === 'number' ? data.videoOpacity : 0.25;

    wrap.classList.remove('hidden');
    video.load();
    video.play().catch(err => {
      console.log('Hero video autoplay deferred by browser:', err);
    });

    // Fade in gracefully
    setTimeout(() => {
      wrap.style.opacity = targetOpacity.toString();
    }, 50);

  } catch (err) {
    console.warn('Hero background video failed to initialize:', err);
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initCountdown();
  initHeroBackgroundVideo();
  initFaq();
  initEligibilityQuiz();
  initStatusTracker();
  initContactForm();
  initNewsletterForm();
  initMobileMenu();
  initPartnerModal();
  initPublicBlogs();
});


