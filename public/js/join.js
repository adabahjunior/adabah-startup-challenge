// public/js/join.js - Team Member Onboarding Controller
(function() {
  let inviteData = null;
  let inviteCode = '';

  // DOM Elements
  const loadingState = document.getElementById('join-loading-state');
  const errorState = document.getElementById('join-error-state');
  const errorMessage = document.getElementById('join-error-message');
  const fullState = document.getElementById('join-full-state');
  const fullStartupName = document.getElementById('full-team-startup-name');
  const formState = document.getElementById('join-form-state');

  const startupNameEl = document.getElementById('invite-startup-name');
  const startupTaglineEl = document.getElementById('invite-startup-tagline');
  const founderNameEl = document.getElementById('invite-founder-name');
  const trackEl = document.getElementById('invite-track');
  const slotsPill = document.getElementById('join-slots-pill');

  const roleSelect = document.getElementById('join-role-select');
  const customRoleContainer = document.getElementById('custom-role-container');
  const customRoleInput = document.getElementById('join-custom-role');

  const schoolSelect = document.getElementById('join-school-select');
  const customSchoolContainer = document.getElementById('custom-school-container');
  const customSchoolInput = document.getElementById('join-custom-school');

  const form = document.getElementById('team-join-form');
  const submitBtn = document.getElementById('join-submit-btn');
  const submitText = document.getElementById('join-submit-text');

  // Theme Toggles
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('adabah_theme', isDark ? 'dark' : 'light');
      } catch (e) {}
    });
  });

  // Role dropdown toggle custom input
  if (roleSelect && customRoleContainer && customRoleInput) {
    roleSelect.addEventListener('change', () => {
      if (roleSelect.value === 'Other') {
        customRoleContainer.classList.remove('hidden');
        customRoleInput.required = true;
        customRoleInput.focus();
      } else {
        customRoleContainer.classList.add('hidden');
        customRoleInput.required = false;
        customRoleInput.value = '';
      }
    });
  }

  // School dropdown toggle custom input
  if (schoolSelect && customSchoolContainer && customSchoolInput) {
    schoolSelect.addEventListener('change', () => {
      if (schoolSelect.value === 'Other') {
        customSchoolContainer.classList.remove('hidden');
        customSchoolInput.required = true;
        customSchoolInput.focus();
      } else {
        customSchoolContainer.classList.add('hidden');
        customSchoolInput.required = false;
        customSchoolInput.value = '';
      }
    });
  }

  // Initialize
  init();

  async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    inviteCode = urlParams.get('code') || urlParams.get('invite') || '';

    if (!inviteCode) {
      // Check if code is in pathname e.g. /join/INV-1234
      const pathParts = window.location.pathname.split('/').filter(Boolean);
      if (pathParts.length > 1 && pathParts[0] === 'join') {
        inviteCode = decodeURIComponent(pathParts[1]);
      }
    }

    if (!inviteCode) {
      showError('No team invite code provided. Please click the full invite link provided by your startup lead founder.');
      return;
    }

    await loadInviteDetails(inviteCode);
  }

  async function loadInviteDetails(code) {
    try {
      const res = await fetch('/api/team/invite?code=' + encodeURIComponent(code));
      const json = await res.json();

      if (!res.ok || !json.success || !json.data) {
        showError(json.message || 'Invalid or expired team invite link.');
        return;
      }

      inviteData = json.data;

      // Check if team is full (5/5)
      if (inviteData.isFull || (inviteData.availableSlots !== undefined && inviteData.availableSlots <= 0)) {
        showFull(inviteData.startupName);
        return;
      }

      // Populate Startup Details
      if (startupNameEl) startupNameEl.textContent = inviteData.startupName;
      if (startupTaglineEl) startupTaglineEl.textContent = inviteData.tagline || 'The ADABAH Startup Challenge 2026';
      if (founderNameEl) founderNameEl.textContent = inviteData.founderName + (inviteData.founderRole ? ' (' + inviteData.founderRole + ')' : '');
      if (trackEl) trackEl.textContent = inviteData.track;

      if (slotsPill) {
        const slots = inviteData.availableSlots !== undefined ? inviteData.availableSlots : (5 - inviteData.currentTeamSize);
        slotsPill.textContent = slots + (slots === 1 ? ' slot remaining' : ' slots remaining');
      }

      // Switch to form view
      if (loadingState) loadingState.classList.add('hidden');
      if (errorState) errorState.classList.add('hidden');
      if (fullState) fullState.classList.add('hidden');
      if (formState) formState.classList.remove('hidden');

    } catch (err) {
      console.error('Failed to load invite details:', err);
      showError('Unable to connect to the verification server. Please check your internet connection and try again.');
    }
  }

  function showError(msg) {
    if (loadingState) loadingState.classList.add('hidden');
    if (fullState) fullState.classList.add('hidden');
    if (formState) formState.classList.add('hidden');
    if (errorMessage) errorMessage.textContent = msg;
    if (errorState) errorState.classList.remove('hidden');
  }

  function showFull(name) {
    if (loadingState) loadingState.classList.add('hidden');
    if (errorState) errorState.classList.add('hidden');
    if (formState) formState.classList.add('hidden');
    if (fullStartupName) fullStartupName.textContent = name || 'This startup';
    if (fullState) fullState.classList.remove('hidden');
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!inviteCode) {
        showToast('Missing invite code.', 'error');
        return;
      }

      const agree = document.getElementById('join-agree');
      if (agree && !agree.checked) {
        showToast('Please accept the challenge terms and confirmation to continue.', 'error');
        return;
      }

      // Extract form values
      const name = document.getElementById('join-name').value.trim();
      const phone = document.getElementById('join-phone').value.trim();
      const email = document.getElementById('join-email').value.trim();
      
      let role = roleSelect ? roleSelect.value : '';
      if (role === 'Other') {
        role = customRoleInput ? customRoleInput.value.trim() : '';
      }

      let school = schoolSelect ? schoolSelect.value : '';
      if (school === 'Other') {
        school = customSchoolInput ? customSchoolInput.value.trim() : '';
      }

      const academicLevel = document.getElementById('join-academic').value;
      const studentId = document.getElementById('join-studentid').value.trim();
      const linkedin = document.getElementById('join-linkedin').value.trim();

      if (!name || !phone || !email || !role || !school || !academicLevel) {
        showToast('Please fill in all required fields marked with *', 'error');
        return;
      }

      // Disable button & show spinner
      submitBtn.disabled = true;
      const originalText = submitText.textContent;
      submitText.textContent = 'Enrolling & Authorizing...';

      try {
        const payload = {
          inviteCode,
          name,
          phone,
          email,
          role,
          school,
          academicLevel,
          studentId,
          linkedin
        };

        const res = await fetch('/api/team/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showToast(data.message || 'Welcome to the team!', 'success');

          // Store authentication session token so team member gets full dashboard access immediately
          if (data.token) {
            try {
              localStorage.setItem('adabah_founder_session_token', data.token);
            } catch (err) {
              console.warn('LocalStorage error:', err);
            }
          }

          submitText.textContent = 'Success! Redirecting to Workspace...';

          setTimeout(() => {
            const redirectPath = data.redirectUrl || '/dashboard';
            const separator = redirectPath.includes('?') ? '&' : '?';
            const target = data.appId ? (redirectPath + separator + 'id=' + encodeURIComponent(data.appId)) : redirectPath;
            window.location.href = target;
          }, 1200);

        } else {
          showToast(data.message || 'Failed to join team.', 'error');
          submitBtn.disabled = false;
          submitText.textContent = originalText;
        }
      } catch (err) {
        console.error('Join submission error:', err);
        showToast('Network error while joining team. Please try again.', 'error');
        submitBtn.disabled = false;
        submitText.textContent = originalText;
      }
    });
  }

  // Toast Notification Utility
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
      alert(message);
      return;
    }

    const toast = document.createElement('div');
    const bg = type === 'success' ? 'bg-emerald-600 text-white' :
               type === 'error' ? 'bg-red-600 text-white' :
               'bg-[#24140b] text-white border border-[#dfa04e]/40';

    toast.className = 'px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2 transform translate-y-2 transition-all duration-200 pointer-events-auto ' + bg;
    toast.innerHTML = '<span>' + (type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️') + '</span><span>' + escapeHtml(message) + '</span>';

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2');
    });

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
