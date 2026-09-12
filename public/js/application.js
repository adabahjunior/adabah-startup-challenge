// application.js - Multi-step Application Wizard Logic & State Management
// The ADABAH Startup Challenge 2026

let currentStep = 1;
const totalSteps = 5;
const DRAFT_STORAGE_KEY = 'adabah_app_draft_2026_v3';

const stepTitles = [
  { step: 1, name: 'Founder Profile', desc: 'Lead founder & student status' },
  { step: 2, name: 'Venture & Track', desc: 'Startup identity & stage' },
  { step: 3, name: 'Problem & Solution', desc: 'Value proposition & progress' },
  { step: 4, name: 'Supporting Media', desc: 'Video demo & confirmation' },
  { step: 5, name: 'Review & Submit', desc: 'Final application review' }
];

// Open Modal & optionally pre-select track
window.openApplicationModal = function (preselectedTrack = null) {
  const modal = document.getElementById('application-modal');
  if (!modal) return;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  if (preselectedTrack) {
    const trackSelect = document.querySelector('select[name="track"]');
    if (trackSelect) trackSelect.value = preselectedTrack;
  }

  loadDraft();
  goToStep(1);
};

window.closeApplicationModal = function () {
  const modal = document.getElementById('application-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
};

// Global step navigation function
window.goToStep = function (step) {
  if (step < 1 || step > totalSteps) return;
  currentStep = step;

  // Update step card visibility
  for (let i = 1; i <= totalSteps; i++) {
    const stepEl = document.getElementById(`app-step-${i}`);
    const circleEl = document.getElementById(`step-circle-${i}`);
    const lblEl = document.getElementById(`step-lbl-${i}`);

    if (stepEl) {
      if (i === currentStep) {
        stepEl.classList.remove('hidden');
      } else {
        stepEl.classList.add('hidden');
      }
    }

    if (circleEl) {
      if (i === currentStep) {
        circleEl.className = 'step-circle active';
      } else if (i < currentStep) {
        circleEl.className = 'step-circle completed';
        circleEl.innerHTML = `✓`;
      } else {
        circleEl.className = 'step-circle';
        circleEl.innerHTML = `${i}`;
      }
    }

    if (lblEl) {
      if (i === currentStep) {
        lblEl.className = 'step-label text-[#1a0f09] dark:text-white font-black';
      } else if (i < currentStep) {
        lblEl.className = 'step-label text-[#8F4C15] dark:text-[#dfa04e] font-bold';
      } else {
        lblEl.className = 'step-label text-[#5C3D2E] dark:text-[#f5d6b4]/60 font-semibold';
      }
    }
  }

  // Update Progress Bar
  const progressBar = document.getElementById('step-progress-bar');
  if (progressBar) {
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = `${Math.max(15, progressPercent)}%`;
  }

  // Update step title banner if present
  const stepIndicatorTitle = document.getElementById('current-step-title');
  const stepIndicatorDesc = document.getElementById('current-step-desc');
  if (stepIndicatorTitle && stepTitles[currentStep - 1]) {
    stepIndicatorTitle.innerText = `Step ${currentStep} of ${totalSteps}: ${stepTitles[currentStep - 1].name}`;
  }
  if (stepIndicatorDesc && stepTitles[currentStep - 1]) {
    stepIndicatorDesc.innerText = stepTitles[currentStep - 1].desc;
  }

  // Button visibility and text
  const prevBtn = document.getElementById('prev-step-btn');
  const nextBtn = document.getElementById('next-step-btn');
  const submitBtn = document.getElementById('submit-app-btn');

  if (prevBtn) {
    if (currentStep === 1) prevBtn.classList.add('hidden');
    else prevBtn.classList.remove('hidden');
  }

  if (nextBtn && submitBtn) {
    if (currentStep === totalSteps) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
      renderReviewSummary();
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
      nextBtn.innerHTML = currentStep === 4 ? `<span>Review Application</span> →` : `<span>Continue to Step ${currentStep + 1}</span> →`;
    }
  }

  // Scroll to top of modal / form container smoothly
  const form = document.getElementById('application-form');
  if (form) form.scrollTop = 0;
  const modalContent = document.getElementById('application-modal-content');
  if (modalContent) modalContent.scrollTop = 0;
};

// Validate Step Fields
function validateCurrentStep() {
  const form = document.getElementById('application-form');
  if (!form) return true;

  if (currentStep === 1) {
    const name = form.founderName ? form.founderName.value.trim() : '';
    const email = form.founderEmail ? form.founderEmail.value.trim() : '';
    const phone = form.founderPhone ? form.founderPhone.value.trim() : '';
    const country = form.country ? form.country.value.trim() : '';
    const city = form.city ? form.city.value.trim() : '';

    if (!name || name.length < 2) {
      showToast('Please enter the lead founder full name', 'error');
      return false;
    }
    if (!email || !email.includes('@') || !email.includes('.')) {
      showToast('Please enter a valid founder email address', 'error');
      return false;
    }
    if (!phone || phone.length < 7) {
      showToast('Please enter your contact phone / WhatsApp number', 'error');
      return false;
    }
    if (!country || !city) {
      showToast('Please provide your country and university/campus', 'error');
      return false;
    }
  }

  if (currentStep === 2) {
    const startupName = form.startupName ? form.startupName.value.trim() : '';
    const tagline = form.tagline ? form.tagline.value.trim() : '';
    const track = form.track ? form.track.value : '';
    const stage = form.stage ? form.stage.value : '';

    if (!startupName || startupName.length < 2) {
      showToast('Please enter your startup / venture name', 'error');
      return false;
    }
    if (!tagline || tagline.length < 10) {
      showToast('Please provide a descriptive elevator pitch (at least 10 characters)', 'error');
      return false;
    }
    if (!track) {
      showToast('Please select your sector track', 'error');
      return false;
    }
    if (!stage) {
      showToast('Please select your current venture stage', 'error');
      return false;
    }
  }

  if (currentStep === 3) {
    const problem = form.problem ? form.problem.value.trim() : '';
    const solution = form.solution ? form.solution.value.trim() : '';

    if (!problem || problem.length < 20) {
      showToast('Please describe the problem you are solving (at least 20 characters)', 'error');
      return false;
    }
    if (!solution || solution.length < 20) {
      showToast('Please describe your solution & product (at least 20 characters)', 'error');
      return false;
    }
  }

  if (currentStep === 4) {
    const terms = document.getElementById('terms-check');
    if (terms && !terms.checked) {
      showToast('Please accept the accuracy and participation terms', 'error');
      return false;
    }
  }

  return true;
}

// Track and Stage human-readable maps
const trackDisplayNames = {
  fintech: '💳 FinTech & Digital Payments',
  agritech: '🌾 AgriTech & Food Security',
  healthtech: '🏥 HealthTech & BioCare',
  climatetech: '🌱 ClimateTech & Clean Energy',
  deeptech: '🤖 AI, DeepTech & Software',
  consumer: '🛍️ Consumer Goods & Retail',
  creative: '🎨 Creative Arts & Media Tech',
  edtech: '📚 EdTech & Campus Innovation'
};

const stageDisplayNames = {
  idea: '💡 Developing Business Idea (Ideation)',
  prototype: '⚙️ Working Prototype / MVP',
  mvp: '🚀 Existing Business (Pre-revenue)',
  early_revenue: '💰 Existing Business (Generating Sales)'
};

// Render Review Summary on Step 5
function renderReviewSummary() {
  const container = document.getElementById('review-summary-content');
  if (!container) return;

  const data = getFormData();
  const trackLabel = trackDisplayNames[data.track] || data.track || 'General Venture';
  const stageLabel = stageDisplayNames[data.stage] || data.stage || 'In Development';

  container.innerHTML = `
    <!-- Top Summary Card -->
    <div class="p-5 rounded-2xl bg-[#faf7f2] dark:bg-[#1a0f09] border border-[#865237]/25 dark:border-[#dfa04e]/30 space-y-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#865237]/15 dark:border-[#f5d6b4]/15 pb-3">
        <div>
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#8F4C15] dark:text-[#dfa04e] block">Executive Pitch Summary</span>
          <h4 class="font-display font-black text-xl sm:text-2xl text-[#1a0f09] dark:text-white mt-0.5">${escapeHtml(data.startupName || 'Untitled Venture')}</h4>
          <p class="text-xs text-[#5c3d2e] dark:text-[#f5d6b4]/80 italic mt-0.5">"${escapeHtml(data.tagline || 'No elevator pitch provided')}"</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-[#8F4C15]/10 text-[#8F4C15] dark:bg-[#dfa04e]/20 dark:text-[#dfa04e] border border-[#8F4C15]/25 dark:border-[#dfa04e]/40">
            ${escapeHtml(trackLabel)}
          </span>
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-black/5 text-[#1a0f09] dark:bg-white/10 dark:text-white border border-black/10 dark:border-white/15">
            ${escapeHtml(stageLabel)}
          </span>
        </div>
      </div>

      <!-- Founder & Team Info -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
        <div class="p-3 rounded-xl bg-white dark:bg-black/40 border border-[#865237]/15 dark:border-[#f5d6b4]/10 shadow-sm">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block text-[11px] font-semibold">Lead Founder</span>
          <span class="font-bold text-[#1a0f09] dark:text-white text-sm">${escapeHtml(data.founderName || 'N/A')}</span>
          <span class="block text-[11px] text-[#8F4C15] dark:text-[#dfa04e] font-medium mt-0.5">${escapeHtml(data.founderRole || 'Founder')} • ${escapeHtml(data.academicLevel || 'Student')}</span>
        </div>
        <div class="p-3 rounded-xl bg-white dark:bg-black/40 border border-[#865237]/15 dark:border-[#f5d6b4]/10 shadow-sm">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block text-[11px] font-semibold">Contact Details</span>
          <span class="font-bold text-[#8F4C15] dark:text-[#f5d6b4] font-mono block truncate">${escapeHtml(data.founderEmail || 'N/A')}</span>
          <span class="text-[11px] text-[#5c3d2e] dark:text-white/80 block mt-0.5 font-mono">${escapeHtml(data.founderPhone || 'N/A')}</span>
        </div>
        <div class="p-3 rounded-xl bg-white dark:bg-black/40 border border-[#865237]/15 dark:border-[#f5d6b4]/10 shadow-sm">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block text-[11px] font-semibold">Campus & Location</span>
          <span class="font-bold text-[#1a0f09] dark:text-white text-sm block">${escapeHtml(data.city || 'Campus')}, ${escapeHtml(data.country || 'Ghana')}</span>
          <span class="text-[11px] text-[#8F4C15] dark:text-[#dfa04e] font-medium mt-0.5 block">Team: ${escapeHtml(data.teamSize || '2 Co-Founders')}</span>
        </div>
      </div>
    </div>

    <!-- Problem & Solution -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="p-4 rounded-2xl bg-[#faf7f2] dark:bg-[#1a0f09] border border-[#865237]/20 dark:border-[#f5d6b4]/15 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#8F4C15] dark:text-[#dfa04e]">The Problem Being Solved</span>
          <button type="button" onclick="goToStep(3)" class="text-[11px] text-[#8F4C15] dark:text-[#f5d6b4]/70 hover:text-[#6B3410] dark:hover:text-[#dfa04e] underline font-semibold">Edit</button>
        </div>
        <p class="text-xs text-[#5c3d2e] dark:text-[#f5d6b4]/85 leading-relaxed bg-white dark:bg-black/30 p-3 rounded-xl border border-[#865237]/10 dark:border-white/5 shadow-sm">
          ${escapeHtml(data.problem || 'No description entered')}
        </p>
      </div>

      <div class="p-4 rounded-2xl bg-[#faf7f2] dark:bg-[#1a0f09] border border-[#865237]/20 dark:border-[#f5d6b4]/15 space-y-1.5">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#8F4C15] dark:text-[#dfa04e]">The Proposed Solution</span>
          <button type="button" onclick="goToStep(3)" class="text-[11px] text-[#8F4C15] dark:text-[#f5d6b4]/70 hover:text-[#6B3410] dark:hover:text-[#dfa04e] underline font-semibold">Edit</button>
        </div>
        <p class="text-xs text-[#5c3d2e] dark:text-[#f5d6b4]/85 leading-relaxed bg-white dark:bg-black/30 p-3 rounded-xl border border-[#865237]/10 dark:border-white/5 shadow-sm">
          ${escapeHtml(data.solution || 'No description entered')}
        </p>
      </div>
    </div>

    <!-- Traction & Demo Video -->
    <div class="p-4 rounded-2xl bg-[#faf7f2] dark:bg-[#1a0f09] border border-[#865237]/20 dark:border-[#f5d6b4]/15 space-y-2 text-xs">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 text-[11px] font-semibold block">Traction & Progress:</span>
          <span class="text-[#1a0f09] dark:text-white font-medium">${escapeHtml(data.traction || 'Early development stage')}</span>
        </div>
        ${data.videoUrl ? `
        <div class="sm:text-right">
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 text-[11px] font-semibold block">Demo Video:</span>
          <a href="${escapeHtml(data.videoUrl)}" target="_blank" class="inline-flex items-center gap-1.5 text-[#8F4C15] dark:text-[#dfa04e] font-bold hover:underline">
            <span>Watch Video ↗</span>
          </a>
        </div>
        ` : ''}
      </div>
    </div>

    <div class="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
      <span class="text-base text-emerald-600 dark:text-emerald-400">✓</span>
      <span>All required fields completed. You are ready to submit your official application for the <strong>GH₵3,000 cash prize</strong>.</span>
    </div>
  `;
}

function getFormData() {
  const form = document.getElementById('application-form');
  if (!form) return {};
  const fd = new FormData(form);
  const data = {};
  for (const [key, value] of fd.entries()) {
    data[key] = value;
  }
  return data;
}

function saveDraft() {
  const data = getFormData();
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  const indicator = document.getElementById('autosave-indicator');
  if (indicator) {
    indicator.innerHTML = `✓ Draft auto-saved (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    indicator.classList.remove('opacity-0');
  }
}

function loadDraft() {
  const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const form = document.getElementById('application-form');
    if (!form) return;

    for (const key in data) {
      if (form.elements[key]) {
        form.elements[key].value = data[key];
      }
    }
    const indicator = document.getElementById('autosave-indicator');
    if (indicator) {
      indicator.innerHTML = `✓ Restored saved draft`;
    }
  } catch (e) {
    console.error('Failed to load draft:', e);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Initialize Application Wizard Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const nextBtn = document.getElementById('next-step-btn');
  const prevBtn = document.getElementById('prev-step-btn');
  const saveBtn = document.getElementById('save-draft-btn');
  const form = document.getElementById('application-form');
  const closeBtn = document.getElementById('close-app-modal-btn');
  const successCloseBtn = document.getElementById('close-success-btn');
  const copyBtn = document.getElementById('copy-id-btn');
  const printBtn = document.getElementById('print-receipt-btn');
  const trackBtn = document.getElementById('view-in-tracker-btn');

  // Trigger buttons that open application
  document.querySelectorAll('#nav-apply-btn, #hero-apply-btn, #mobile-apply-btn, .apply-trigger-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // If we are already on apply.html, scroll to top
      if (!document.getElementById('application-modal') && document.getElementById('application-form')) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.openApplicationModal();
      }
    });
  });

  document.querySelectorAll('.track-apply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const track = btn.dataset.track;
      if (!document.getElementById('application-modal') && document.getElementById('application-form')) {
        const trackSelect = document.querySelector('select[name="track"]');
        if (trackSelect) trackSelect.value = track;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.openApplicationModal(track);
      }
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', window.closeApplicationModal);

  // Stepper buttons
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        goToStep(currentStep + 1);
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        goToStep(currentStep - 1);
      }
    });
  }

  // Direct step circles clicks (allow going back to previously visited steps)
  for (let i = 1; i <= totalSteps; i++) {
    const circle = document.getElementById(`step-circle-${i}`);
    if (circle) {
      circle.addEventListener('click', () => {
        if (i < currentStep) {
          goToStep(i);
        } else if (i === currentStep + 1 && validateCurrentStep()) {
          goToStep(i);
        }
      });
    }
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      saveDraft();
      showToast('Application draft saved locally!', 'info');
    });
  }

  // Debounced auto-save on input
  if (form) {
    let saveTimeout;
    form.addEventListener('input', () => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(saveDraft, 1000);
    });

    // Character counter for textareas
    const problemTextarea = form.querySelector('textarea[name="problem"]');
    const solutionTextarea = form.querySelector('textarea[name="solution"]');
    const problemCounter = document.getElementById('problem-char-count');
    const solutionCounter = document.getElementById('solution-char-count');

    if (problemTextarea && problemCounter) {
      problemTextarea.addEventListener('input', () => {
        problemCounter.innerText = `${problemTextarea.value.length} characters`;
      });
    }
    if (solutionTextarea && solutionCounter) {
      solutionTextarea.addEventListener('input', () => {
        solutionCounter.innerText = `${solutionTextarea.value.length} characters`;
      });
    }

    // Final Form Submission
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!validateCurrentStep()) return;

      const submitBtn = document.getElementById('submit-app-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Submitting Official Application...
        `;
      }

      const payload = getFormData();

      try {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await res.json();

        if (res.ok && result.success) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);

          form.classList.add('hidden');
          const stepperHeader = document.getElementById('wizard-stepper-header');
          if (stepperHeader) stepperHeader.classList.add('hidden');

          const successView = document.getElementById('application-success-view');
          const idEl = document.getElementById('new-app-id');
          if (idEl) idEl.innerText = result.data.id;
          if (successView) successView.classList.remove('hidden');

          // Save founder dashboard session
          try {
            localStorage.setItem('adabah_founder_app_id', result.data.id);
          } catch(e) {}

          const dashBtn = document.getElementById('go-to-dashboard-btn');
          if (dashBtn) {
            dashBtn.href = `/dashboard?id=${encodeURIComponent(result.data.id)}`;
          }
          const modalDashBtn = document.getElementById('modal-go-to-dashboard-btn');
          if (modalDashBtn) {
            modalDashBtn.href = `/dashboard?id=${encodeURIComponent(result.data.id)}`;
          }

          window.lastSubmittedApp = result.data;
          showToast('Application registered successfully!', 'success');
        } else {
          showToast(result.message || 'Error submitting application', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `Submit Application`;
          }
        }
      } catch (err) {
        showToast('Connection failed. Please ensure the local server is running.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Submit Application`;
        }
      }
    });
  }

  // Copy ID button
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const idEl = document.getElementById('new-app-id');
      const id = idEl ? idEl.innerText.trim() : '';
      if (id) {
        navigator.clipboard.writeText(id).then(() => {
          showToast('Application ID copied to clipboard!', 'info');
        });
      }
    });
  }

  // View in Tracker button
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      const idEl = document.getElementById('new-app-id');
      const id = idEl ? idEl.innerText.trim() : '';
      if (document.getElementById('application-modal')) {
        window.closeApplicationModal();
      }
      const trackerInput = document.getElementById('tracker-input');
      if (trackerInput) {
        trackerInput.value = id;
        document.getElementById('tracker-form').dispatchEvent(new Event('submit'));
        document.getElementById('tracker').scrollIntoView({ behavior: 'smooth' });
      } else {
        // Redirect to homepage tracker if on standalone apply page
        window.location.href = `/#tracker`;
      }
    });
  }

  // Print receipt
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const app = window.lastSubmittedApp;
      if (!app) return;

      const receipt = document.getElementById('printable-receipt');
      if (!receipt) return;

      receipt.innerHTML = `
        <div style="font-family: sans-serif; padding: 35px; max-width: 720px; margin: 0 auto; border: 3px solid #8F4C15; background: #fff; color: #180e08; border-radius: 12px;">
          <div style="text-align: center; border-bottom: 2px solid #8F4C15; padding-bottom: 18px; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #1A0F09; font-size: 26px; font-weight: 900;">THE ADABAH STARTUP CHALLENGE 2026</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 800; color: #8F4C15; text-transform: uppercase;">Official Submission Confirmation & Receipt</p>
          </div>
          <div style="background: #FAF7F2; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid rgba(143, 76, 21, 0.2);">
            <p style="margin: 4px 0;"><strong>Application Reference ID:</strong> <span style="font-family: monospace; font-size: 18px; font-weight: bold; color: #8F4C15;">${app.id}</span></p>
            <p style="margin: 4px 0; color: #4A2E1F;"><strong>Submission Timestamp:</strong> ${new Date(app.submittedAt).toUTCString()}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #5C3D2E; font-weight: 600;">Startup / Venture:</td><td style="padding: 8px 0; font-weight: bold; color: #1A0F09;">${app.startupName}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #5C3D2E; font-weight: 600;">Challenge Track:</td><td style="padding: 8px 0; font-weight: bold; color: #1A0F09;">${(app.track || '').toUpperCase()}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #5C3D2E; font-weight: 600;">Current Stage:</td><td style="padding: 8px 0; font-weight: bold; color: #1A0F09;">${(app.stage || '').toUpperCase()}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #5C3D2E; font-weight: 600;">Lead Founder:</td><td style="padding: 8px 0; font-weight: bold; color: #1A0F09;">${app.founderName} (${app.founderEmail})</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #5C3D2E; font-weight: 600;">Institution / Campus:</td><td style="padding: 8px 0; font-weight: bold; color: #1A0F09;">${app.city || 'N/A'}, ${app.country || 'Ghana'}</td></tr>
            <tr style="border-bottom: 1px solid #eee;"><td style="padding: 8px 0; color: #5C3D2E; font-weight: 600;">Initial Review Status:</td><td style="padding: 8px 0; font-weight: 800; color: #8F4C15;">SUBMITTED (IN REVIEW)</td></tr>
          </table>
          <hr style="margin: 20px 0; border: 0; border-top: 2px solid #8F4C15;" />
          <p style="font-size: 12px; color: #4A2E1F; line-height: 1.6;">
            This receipt officially verifies that your startup has been entered into consideration for The ADABAH Startup Challenge 2026. Selected participants will advance to the 3-week mentorship programme beginning 2 November 2026 and compete for the <strong>GH₵3,000 winning cash prize</strong> on Final Pitch Day (21 November 2026).
          </p>
        </div>
      `;
      window.print();
    });
  }

  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      if (document.getElementById('application-modal')) {
        window.closeApplicationModal();
        setTimeout(() => {
          form.reset();
          form.classList.remove('hidden');
          const stepperHeader = document.getElementById('wizard-stepper-header');
          if (stepperHeader) stepperHeader.classList.remove('hidden');
          document.getElementById('application-success-view').classList.add('hidden');
          goToStep(1);
        }, 500);
      } else {
        window.location.href = '/';
      }
    });
  }

  // If on standalone apply page, initialize draft & step 1 immediately
  if (!document.getElementById('application-modal') && form) {
    loadDraft();
    goToStep(1);
  }
});
