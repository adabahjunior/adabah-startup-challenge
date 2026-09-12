// public/js/dashboard.js - Founder Dashboard Controller for The ADABAH Startup Challenge 2026

function startDashboardApp() {
  let currentApp = null;

  // DOM Elements
  const authView = document.getElementById('dashboard-auth-view');
  const mainView = document.getElementById('dashboard-main-view');
  const loginForm = document.getElementById('dashboard-login-form');
  const portalInput = document.getElementById('portal-id-input');
  const portalLoginBtn = document.getElementById('portal-login-btn');
  const headerAppBadge = document.getElementById('header-app-badge');
  const headerAppId = document.getElementById('header-app-id');
  const switchAppBtn = document.getElementById('switch-app-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const shareBtn = document.getElementById('share-dashboard-btn');
  const editProfileBtn = document.getElementById('edit-profile-btn');

  // OTP Authentication DOM Elements
  const stepIdentifier = document.getElementById('auth-step-identifier');
  const stepOtp = document.getElementById('auth-step-otp');
  const otpForm = document.getElementById('dashboard-otp-form');
  const otpMaskedPhone = document.getElementById('otp-masked-phone');
  const otpBoxes = document.querySelectorAll('.otp-box');
  const otpHiddenInput = document.getElementById('portal-otp-input');
  const verifyOtpBtn = document.getElementById('portal-verify-otp-btn');
  const resendOtpBtn = document.getElementById('portal-resend-otp-btn');
  const backToIdBtn = document.getElementById('portal-back-to-id-btn');

  let currentAuthIdentifier = '';
  let resendInterval = null;

  // Modals
  const addTeamModal = document.getElementById('add-team-modal');
  const openAddTeamBtn = document.getElementById('open-add-team-modal-btn');
  const closeTeamBtn = document.getElementById('close-team-modal-btn');
  const addTeamForm = document.getElementById('add-team-form');

  const submitDelivModal = document.getElementById('submit-deliverable-modal');
  const openSubmitDelivBtn = document.getElementById('open-submit-modal-btn');
  const closeSubmitDelivBtn = document.getElementById('close-deliverable-modal-btn');
  const submitDelivForm = document.getElementById('submit-deliverable-form');

  const editProfileModal = document.getElementById('edit-profile-modal');
  const closeProfileBtn = document.getElementById('close-profile-modal-btn');
  const editProfileForm = document.getElementById('edit-profile-form');

  // Initialize
  init();

  async function init() {
    setupEventListeners();
    setupOtpControls();

    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id') || urlParams.get('app');
    const isExplicitAuth = urlParams.get('auth') === '1';

    if (idFromUrl && portalInput) {
      portalInput.value = idFromUrl;
    }

    if (isExplicitAuth) {
      showAuthView();
      return;
    }

    // Check for existing valid session token
    const sessionToken = localStorage.getItem('adabah_founder_session_token');

    if (sessionToken) {
      try {
        const res = await fetch(`/api/auth/session?token=${encodeURIComponent(sessionToken)}`);
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          currentApp = data.data;
          const initialPage = getRequestedPage();
          renderDashboard(currentApp, initialPage);
          return;
        } else {
          // Token expired or invalid
          localStorage.removeItem('adabah_founder_session_token');
        }
      } catch (err) {
        console.warn('Session verification error, falling back to login:', err);
      }
    }

    // If no active verified session exists, show authentication view
    showAuthView();
  }

  function setupEventListeners() {
    // Mobile Sidebar Drawer Controls
    const mobileToggleBtn = document.getElementById('dashboard-mobile-toggle');
    const mobileCloseBtn = document.getElementById('dashboard-sidebar-close');
    const sidebarBackdrop = document.getElementById('dashboard-sidebar-backdrop');
    const copyIdBtn = document.getElementById('dash-copy-id-btn');

    if (mobileToggleBtn) {
      mobileToggleBtn.addEventListener('click', openMobileSidebar);
    }
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', closeMobileSidebar);
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', closeMobileSidebar);
    }

    if (copyIdBtn) {
      copyIdBtn.addEventListener('click', () => {
        if (!currentApp) return;
        navigator.clipboard.writeText(currentApp.id).then(() => {
          showToast(`Copied ${currentApp.id} to clipboard!`, 'success');
        }).catch(() => {
          showToast(`Application ID: ${currentApp.id}`, 'info');
        });
      });
    }

    // Sidebar Navigation Links
    setupSidebarNavigation();

    // Portal Login Form (Step 1: Request SMS OTP)
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = portalInput.value.trim();
        if (!id) return;
        await handleSendOtp(id);
      });
    }

    // Switch App / Logout
    if (switchAppBtn) {
      switchAppBtn.addEventListener('click', showAuthView);
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        const token = localStorage.getItem('adabah_founder_session_token');
        if (token) {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token })
            });
          } catch (_) {}
        }
        localStorage.removeItem('adabah_founder_session_token');
        localStorage.removeItem('adabah_founder_app_id');
        window.history.replaceState(null, '', '/dashboard?auth=1');
        showAuthView();
        showToast('Signed out of founder session', 'info');
      });
    }

    // Copy Shareable Portal Link
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        if (!currentApp) return;
        const shareUrl = `${window.location.origin}/dashboard?id=${encodeURIComponent(currentApp.id)}`;
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('Portal link copied to clipboard!', 'success');
        }).catch(() => {
          showToast(`Link: ${shareUrl}`, 'info');
        });
      });
    }

    // Modal Triggers: Add Team Member
    if (openAddTeamBtn) {
      openAddTeamBtn.addEventListener('click', () => {
        addTeamForm.reset();
        addTeamModal.classList.remove('hidden');
      });
    }
    if (closeTeamBtn) {
      closeTeamBtn.addEventListener('click', () => addTeamModal.classList.add('hidden'));
    }

    // Add Team Member Form Submit
    if (addTeamForm) {
      addTeamForm.addEventListener('submit', handleAddTeamMember);
    }

    // Modal Triggers: Deliverables
    if (openSubmitDelivBtn) {
      openSubmitDelivBtn.addEventListener('click', () => {
        submitDelivForm.reset();
        submitDelivModal.classList.remove('hidden');
      });
    }
    if (closeSubmitDelivBtn) {
      closeSubmitDelivBtn.addEventListener('click', () => submitDelivModal.classList.add('hidden'));
    }

    // Quick Submit Milestone Buttons
    document.querySelectorAll('.quick-submit-milestone-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const milestone = btn.getAttribute('data-milestone');
        const title = btn.getAttribute('data-title');
        document.getElementById('del-milestone').value = milestone || 'general';
        document.getElementById('del-title').value = title || '';
        document.getElementById('del-url').value = '';
        document.getElementById('del-notes').value = '';
        submitDelivModal.classList.remove('hidden');
      });
    });

    // Pitch Deck & Video quick buttons
    const updateDeckBtn = document.getElementById('update-deck-btn');
    if (updateDeckBtn) {
      updateDeckBtn.addEventListener('click', () => {
        document.getElementById('del-milestone').value = 'pitch_deck';
        document.getElementById('del-title').value = 'Updated Pitch Deck';
        document.getElementById('del-url').value = currentApp.deckUrl || '';
        document.getElementById('del-notes').value = 'Updated presentation slides';
        submitDelivModal.classList.remove('hidden');
      });
    }

    const updateVideoBtn = document.getElementById('update-video-btn');
    if (updateVideoBtn) {
      updateVideoBtn.addEventListener('click', () => {
        document.getElementById('del-milestone').value = 'video';
        document.getElementById('del-title').value = 'Product Demo / Pitch Video';
        document.getElementById('del-url').value = currentApp.videoUrl || '';
        document.getElementById('del-notes').value = 'Walkthrough demonstration';
        submitDelivModal.classList.remove('hidden');
      });
    }

    // Submit Deliverable Form Submit
    if (submitDelivForm) {
      submitDelivForm.addEventListener('submit', handleSubmitDeliverable);
    }

    // Edit Profile Modal
    function openProfileModal() {
      if (!currentApp) return;
      document.getElementById('prof-tagline').value = currentApp.tagline || '';
      document.getElementById('prof-website').value = currentApp.website || '';
      document.getElementById('prof-deck-url').value = currentApp.deckUrl || '';
      document.getElementById('prof-video-url').value = currentApp.videoUrl || '';
      editProfileModal.classList.remove('hidden');
    }

    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', openProfileModal);
    }
    document.querySelectorAll('.open-profile-modal-btn').forEach(btn => {
      btn.addEventListener('click', openProfileModal);
    });

    if (closeProfileBtn) {
      closeProfileBtn.addEventListener('click', () => editProfileModal.classList.add('hidden'));
    }
    if (editProfileForm) {
      editProfileForm.addEventListener('submit', handleEditProfile);
    }

    // Close Modals on Backdrop Click or ESC
    [addTeamModal, submitDelivModal, editProfileModal].forEach(modal => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) modal.classList.add('hidden');
        });
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        [addTeamModal, submitDelivModal, editProfileModal].forEach(m => m && m.classList.add('hidden'));
      }
    });
  }

  // Mobile Sidebar Drawer Functions
  function openMobileSidebar() {
    const sidebar = document.getElementById('dashboard-sidebar');
    const backdrop = document.getElementById('dashboard-sidebar-backdrop');
    if (sidebar) {
      sidebar.classList.remove('-translate-x-full');
      sidebar.classList.add('translate-x-0');
    }
    if (backdrop) {
      backdrop.classList.remove('hidden');
    }
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('dashboard-sidebar');
    const backdrop = document.getElementById('dashboard-sidebar-backdrop');
    if (sidebar) {
      sidebar.classList.add('-translate-x-full');
      sidebar.classList.remove('translate-x-0');
    }
    if (backdrop) {
      backdrop.classList.add('hidden');
    }
  }

  // Resolve current active page from URL query, pathname, or hash
  function getRequestedPage() {
    const validPages = ['overview', 'progress', 'deliverables', 'team', 'profile'];
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = urlParams.get('page');
    if (pageParam && validPages.includes(pageParam.toLowerCase())) {
      return pageParam.toLowerCase();
    }
    const subpath = window.location.pathname.replace(/^\/dashboard\/?/, '').replace(/\/.*$/, '').toLowerCase();
    if (validPages.includes(subpath)) {
      return subpath;
    }
    const hash = window.location.hash ? window.location.hash.replace(/^#\/?/, '').replace(/^page-/, '').toLowerCase() : '';
    if (validPages.includes(hash)) {
      return hash;
    }
    return 'overview';
  }

  function setupSidebarNavigation() {
    // Delegated click listener on document for ANY link/button with data-page or data-page-target or .sidebar-nav-btn
    document.addEventListener('click', (e) => {
      const targetEl = e.target.closest('[data-page-target], [data-page], .sidebar-nav-btn');
      if (!targetEl) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // Allow opening in new tab if modifier pressed

      const pageId = targetEl.getAttribute('data-page-target') || targetEl.getAttribute('data-page');
      if (pageId) {
        e.preventDefault();
        e.stopPropagation();
        switchPage(pageId, true);
      }
    });

    // Direct click listeners on sidebar navigation buttons as immediate fallback
    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        e.stopPropagation();
        const pageId = btn.getAttribute('data-page') || btn.getAttribute('data-page-target');
        if (pageId) switchPage(pageId, true);
      });
    });

    // Browser back/forward navigation support
    window.addEventListener('popstate', (e) => {
      if (!currentApp) return;
      const pageId = (e.state && e.state.page) || getRequestedPage();
      switchPage(pageId, false);
    });
  }

  // Switch Between Dashboard Pages (Multipage architecture)
  function switchPage(pageId, pushState = false) {
    const validPages = ['overview', 'progress', 'deliverables', 'team', 'profile'];
    if (!validPages.includes(pageId)) pageId = 'overview';

    // Hide all pages (guaranteed with both class and inline style)
    const pages = document.querySelectorAll('.dashboard-page');
    pages.forEach(page => {
      page.classList.add('hidden');
      page.style.display = 'none';
    });

    // Show target page
    let target = document.getElementById(`page-${pageId}`);
    if (!target) {
      target = document.getElementById('page-overview');
      pageId = 'overview';
    }
    if (target) {
      target.classList.remove('hidden');
      target.style.display = 'block';
    }

    // Highlight active nav link in stationary sidebar
    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
      const p = btn.getAttribute('data-page') || btn.getAttribute('data-page-target');
      if (p === pageId) {
        btn.className = 'sidebar-nav-btn w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all text-left bg-[#865237]/15 text-[#865237] dark:text-[#dfa04e] dark:bg-white/10 font-bold cursor-pointer';
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.className = 'sidebar-nav-btn w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all text-left hover:bg-black/5 dark:hover:bg-white/5 text-[#5C3D2E] dark:text-[#f5d6b4]/80 font-semibold cursor-pointer';
        btn.removeAttribute('aria-current');
      }
    });

    // Update mobile top bar page title
    const pageTitles = {
      overview: 'Overview',
      progress: 'Evaluation Stage',
      deliverables: 'Submissions & Pitch',
      team: 'Startup Team',
      profile: 'Venture Profile'
    };
    setText('mobile-page-title', pageTitles[pageId] || 'Overview');

    // Scroll main content area to top (independent of stationary sidebar)
    const contentArea = document.getElementById('dashboard-content-area');
    if (contentArea) {
      contentArea.scrollTop = 0;
    }

    // Sync clean URL with history state
    if (currentApp) {
      const targetUrl = `/dashboard/${pageId}?id=${encodeURIComponent(currentApp.id)}`;
      try {
        if (pushState) {
          window.history.pushState({ page: pageId }, '', targetUrl);
        } else {
          window.history.replaceState({ page: pageId }, '', targetUrl);
        }
      } catch (err) {
        try {
          window.location.hash = `page-${pageId}`;
        } catch (_) {}
      }
    }

    // Guarantee team invite link is populated whenever viewing team page
    if (pageId === 'team' && currentApp) {
      loadTeamInviteLink(currentApp);
    }

    // Close mobile drawer if open
    closeMobileSidebar();
  }

  // Expose switchPage on window so inline onclick handlers work universally
  window.switchDashboardPage = switchPage;

  // Show Auth / Lookup View
  function showAuthView() {
    currentApp = null;
    closeMobileSidebar();
    document.body.classList.remove('md:overflow-hidden');
    if (authView) authView.classList.remove('hidden');
    if (mainView) mainView.classList.add('hidden');
    if (headerAppBadge) headerAppBadge.classList.add('hidden');

    // Reset OTP screens to Step 1
    if (stepIdentifier) stepIdentifier.classList.remove('hidden');
    if (stepOtp) stepOtp.classList.add('hidden');
    clearOtpInputs();
    stopResendCountdown();

    if (portalInput) portalInput.focus();
  }

  // Setup OTP interaction handlers (auto-advance, backspace, paste)
  function setupOtpControls() {
    if (!otpBoxes || otpBoxes.length === 0) return;

    otpBoxes.forEach((box, index) => {
      box.addEventListener('input', () => {
        const val = box.value.replace(/\D/g, '');
        box.value = val ? val.slice(-1) : '';
        syncOtpHiddenValue();

        if (box.value && index < otpBoxes.length - 1) {
          otpBoxes[index + 1].focus();
        }

        // Auto submit if all 6 digits entered
        if (getEnteredOtp().length === 6) {
          if (otpForm) otpForm.dispatchEvent(new Event('submit'));
        }
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && index > 0) {
          otpBoxes[index - 1].focus();
          otpBoxes[index - 1].value = '';
          syncOtpHiddenValue();
        }
      });

      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
        if (!text) return;
        for (let i = 0; i < otpBoxes.length; i++) {
          otpBoxes[i].value = text[i] || '';
        }
        syncOtpHiddenValue();
        const lastFilledIdx = Math.min(text.length - 1, otpBoxes.length - 1);
        if (lastFilledIdx >= 0 && lastFilledIdx < otpBoxes.length) {
          otpBoxes[lastFilledIdx].focus();
        }
        if (text.length >= 6 && otpForm) {
          otpForm.dispatchEvent(new Event('submit'));
        }
      });
    });

    // Resend Code Button
    if (resendOtpBtn) {
      resendOtpBtn.addEventListener('click', handleResendOtp);
    }

    // Change Reference ID / Back button
    if (backToIdBtn) {
      backToIdBtn.addEventListener('click', () => {
        if (stepOtp) stepOtp.classList.add('hidden');
        if (stepIdentifier) stepIdentifier.classList.remove('hidden');
        stopResendCountdown();
        if (portalInput) portalInput.focus();
      });
    }

    // OTP Form Submit
    if (otpForm) {
      otpForm.addEventListener('submit', handleVerifyOtpSubmit);
    }
  }

  function getEnteredOtp() {
    let code = '';
    otpBoxes.forEach(box => { code += (box.value || '').trim(); });
    return code;
  }

  function syncOtpHiddenValue() {
    if (otpHiddenInput) {
      otpHiddenInput.value = getEnteredOtp();
    }
  }

  function clearOtpInputs() {
    otpBoxes.forEach(b => { b.value = ''; });
    if (otpHiddenInput) otpHiddenInput.value = '';
  }

  function startResendCountdown(seconds = 45) {
    stopResendCountdown();
    let remaining = seconds;
    if (resendOtpBtn) {
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = `Resend SMS Code (${remaining}s)`;
    }

    resendInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        stopResendCountdown();
        if (resendOtpBtn) {
          resendOtpBtn.disabled = false;
          resendOtpBtn.textContent = 'Resend SMS Code';
        }
      } else if (resendOtpBtn) {
        resendOtpBtn.textContent = `Resend SMS Code (${remaining}s)`;
      }
    }, 1000);
  }

  function stopResendCountdown() {
    if (resendInterval) {
      clearInterval(resendInterval);
      resendInterval = null;
    }
    if (resendOtpBtn) {
      resendOtpBtn.disabled = false;
      resendOtpBtn.textContent = 'Resend SMS Code';
    }
  }

  // Step 1: Send OTP via BMS Africa
  async function handleSendOtp(identifier) {
    const originalText = portalLoginBtn ? portalLoginBtn.innerHTML : '';
    if (portalLoginBtn) {
      portalLoginBtn.disabled = true;
      portalLoginBtn.innerHTML = `<span>Sending SMS code via Adabah...</span>`;
    }

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        currentAuthIdentifier = identifier.trim();
        if (otpMaskedPhone) {
          otpMaskedPhone.textContent = data.maskedPhone || 'your mobile number';
        }

        if (stepIdentifier) stepIdentifier.classList.add('hidden');
        if (stepOtp) stepOtp.classList.remove('hidden');

        clearOtpInputs();
        if (otpBoxes.length > 0) otpBoxes[0].focus();

        startResendCountdown(data.cooldownSeconds || 45);
        showToast(data.message || `Verification SMS sent to ${data.maskedPhone}!`, 'success');
      } else {
        showToast(data.message || 'Failed to send verification code.', 'error');
      }
    } catch (err) {
      console.error('Send OTP Error:', err);
      showToast('Network error requesting verification code. Please check your connection.', 'error');
    } finally {
      if (portalLoginBtn) {
        portalLoginBtn.disabled = false;
        portalLoginBtn.innerHTML = originalText;
      }
    }
  }

  // Step 2: Verify OTP and Establish Founder Session
  async function handleVerifyOtpSubmit(e) {
    if (e) e.preventDefault();
    const code = getEnteredOtp();
    if (code.length < 6) {
      showToast('Please enter the complete 6-digit verification code.', 'warning');
      return;
    }

    const originalText = verifyOtpBtn ? verifyOtpBtn.innerHTML : '';
    if (verifyOtpBtn) {
      verifyOtpBtn.disabled = true;
      verifyOtpBtn.innerHTML = `<span>Verifying Code...</span>`;
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: currentAuthIdentifier,
          otp: code
        })
      });
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        // Persist session token and app ID
        if (data.token) {
          localStorage.setItem('adabah_founder_session_token', data.token);
        }
        localStorage.setItem('adabah_founder_app_id', data.data.id);

        currentApp = data.data;
        stopResendCountdown();

        const initialPage = getRequestedPage();
        renderDashboard(currentApp, initialPage);
        showToast(`Identity verified! Welcome back, ${currentApp.founderName.split(' ')[0]}!`, 'success');
      } else {
        showToast(data.message || 'Invalid verification code. Please try again.', 'error');
        clearOtpInputs();
        if (otpBoxes.length > 0) otpBoxes[0].focus();
      }
    } catch (err) {
      console.error('Verify OTP Error:', err);
      showToast('Network error while verifying code. Please try again.', 'error');
    } finally {
      if (verifyOtpBtn) {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.innerHTML = originalText;
      }
    }
  }

  // Step 2 Fallback: Resend SMS OTP
  async function handleResendOtp() {
    if (!currentAuthIdentifier) return;
    if (resendOtpBtn) resendOtpBtn.disabled = true;

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: currentAuthIdentifier })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        startResendCountdown(data.cooldownSeconds || 45);
        showToast(data.message || 'A fresh SMS code was dispatched.', 'success');
      } else {
        showToast(data.message || 'Failed to resend code.', 'error');
      }
    } catch (err) {
      showToast('Network error while resending code.', 'error');
    }
  }

  // Load Application from Server (Fallback Direct Loader)
  async function loadApplication(identifier) {
    const loginBtn = document.getElementById('portal-login-btn');
    const originalBtnText = loginBtn ? loginBtn.innerHTML : '';
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = `<span>Connecting to Portal...</span>`;
    }

    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(identifier.trim())}`);
      const data = await res.json();

      if (res.ok && data.success && data.data) {
        currentApp = data.data;

        // Persist session
        localStorage.setItem('adabah_founder_app_id', currentApp.id);

        const initialPage = getRequestedPage();
        renderDashboard(currentApp, initialPage);
        showToast(`Welcome back, ${currentApp.founderName.split(' ')[0]}!`, 'success');
      } else {
        showToast(data.message || `No application found for "${identifier}".`, 'error');
        showAuthView();
      }
    } catch (err) {
      console.error('Portal load error:', err);
      showToast('Network error while loading dashboard. Please try again.', 'error');
      showAuthView();
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnText;
      }
    }
  }

  // Render Dashboard with Application Data
  function renderDashboard(app, initialPage = null) {
    if (!app) return;

    // Stationary Desktop Layout Lock
    document.body.classList.add('md:overflow-hidden');

    // Header & Sidebar Badges
    if (headerAppBadge) {
      headerAppBadge.classList.remove('hidden');
      headerAppBadge.classList.add('flex');
    }
    setText('header-app-id', app.id);
    setText('sidebar-startup-name', app.startupName || '—');
    setText('sidebar-track-text', `${app.track || 'General'} Track`);
    setText('mobile-startup-name', app.startupName || '—');

    // 1. Startup Banner
    setText('dash-app-id', app.id);
    setText('dash-startup-name', app.startupName || '—');
    setText('dash-tagline', app.tagline || 'Student-led innovation venture');
    setText('dash-track-pill', `${app.track || 'General'} Track`);
    setText('dash-stage-pill', `${app.stage || 'Idea'} Stage`);
    setText('dash-location', `${app.city ? `${app.city}, ` : ''}${app.country || 'Ghana'}`);
    setText('dash-founder-name', app.founderName);

    // Fast stats strip
    const teamCount = (Array.isArray(app.team) ? app.team.length : 0) + 1;
    setText('stat-team-size', `${teamCount} ${teamCount === 1 ? 'Member' : 'Members'}`);

    const delivCount = (app.deliverables || []).length;
    setText('stat-submissions-count', `${delivCount} ${delivCount === 1 ? 'Item' : 'Items'}`);

    const deckStat = document.getElementById('stat-deck-status');
    if (deckStat) {
      if (app.deckUrl && app.deckUrl.trim()) {
        deckStat.textContent = 'Attached';
        deckStat.className = 'font-bold text-emerald-600 dark:text-emerald-400 text-sm';
      } else {
        deckStat.textContent = 'Not Added';
        deckStat.className = 'font-bold text-amber-600 dark:text-amber-400 text-sm';
      }
    }

    // Website Link
    const websiteWrapper = document.getElementById('dash-website-wrapper');
    const websiteLink = document.getElementById('dash-website-link');
    if (app.website && app.website.trim()) {
      if (websiteWrapper) websiteWrapper.classList.remove('hidden');
      if (websiteLink) {
        websiteLink.href = app.website.startsWith('http') ? app.website : `https://${app.website}`;
        websiteLink.textContent = app.website.replace(/^https?:\/\//, '');
      }
    } else {
      if (websiteWrapper) websiteWrapper.classList.add('hidden');
    }

    // Status Pill (Sidebar & Mobile Top Bar)
    renderStatusPill(app.status);

    // 2. Evaluation Stage Visualizer
    renderStageVisualizer(app.status, app.score, app.statusNotes, app.updatedAt || app.submittedAt);

    // 3. Team Management
    renderTeam(app);

    // 4. Startup Summary / Fast Profile
    setText('dash-founded-year', `Founded ${app.foundedYear || '2026'}`);
    setText('dash-problem', app.problem || 'No problem statement provided.');
    setText('dash-solution', app.solution || 'No solution description provided.');
    setText('dash-traction', app.traction || 'Validated Idea');
    setText('dash-funding', app.fundingRaised || 'Bootstrapped');

    // 5. Pitch Deck & Video Cards
    renderPitchCards(app);

    // 6. Deliverables & Milestones
    renderDeliverables(app.deliverables || []);

    // Switch to active page (Multipage routing)
    const pageToOpen = initialPage || getRequestedPage();
    switchPage(pageToOpen, false);

    // Switch Views
    if (authView) authView.classList.add('hidden');
    if (mainView) mainView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Render Status Pill
  function renderStatusPill(status) {
    const pill = document.getElementById('dash-status-pill');
    const text = document.getElementById('dash-status-text');
    const mobilePill = document.getElementById('mobile-status-pill');

    const s = (status || 'submitted').toLowerCase();
    const config = {
      submitted: { label: 'Submitted', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300' },
      under_review: { label: 'Under Review', bg: 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300' },
      shortlisted: { label: 'Shortlisted', bg: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300' },
      finalist: { label: 'Finalist', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' },
      winner: { label: 'Winner 🏆', bg: 'bg-[#dfa04e]/25 border-[#dfa04e]/50 text-[#865237] dark:text-[#f5d6b4]' },
      accepted: { label: 'Accepted', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' },
      rejected: { label: 'Not Selected', bg: 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300' }
    };

    const c = config[s] || config.submitted;
    if (pill) {
      pill.className = `px-2 py-0.5 rounded-full border text-[10px] font-bold inline-flex items-center gap-1 ${c.bg}`;
    }
    if (text) {
      text.textContent = c.label;
    }
    if (mobilePill) {
      mobilePill.className = `px-2.5 py-1 rounded-full border text-[10px] font-bold ${c.bg}`;
      mobilePill.textContent = c.label;
    }
  }

  // Render 5-Stage Stepper
  function renderStageVisualizer(status, score, statusNotes, updatedAt) {
    const s = (status || 'submitted').toLowerCase();
    const stageOrder = ['submitted', 'under_review', 'shortlisted', 'finalist', 'winner'];
    
    let currentIndex = 0;
    if (s === 'under_review') currentIndex = 1;
    else if (s === 'shortlisted') currentIndex = 2;
    else if (s === 'finalist' || s === 'accepted') currentIndex = 3;
    else if (s === 'winner') currentIndex = 4;

    // Progress Bar Width
    const percentages = ['20%', '40%', '60%', '80%', '100%'];
    const bar = document.getElementById('stage-progress-bar');
    if (bar) bar.style.width = percentages[currentIndex] || '20%';

    // Nodes
    stageOrder.forEach((st, idx) => {
      const node = document.getElementById(`stage-node-${st}`);
      if (!node) return;

      const circle = node.querySelector('div');
      if (idx <= currentIndex) {
        node.classList.remove('opacity-40');
        if (circle) {
          circle.className = 'w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#865237] dark:border-[#dfa04e] bg-[#865237] dark:bg-[#dfa04e] text-white dark:text-[#180e08] flex items-center justify-center font-bold text-xs sm:text-sm shadow-md transition-all';
        }
      } else {
        node.classList.add('opacity-40');
        if (circle) {
          circle.className = 'w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#865237]/40 dark:border-[#f5d6b4]/30 bg-[#FAF7F2] dark:bg-black/40 text-[#5C3D2E] dark:text-[#f5d6b4]/60 flex items-center justify-center font-bold text-xs sm:text-sm transition-all';
        }
      }
    });

    // Score Badge
    const scoreText = document.getElementById('dash-score-text');
    if (scoreText) {
      if (score !== null && score !== undefined) {
        scoreText.textContent = `${score} / 100`;
        scoreText.className = 'font-display font-black text-sm sm:text-base text-emerald-600 dark:text-emerald-400';
      } else {
        scoreText.textContent = 'Pending Evaluation';
        scoreText.className = 'font-display font-semibold text-xs sm:text-sm text-[#5C3D2E] dark:text-[#f5d6b4]/70';
      }
    }

    // Status Notes
    setText('dash-status-notes', statusNotes || 'Your application has been received and is queued for evaluation.');
    
    // Updated At
    if (updatedAt) {
      const d = new Date(updatedAt);
      setText('dash-updated-at', `Updated ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`);
    }
  }

  // Render Team Management
  function renderTeam(app) {
    // Lead Founder
    setText('team-lead-name', app.founderName);
    setText('team-lead-role', app.founderRole || 'Founder & CEO');
    setText('team-lead-email', app.founderEmail || 'N/A');
    
    if (app.founderPhone) {
      setText('team-lead-phone', app.founderPhone);
    } else {
      const phoneRow = document.getElementById('team-lead-phone-row');
      if (phoneRow) phoneRow.classList.add('hidden');
    }

    if (app.academicLevel) {
      setText('team-lead-academic', app.academicLevel);
    } else {
      const acadRow = document.getElementById('team-lead-academic-row');
      if (acadRow) acadRow.classList.add('hidden');
    }

    // Teammates
    const teammates = Array.isArray(app.team) ? app.team : [];
    const container = document.getElementById('teammates-container');
    const emptyState = document.getElementById('teammates-empty-state');
    const badge = document.getElementById('dash-team-count-badge');

    const totalCount = teammates.length + 1; // Founder + teammates
    if (badge) badge.textContent = `${totalCount} ${totalCount === 1 ? 'Member' : 'Members'}`;

    if (!container) return;
    container.innerHTML = '';

    if (teammates.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    teammates.forEach(tm => {
      const card = document.createElement('div');
      card.className = 'p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#120904] border border-[#865237]/15 dark:border-[#f5d6b4]/15 flex items-start justify-between gap-3';
      card.innerHTML = `
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-2">
            <h5 class="font-bold text-xs sm:text-sm text-[#1A0F09] dark:text-white truncate">${escapeHtml(tm.name)}</h5>
            <span class="px-2 py-0.5 rounded bg-[#865237]/10 dark:bg-white/10 text-[10px] font-bold text-[#865237] dark:text-[#dfa04e] uppercase truncate">${escapeHtml(tm.role || 'Member')}</span>
          </div>
          <div class="text-[11px] text-[#5C3D2E] dark:text-[#f5d6b4]/70 space-y-0.5">
            ${tm.email ? `<div class="truncate">📧 ${escapeHtml(tm.email)}</div>` : ''}
            ${tm.phone ? `<div>📞 ${escapeHtml(tm.phone)}</div>` : ''}
            ${tm.campus || tm.academicLevel ? `<div>🎓 ${escapeHtml(tm.campus || '')} ${tm.campus && tm.academicLevel ? '•' : ''} ${escapeHtml(tm.academicLevel || '')}</div>` : ''}
          </div>
        </div>
        <button
          type="button"
          class="delete-tm-btn text-xs text-[#5C3D2E] dark:text-[#f5d6b4]/60 hover:text-red-500 font-bold p-1 cursor-pointer flex-shrink-0 transition-colors"
          data-id="${escapeHtml(tm.id)}"
          title="Remove teammate"
        >
          ✕
        </button>
      `;

      // Attach delete handler
      const delBtn = card.querySelector('.delete-tm-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => handleRemoveTeamMember(tm.id, tm.name));
      }

      container.appendChild(card);
    });

    // Load and sync invite link
    loadTeamInviteLink(app);
  }

  // Load and configure Team Invite Link
  async function loadTeamInviteLink(app) {
    if (!app) app = currentApp;
    const input = document.getElementById('dash-invite-link-input');
    const badge = document.getElementById('dash-invite-slots-badge');
    const fullNotice = document.getElementById('dash-invite-full-notice');
    const waBtn = document.getElementById('dash-whatsapp-invite-btn');
    const copyBtn = document.getElementById('dash-copy-invite-btn');
    const regenBtn = document.getElementById('dash-regen-invite-btn');

    if (!input) return;

    // Default origin fallback (e.g. production domain or current host)
    const origin = window.location.origin || 'https://adabah-startup-challenge.vercel.app';

    if (!app || !app.id) {
      const storedId = localStorage.getItem('adabah_founder_app_id');
      if (storedId) {
        input.value = `${origin}/join?code=INV-${storedId.replace(/^ADB-/, '')}`;
      }
      return;
    }

    // 1. SYNCHRONOUS IMMEDIATE DISPLAY - NEVER leave input blank or stuck on placeholder!
    const rawId = (app.id || '').replace(/^ADB-/, '');
    const instantCode = app.inviteCode || (rawId ? `INV-${rawId}` : '');
    const instantUrl = instantCode ? `${origin}/join?code=${encodeURIComponent(instantCode)}` : `${origin}/join`;

    if (!input.value || input.value.trim() === '' || input.value.includes('generating')) {
      input.value = instantUrl;
    }
    input.placeholder = 'Team invite link';

    const currentCount = (Array.isArray(app.team) ? app.team.length : 0) + 1;
    const instantSlots = Math.max(0, 5 - currentCount);

    if (badge) {
      if (currentCount >= 5) {
        badge.textContent = 'Team Full (5/5)';
        badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300';
      } else {
        badge.textContent = `${instantSlots} of 5 Slots Remaining`;
        badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#dfa04e]/15 border border-[#dfa04e]/30 text-[#865237] dark:text-[#dfa04e]';
      }
    }

    if (fullNotice) {
      if (currentCount >= 5) {
        fullNotice.classList.remove('hidden');
      } else {
        fullNotice.classList.add('hidden');
      }
    }

    if (waBtn) {
      const startupName = app.startupName || 'our startup';
      const msg = `Join our startup *${startupName}* on The ADABAH Startup Challenge 2026 platform! Fill in your member details to access our shared team dashboard:\n${input.value || instantUrl}`;
      waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    }

    // 2. ASYNC BACKGROUND SYNC with server endpoint
    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(app.id)}/invite-link`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.inviteUrl) {
          input.value = data.inviteUrl;
          if (app) app.inviteCode = data.inviteCode;

          // Slot Badge & Notice
          const slotsLeft = data.availableSlots !== undefined ? data.availableSlots : Math.max(0, 5 - data.currentTeamSize);
          if (badge) {
            if (data.isFull || slotsLeft <= 0) {
              badge.textContent = 'Team Full (5/5)';
              badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300';
            } else {
              badge.textContent = `${slotsLeft} of 5 Slots Remaining`;
              badge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#dfa04e]/15 border border-[#dfa04e]/30 text-[#865237] dark:text-[#dfa04e]';
            }
          }

          if (fullNotice) {
            if (data.isFull || slotsLeft <= 0) {
              fullNotice.classList.remove('hidden');
            } else {
              fullNotice.classList.add('hidden');
            }
          }

          // Update WhatsApp Link
          if (waBtn) {
            const startupName = app.startupName || 'our startup';
            const msg = `Join our startup *${startupName}* on The ADABAH Startup Challenge 2026 platform! Fill in your member details to access our shared team dashboard:\n${data.inviteUrl}`;
            waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
          }
        }
      }
    } catch (err) {
      console.warn('Background sync of team invite link:', err);
    }

    // 3. Attach listeners once
    if (copyBtn && !copyBtn.dataset.wired) {
      copyBtn.dataset.wired = 'true';
      copyBtn.addEventListener('click', () => {
        const val = input.value || instantUrl;
        if (!val) return;
        navigator.clipboard.writeText(val).then(() => {
          const label = document.getElementById('dash-copy-invite-label');
          const icon = document.getElementById('dash-copy-invite-icon');
          if (label) label.textContent = 'Copied!';
          if (icon) icon.textContent = '✅';
          showToast('Team invite link copied to clipboard!', 'success');
          setTimeout(() => {
            if (label) label.textContent = 'Copy Link';
            if (icon) icon.textContent = '📋';
          }, 2500);
        }).catch(() => {
          showToast('Failed to copy. Please copy manually from the input.', 'info');
        });
      });
    }

    if (regenBtn && !regenBtn.dataset.wired) {
      regenBtn.dataset.wired = 'true';
      regenBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to regenerate your team invite link? The previous link will stop working immediately.')) {
          return;
        }
        try {
          regenBtn.disabled = true;
          const res = await fetch(`/api/applications/${encodeURIComponent(app.id)}/invite-link/regenerate`, {
            method: 'POST'
          });
          const data = await res.json();
          if (res.ok && data.success && data.inviteUrl) {
            input.value = data.inviteUrl;
            if (app) app.inviteCode = data.inviteCode;
            showToast('Team invite link regenerated!', 'success');
            if (waBtn) {
              const startupName = app.startupName || 'our startup';
              const msg = `Join our startup *${startupName}* on The ADABAH Startup Challenge 2026 platform! Fill in your member details to access our shared team dashboard:\n${data.inviteUrl}`;
              waBtn.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            }
          } else {
            showToast(data.message || 'Failed to regenerate invite link.', 'error');
          }
        } catch (err) {
          console.error('Regenerate invite error:', err);
          showToast('Network error while regenerating link.', 'error');
        } finally {
          regenBtn.disabled = false;
        }
      });
    }
  }

  // Handle Adding Team Member
  async function handleAddTeamMember(e) {
    e.preventDefault();
    if (!currentApp) return;

    const saveBtn = document.getElementById('save-team-member-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Adding...';

    const payload = {
      name: document.getElementById('tm-name').value.trim(),
      role: document.getElementById('tm-role').value.trim(),
      email: document.getElementById('tm-email').value.trim(),
      phone: document.getElementById('tm-phone').value.trim(),
      academicLevel: document.getElementById('tm-academic').value,
      campus: document.getElementById('tm-campus').value.trim()
    };

    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(currentApp.id)}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'Team member added!', 'success');
        if (data.data) currentApp = data.data;
        renderTeam(currentApp);
        const teamCount = (Array.isArray(currentApp.team) ? currentApp.team.length : 0) + 1;
        setText('stat-team-size', `${teamCount} ${teamCount === 1 ? 'Member' : 'Members'}`);
        addTeamModal.classList.add('hidden');
        addTeamForm.reset();
      } else {
        showToast(data.message || 'Failed to add team member.', 'error');
      }
    } catch (err) {
      console.error('Add team member error:', err);
      showToast('Network error while adding team member.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }

  // Handle Removing Team Member
  async function handleRemoveTeamMember(memberId, name) {
    if (!currentApp || !confirm(`Are you sure you want to remove ${name} from the startup team?`)) return;

    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(currentApp.id)}/team/${encodeURIComponent(memberId)}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Team member removed.', 'info');
        if (data.data) currentApp = data.data;
        renderTeam(currentApp);
        const teamCount = (Array.isArray(currentApp.team) ? currentApp.team.length : 0) + 1;
        setText('stat-team-size', `${teamCount} ${teamCount === 1 ? 'Member' : 'Members'}`);
      } else {
        showToast(data.message || 'Failed to remove team member.', 'error');
      }
    } catch (err) {
      console.error('Remove member error:', err);
      showToast('Network error while removing team member.', 'error');
    }
  }

  // Render Pitch Deck & Video Cards
  function renderPitchCards(app) {
    const viewDeckLink = document.getElementById('view-deck-link');
    const deckLabel = document.getElementById('deck-status-label');
    if (app.deckUrl && app.deckUrl.trim()) {
      if (viewDeckLink) {
        viewDeckLink.href = app.deckUrl;
        viewDeckLink.classList.remove('hidden');
      }
      if (deckLabel) {
        deckLabel.textContent = '✓ Link On File';
        deckLabel.className = 'text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block';
      }
    } else {
      if (viewDeckLink) viewDeckLink.classList.add('hidden');
      if (deckLabel) {
        deckLabel.textContent = 'Not Submitted';
        deckLabel.className = 'text-[10px] text-amber-600 dark:text-amber-400 font-bold block';
      }
    }

    const viewVideoLink = document.getElementById('view-video-link');
    const videoLabel = document.getElementById('video-status-label');
    if (app.videoUrl && app.videoUrl.trim()) {
      if (viewVideoLink) {
        viewVideoLink.href = app.videoUrl;
        viewVideoLink.classList.remove('hidden');
      }
      if (videoLabel) {
        videoLabel.textContent = '✓ Link On File';
        videoLabel.className = 'text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block';
      }
    } else {
      if (viewVideoLink) viewVideoLink.classList.add('hidden');
      if (videoLabel) {
        videoLabel.textContent = 'Optional';
        videoLabel.className = 'text-[10px] text-[#5C3D2E] dark:text-[#f5d6b4]/60 font-medium block';
      }
    }
  }

  // Render Deliverables List
  function renderDeliverables(deliverables) {
    const container = document.getElementById('submissions-list-container');
    const emptyState = document.getElementById('submissions-empty-state');
    const countBadge = document.getElementById('submissions-count-badge');

    if (countBadge) {
      countBadge.textContent = `${deliverables.length} ${deliverables.length === 1 ? 'submission' : 'submissions'}`;
    }

    if (!container) return;
    container.innerHTML = '';

    if (!deliverables || deliverables.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    deliverables.forEach(del => {
      const card = document.createElement('div');
      card.className = 'p-3.5 sm:p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#120904] border border-[#865237]/15 dark:border-[#f5d6b4]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
      
      const iconMap = {
        deck: '📊',
        pitch_deck: '📊',
        video: '🎥',
        milestone_1: '📝',
        milestone_2: '📈',
        milestone_3: '🎯',
        traction: '📑'
      };
      const icon = iconMap[del.milestone] || iconMap[del.deliverableType] || '📎';

      const dateStr = del.submittedAt ? new Date(del.submittedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Recently';

      card.innerHTML = `
        <div class="flex items-start gap-3 min-w-0">
          <span class="text-xl flex-shrink-0">${icon}</span>
          <div class="space-y-0.5 min-w-0">
            <h5 class="font-bold text-xs sm:text-sm text-[#1A0F09] dark:text-white truncate">${escapeHtml(del.title)}</h5>
            ${del.notes ? `<p class="text-[11px] text-[#5C3D2E] dark:text-[#f5d6b4]/70 line-clamp-1">${escapeHtml(del.notes)}</p>` : ''}
            <div class="flex items-center gap-2 text-[10px] text-[#5C3D2E] dark:text-[#f5d6b4]/60 font-mono">
              <span>${dateStr}</span>
              <span>•</span>
              <span class="text-emerald-600 dark:text-emerald-400 font-bold uppercase">${escapeHtml(del.status || 'Received')}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <a
            href="${escapeHtml(del.url)}"
            target="_blank"
            rel="noopener noreferrer"
            class="px-3 py-1.5 rounded-lg btn-adabah-primary text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Open Link</span> ↗
          </a>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // Handle Submitting Deliverable
  async function handleSubmitDeliverable(e) {
    e.preventDefault();
    if (!currentApp) return;

    const saveBtn = document.getElementById('save-deliverable-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Uploading Submission...';

    const milestone = document.getElementById('del-milestone').value;
    const deliverableType = milestone === 'video' ? 'video' : (milestone === 'pitch_deck' || milestone.includes('deck') ? 'deck' : 'link');

    const payload = {
      milestone,
      deliverableType,
      title: document.getElementById('del-title').value.trim(),
      url: document.getElementById('del-url').value.trim(),
      notes: document.getElementById('del-notes').value.trim()
    };

    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(currentApp.id)}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'Deliverable submitted successfully!', 'success');
        if (data.data) currentApp = data.data;
        renderPitchCards(currentApp);
        renderDeliverables(currentApp.deliverables || []);
        const delivCount = (currentApp.deliverables || []).length;
        setText('stat-submissions-count', `${delivCount} ${delivCount === 1 ? 'Item' : 'Items'}`);
        const deckStat = document.getElementById('stat-deck-status');
        if (deckStat) {
          if (currentApp.deckUrl && currentApp.deckUrl.trim()) {
            deckStat.textContent = 'Attached';
            deckStat.className = 'font-bold text-emerald-600 dark:text-emerald-400 text-sm';
          } else {
            deckStat.textContent = 'Not Added';
            deckStat.className = 'font-bold text-amber-600 dark:text-amber-400 text-sm';
          }
        }
        submitDelivModal.classList.add('hidden');
        submitDelivForm.reset();
      } else {
        showToast(data.message || 'Submission failed.', 'error');
      }
    } catch (err) {
      console.error('Submit deliverable error:', err);
      showToast('Network error while saving submission.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }

  // Handle Edit Profile
  async function handleEditProfile(e) {
    e.preventDefault();
    if (!currentApp) return;

    const saveBtn = document.getElementById('save-profile-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Saving...';

    const payload = {
      tagline: document.getElementById('prof-tagline').value.trim(),
      website: document.getElementById('prof-website').value.trim(),
      deckUrl: document.getElementById('prof-deck-url').value.trim(),
      videoUrl: document.getElementById('prof-video-url').value.trim()
    };

    try {
      const res = await fetch(`/api/applications/${encodeURIComponent(currentApp.id)}/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Startup profile updated!', 'success');
        if (data.data) currentApp = data.data;
        renderDashboard(currentApp);
        editProfileModal.classList.add('hidden');
      } else {
        showToast(data.message || 'Update failed.', 'error');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      showToast('Network error while updating profile.', 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalText;
    }
  }

  // Helpers
  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
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

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClasses = {
      success: 'bg-emerald-600 text-white shadow-emerald-900/30',
      error: 'bg-red-600 text-white shadow-red-900/30',
      info: 'bg-[#180e08] text-white border border-[#865237]/40 shadow-black/40'
    };

    toast.className = `px-4 py-3 rounded-2xl shadow-xl text-xs font-bold transition-all transform duration-300 translate-y-3 opacity-0 pointer-events-auto flex items-center gap-2 ${colorClasses[type] || colorClasses.info}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    });

    // Animate out
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }
}

// Start immediately if DOM is ready, or wait for DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDashboardApp);
} else {
  startDashboardApp();
}
