// public/js/partners.js - Partners & Sponsors Page Controller
// The ADABAH Startup Challenge 2026

document.addEventListener('DOMContentLoaded', () => {
  let allPartners = [];
  let currentFilter = 'all';

  // Theme Toggles
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('adabah_theme', isDark ? 'dark' : 'light');
      } catch (e) {}
    });
  });

  // Mobile Menu
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Toast Notification
  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white';
    toast.className = `pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold transform transition-all duration-300 translate-y-2 opacity-0 ${bgClass}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : '⚠'}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Modal Controls
  const inquiryModal = document.getElementById('partner-inquiry-modal');
  const openHeroBtn = document.getElementById('hero-partner-btn');
  const openModalBtn = document.getElementById('open-inquiry-modal-btn');
  const openCalloutBtn = document.getElementById('callout-open-inquiry-btn');
  const openMobileBtn = document.getElementById('mobile-open-partner-btn');
  const closeModalBtn = document.getElementById('close-inquiry-modal-btn');
  const cancelBtn = document.getElementById('cancel-inquiry-btn');
  const inquiryForm = document.getElementById('public-partner-inquiry-form');

  function openModal() {
    if (!inquiryModal) return;
    inquiryModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!inquiryModal) return;
    inquiryModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (openHeroBtn) openHeroBtn.addEventListener('click', openModal);
  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (openCalloutBtn) openCalloutBtn.addEventListener('click', openModal);
  if (openMobileBtn) openMobileBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  // Close modal when clicking on backdrop
  if (inquiryModal) {
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) closeModal();
    });
  }

  // Handle Form Submission
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const orgName = document.getElementById('inquiry-org-name').value.trim();
      const contactName = document.getElementById('inquiry-contact-name').value.trim();
      const email = document.getElementById('inquiry-email').value.trim();
      const type = document.getElementById('inquiry-type').value;
      const message = document.getElementById('inquiry-message').value.trim();
      const submitBtn = document.getElementById('submit-inquiry-btn');
      const submitText = document.getElementById('submit-inquiry-text');

      if (!orgName || !email || !message) {
        showToast('Please fill in all required fields.', 'error');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (submitText) submitText.textContent = 'Submitting...';

      try {
        const payload = {
          name: `${orgName} (${contactName})`,
          email: email,
          type: type,
          message: message
        };

        const res = await fetch('/api/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Thank you! Your partnership inquiry has been received.', 'success');
          inquiryForm.reset();
          closeModal();
        } else {
          showToast(data.message || 'Error submitting inquiry. Please try again.', 'error');
        }
      } catch (err) {
        showToast('Network error submitting inquiry. Please try again.', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitText) submitText.textContent = 'Submit Inquiry';
      }
    });
  }

  // Load and Render Partners
  async function loadPartners() {
    const loadingEl = document.getElementById('partners-loading');
    const gridEl = document.getElementById('partners-grid');
    const emptyEl = document.getElementById('partners-empty');

    try {
      const res = await fetch('/api/content/partners');
      const json = await res.json();

      if (res.ok && json.success && Array.isArray(json.data)) {
        allPartners = json.data;
      } else {
        allPartners = [];
      }

      if (loadingEl) loadingEl.classList.add('hidden');
      renderPartners();
    } catch (err) {
      console.error('Error fetching partners:', err);
      if (loadingEl) loadingEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
    }
  }

  function renderPartners() {
    const gridEl = document.getElementById('partners-grid');
    const emptyEl = document.getElementById('partners-empty');
    if (!gridEl) return;

    const filtered = currentFilter === 'all'
      ? allPartners
      : allPartners.filter(p => p.category === currentFilter);

    if (filtered.length === 0) {
      gridEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    gridEl.classList.remove('hidden');

    gridEl.innerHTML = filtered.map(p => {
      const categoryBadgeColors = {
        'Headline Sponsor': 'bg-[#dfa04e]/20 text-[#865237] dark:text-[#dfa04e] border-[#dfa04e]/40',
        'Academic Partner': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
        'Technology Partner': 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
        'Ecosystem Partner': 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30'
      };

      const badgeStyle = categoryBadgeColors[p.category] || 'bg-black/5 dark:bg-white/10 text-[#5C3D2E] dark:text-[#f5d6b4] border-[#865237]/20';

      return `
        <div class="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#24140b] border border-[#865237]/15 dark:border-[#f5d6b4]/15 shadow-sm hover:shadow-md hover:border-[#865237]/40 transition-all flex flex-col justify-between group">
          <div class="space-y-4">
            
            <!-- Logo & Category Header -->
            <div class="flex items-center justify-between gap-3">
              <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#FAF7F2] dark:bg-black/40 border border-[#865237]/15 dark:border-[#f5d6b4]/15 p-2 flex items-center justify-center overflow-hidden flex-shrink-0">
                ${p.logo ? `
                  <img
                    src="${escapeHtml(p.logo)}"
                    alt="${escapeHtml(p.name)}"
                    class="max-w-full max-h-full object-contain filter group-hover:scale-105 transition-transform"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                  />
                  <div class="hidden w-full h-full items-center justify-center font-display font-black text-xl text-[#865237] dark:text-[#dfa04e]">
                    ${escapeHtml((p.name || 'P')[0])}
                  </div>
                ` : `
                  <div class="font-display font-black text-xl text-[#865237] dark:text-[#dfa04e]">
                    ${escapeHtml((p.name || 'P')[0])}
                  </div>
                `}
              </div>

              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeStyle}">
                ${escapeHtml(p.category || 'Partner')}
              </span>
            </div>

            <!-- Name & Description -->
            <div>
              <h3 class="font-display font-bold text-base sm:text-lg text-[#1A0F09] dark:text-white group-hover:text-[#865237] dark:group-hover:text-[#dfa04e] transition-colors">
                ${escapeHtml(p.name)}
              </h3>
              <p class="text-xs text-[#5C3D2E] dark:text-[#f5d6b4]/75 mt-2 leading-relaxed">
                ${escapeHtml(p.description || 'Proud supporter and ecosystem partner for The ADABAH Startup Challenge 2026.')}
              </p>
            </div>
          </div>

          <!-- Website Link Button -->
          <div class="pt-5 mt-4 border-t border-[#865237]/10 dark:border-[#f5d6b4]/10 flex items-center justify-between">
            ${p.website ? `
              <a
                href="${escapeHtml(p.website)}"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1.5 text-xs font-bold text-[#865237] dark:text-[#dfa04e] hover:underline"
              >
                <span>Visit Website</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                </svg>
              </a>
            ` : `
              <span class="text-[11px] font-semibold text-[#5C3D2E]/60 dark:text-[#f5d6b4]/40">Official Partner</span>
            `}

            <span class="w-2 h-2 rounded-full bg-emerald-500" title="Active Partner"></span>
          </div>

        </div>
      `;
    }).join('');
  }

  // Filter Buttons
  document.querySelectorAll('.partner-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.getAttribute('data-filter') || 'all';

      document.querySelectorAll('.partner-filter-btn').forEach(b => {
        b.className = 'partner-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-white dark:bg-white/5 border border-[#865237]/20 text-[#5C3D2E] dark:text-[#f5d6b4]/80 hover:border-[#865237] cursor-pointer';
      });

      btn.className = 'partner-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-[#865237] text-white dark:bg-[#dfa04e] dark:text-[#180e08] shadow-sm cursor-pointer';

      renderPartners();
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initialize
  loadPartners();
});
