// public/js/admin-dashboard.js - Central Admin Operations Controller
// The ADABAH Startup Challenge 2026

function startAdminDashboard() {
  let allApplications = [];
  let allTeams = [];
  let allBlogs = [];
  let allBroadcasts = [];
  let summaryData = null;
  let activeModalApp = null;
  let isInitialized = false;

  // DOM Elements
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  const mobileToggleBtn = document.getElementById('admin-mobile-toggle');
  const mobileCloseBtn = document.getElementById('admin-sidebar-close');
  const mobilePageTitle = document.getElementById('mobile-page-title');

  // Lock Screen Gate Elements
  const lockScreen = document.getElementById('admin-lock-screen');
  const lockCard = document.getElementById('admin-lock-card');
  const loginForm = document.getElementById('admin-login-form');
  const passInput = document.getElementById('admin-pass-input');
  const togglePassBtn = document.getElementById('toggle-admin-pass-btn');
  const loginError = document.getElementById('admin-login-error');
  const loginErrorText = document.getElementById('admin-login-error-text');
  const loginSubmitBtn = document.getElementById('admin-login-submit-btn');
  const lockBtn = document.getElementById('admin-lock-btn');
  const mobileLockBtn = document.getElementById('admin-mobile-lock-btn');

  // Modals
  const submissionModal = document.getElementById('submission-detail-modal');
  const closeSubModalBtn = document.getElementById('close-submission-modal-btn');
  const closeSubModalBottom = document.getElementById('close-submission-modal-bottom');
  const saveEvalBtn = document.getElementById('save-evaluation-btn');

  const blogModal = document.getElementById('blog-editor-modal');
  const openCreateBlogBtn = document.getElementById('open-create-blog-btn');
  const closeBlogModalBtn = document.getElementById('close-blog-modal-btn');
  const cancelBlogBtn = document.getElementById('cancel-blog-btn');
  const blogForm = document.getElementById('blog-editor-form');

  // Broadcast
  const broadcastForm = document.getElementById('broadcast-form');
  const broadcastTargetType = document.getElementById('broadcast-target-type');
  const broadcastSubTargetWrapper = document.getElementById('broadcast-sub-target-wrapper');
  const broadcastSubTargetSelect = document.getElementById('broadcast-sub-target-select');
  const broadcastSubTargetLabel = document.getElementById('broadcast-sub-target-label');
  const broadcastCustomWrapper = document.getElementById('broadcast-custom-wrapper');
  const broadcastCustomNumbers = document.getElementById('broadcast-custom-numbers');
  const broadcastMsgInput = document.getElementById('broadcast-message-input');
  const charCounter = document.getElementById('char-counter');
  const phonePreviewText = document.getElementById('phone-preview-text');
  const estimatedRecipientCount = document.getElementById('estimated-recipient-count');

  // Token & Lock Screen Controller
  function getAdminToken() {
    return localStorage.getItem('adabah_admin_token') || '';
  }

  function setAdminToken(token) {
    localStorage.setItem('adabah_admin_token', token);
  }

  function clearAdminToken() {
    localStorage.removeItem('adabah_admin_token');
  }

  function showLockScreen(errorMessage = '') {
    if (lockScreen) {
      lockScreen.classList.remove('hidden');
      lockScreen.style.display = 'flex';
    }
    if (errorMessage && loginError && loginErrorText) {
      loginErrorText.textContent = errorMessage;
      loginError.classList.remove('hidden');
    } else if (loginError) {
      loginError.classList.add('hidden');
    }
    if (passInput) {
      passInput.value = '';
      setTimeout(() => passInput.focus(), 150);
    }
  }

  function hideLockScreen() {
    if (lockScreen) {
      lockScreen.classList.add('hidden');
      lockScreen.style.display = 'none';
    }
    if (loginError) {
      loginError.classList.add('hidden');
    }
  }

  async function adminFetch(url, options = {}) {
    const token = getAdminToken();
    const headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      clearAdminToken();
      showLockScreen('Session expired or unauthorized. Please re-enter admin passcode.');
    }
    return res;
  }

  function setupLockGate() {
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = passInput ? passInput.value.trim() : '';
        if (!password) return;

        if (loginSubmitBtn) {
          loginSubmitBtn.disabled = true;
          loginSubmitBtn.innerHTML = '<span>Verifying Passcode...</span>';
        }

        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password, passcode: password })
          });
          const data = await res.json();

          if (res.ok && data.success && data.token) {
            setAdminToken(data.token);
            hideLockScreen();
            showToast('Admin Portal unlocked successfully!', 'success');

            if (!isInitialized) {
              await loadInitialData();
              isInitialized = true;
            }
          } else {
            if (loginError && loginErrorText) {
              loginErrorText.textContent = data.message || 'Invalid admin passcode. Access denied.';
              loginError.classList.remove('hidden');
            }
            if (lockCard) {
              lockCard.classList.add('animate-bounce');
              setTimeout(() => lockCard.classList.remove('animate-bounce'), 500);
            }
            if (passInput) {
              passInput.select();
            }
          }
        } catch (err) {
          if (loginError && loginErrorText) {
            loginErrorText.textContent = 'Network error while validating passcode.';
            loginError.classList.remove('hidden');
          }
        } finally {
          if (loginSubmitBtn) {
            loginSubmitBtn.disabled = false;
            loginSubmitBtn.innerHTML = '<span>Unlock Admin Portal</span> →';
          }
        }
      });
    }

    if (togglePassBtn && passInput) {
      togglePassBtn.addEventListener('click', () => {
        if (passInput.type === 'password') {
          passInput.type = 'text';
          togglePassBtn.textContent = '🔒';
        } else {
          passInput.type = 'password';
          togglePassBtn.textContent = '👁';
        }
      });
    }

    async function handleLock() {
      const token = getAdminToken();
      if (token) {
        try {
          await fetch('/api/admin/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch(e) {}
      }
      clearAdminToken();
      showLockScreen();
      showToast('Admin Portal locked.', 'info');
    }

    if (lockBtn) lockBtn.addEventListener('click', handleLock);
    if (mobileLockBtn) mobileLockBtn.addEventListener('click', handleLock);
  }

  // Initialize
  init();

  async function init() {
    setupLockGate();
    setupNavigation();
    setupModals();
    setupBroadcastInteractions();
    setupBlogControls();
    setupSubmissionsFilters();
    setupTeamsFilters();
    setupFounderControls();
    setupPartnerControls();
    setupHeroVideoControls();

    // Check URL hash or query for initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || (window.location.hash ? window.location.hash.replace('#', '') : 'overview');
    switchAdminPage(tabParam, false);

    // Verify authentication
    const token = getAdminToken();
    if (!token) {
      showLockScreen();
      return;
    }

    try {
      const res = await fetch('/api/admin/auth-check', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.authenticated) {
        clearAdminToken();
        showLockScreen('Session expired. Please enter admin passcode.');
        return;
      }

      hideLockScreen();
      await loadInitialData();
      isInitialized = true;
    } catch (err) {
      showLockScreen('Authentication check error. Please enter passcode.');
    }
  }

  // Load All Core Data from APIs
  async function loadInitialData() {
    try {
      await Promise.allSettled([
        loadSummaryData(),
        loadApplicationsData(),
        loadTeamsData(),
        loadBlogsData(),
        loadBroadcastsData(),
        loadFounderData(),
        loadPartnersData(),
        loadHeroVideoData()
      ]);
    } catch (err) {
      console.error('Error initializing admin data:', err);
    }
  }

  // Navigation Controller
  function setupNavigation() {
    if (mobileToggleBtn) {
      mobileToggleBtn.addEventListener('click', () => {
        sidebar.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
      });
    }

    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', closeMobileSidebar);
    }
    if (backdrop) {
      backdrop.addEventListener('click', closeMobileSidebar);
    }

    // Nav button clicks
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = btn.getAttribute('data-page');
        if (pageId) switchAdminPage(pageId, true);
      });
    });

    window.addEventListener('popstate', (e) => {
      const pageId = (e.state && e.state.page) || 'overview';
      switchAdminPage(pageId, false);
    });
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (backdrop) backdrop.classList.add('hidden');
  }

  function switchAdminPage(pageId, pushState = true) {
    const validPages = ['overview', 'submissions', 'teams', 'blogs', 'broadcast', 'founder', 'partners', 'hero-video'];
    if (!validPages.includes(pageId)) pageId = 'overview';

    // Toggle pages
    document.querySelectorAll('.admin-page').forEach(page => {
      page.classList.add('hidden');
      page.style.display = 'none';
    });

    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.remove('hidden');
      targetPage.style.display = 'block';
    }

    // Active button styling
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
      const p = btn.getAttribute('data-page');
      if (p === pageId) {
        btn.className = 'admin-nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left bg-[#865237]/15 text-[#865237] dark:text-[#dfa04e] dark:bg-white/10 font-bold cursor-pointer';
        btn.setAttribute('aria-current', 'page');
      } else {
        btn.className = 'admin-nav-btn w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-left text-[#5C3D2E] dark:text-[#f5d6b4]/80 hover:bg-[#865237]/10 dark:hover:bg-white/5 cursor-pointer font-medium';
        btn.removeAttribute('aria-current');
      }
    });

    // Mobile Title
    const titles = {
      overview: 'Overview',
      submissions: 'Submissions',
      teams: 'Startup Teams',
      blogs: 'Blog CMS',
      broadcast: 'SMS Broadcast',
      founder: 'Founder Profile',
      partners: 'Partners & Sponsors',
      'hero-video': 'Hero Background Video'
    };
    if (mobilePageTitle) {
      mobilePageTitle.textContent = titles[pageId] || 'Overview';
    }

    // Tab-specific load triggers
    if (pageId === 'founder') {
      loadFounderData();
    } else if (pageId === 'partners') {
      loadPartnersData();
    } else if (pageId === 'hero-video') {
      loadHeroVideoData();
    }

    // Reset scroll
    const mainArea = document.getElementById('admin-content-area');
    if (mainArea) mainArea.scrollTop = 0;

    if (pushState) {
      window.history.pushState({ page: pageId }, '', `/admin?tab=${pageId}`);
    }

    closeMobileSidebar();
  }
  window.switchAdminPage = switchAdminPage;

  // 1. OVERVIEW DATA
  async function loadSummaryData() {
    try {
      const res = await adminFetch('/api/admin/summary');
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        summaryData = data.data;
        renderSummaryView(summaryData);
      }
    } catch (err) {
      console.warn('Could not load summary data:', err);
    }
  }

  function renderSummaryView(s) {
    setText('stat-total-apps', s.totalApplications || 0);
    setText('stat-total-teams', s.totalTeams || 0);
    setText('stat-team-members', `${s.totalTeamMembers || 0} Total Members`);
    setText('stat-total-blogs', s.publishedBlogs || 0);
    setText('stat-sms-balance', `${s.bmsBalance || 0} SMS`);
    setText('sidebar-bms-balance', `${s.bmsBalance || 0} SMS`);

    // Badges in sidebar
    setText('badge-total-apps', s.totalApplications || 0);
    setText('badge-total-teams', s.totalTeams || 0);
    setText('badge-total-blogs', s.totalBlogs || 0);

    // Funnel
    if (s.statusBreakdown) {
      setText('stage-count-submitted', s.statusBreakdown.submitted || 0);
      setText('stage-count-review', s.statusBreakdown.under_review || 0);
      setText('stage-count-shortlisted', s.statusBreakdown.shortlisted || 0);
      setText('stage-count-finalist', s.statusBreakdown.finalist || 0);
      setText('stage-count-winner', (s.statusBreakdown.winner || 0) + (s.statusBreakdown.accepted || 0));
    }
  }

  // 2. SUBMISSIONS MANAGEMENT
  async function loadApplicationsData() {
    try {
      const res = await adminFetch('/api/applications');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        allApplications = data.data;
        renderSubmissionsTable(allApplications);
        renderRecentSubmissions(allApplications.slice(0, 5));
        updateBroadcastEstimator();
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  }

  function setupSubmissionsFilters() {
    const searchInput = document.getElementById('search-submissions-input');
    const trackSelect = document.getElementById('filter-submissions-track');
    const statusSelect = document.getElementById('filter-submissions-status');

    function applyFilter() {
      const q = (searchInput?.value || '').trim().toLowerCase();
      const track = trackSelect?.value || 'all';
      const status = statusSelect?.value || 'all';

      let filtered = [...allApplications];
      if (track !== 'all') {
        filtered = filtered.filter(a => a.track && a.track.toLowerCase() === track.toLowerCase());
      }
      if (status !== 'all') {
        filtered = filtered.filter(a => a.status && a.status.toLowerCase() === status.toLowerCase());
      }
      if (q) {
        filtered = filtered.filter(a =>
          (a.startupName && a.startupName.toLowerCase().includes(q)) ||
          (a.id && a.id.toLowerCase().includes(q)) ||
          (a.founderName && a.founderName.toLowerCase().includes(q)) ||
          (a.founderEmail && a.founderEmail.toLowerCase().includes(q))
        );
      }
      renderSubmissionsTable(filtered);
    }

    if (searchInput) searchInput.addEventListener('input', applyFilter);
    if (trackSelect) trackSelect.addEventListener('change', applyFilter);
    if (statusSelect) statusSelect.addEventListener('change', applyFilter);
  }

  function renderSubmissionsTable(apps) {
    const tbody = document.getElementById('submissions-table-body');
    const countText = document.getElementById('submissions-count-text');
    if (countText) countText.textContent = `Showing ${apps.length} application${apps.length === 1 ? '' : 's'}`;
    if (!tbody) return;

    if (apps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-[#5C3D2E]/60">No applications match your filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = apps.map(app => {
      const dateStr = app.submittedAt ? new Date(app.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
      const statusConfig = getStatusConfig(app.status);
      const scoreBadge = app.score ? `<span class="font-mono font-bold text-xs text-[#865237] dark:text-[#dfa04e]">${app.score}/100</span>` : `<span class="text-[10px] text-[#5C3D2E]/50 italic">Ungraded</span>`;

      return `
        <tr class="hover:bg-[#FAF7F2]/50 dark:hover:bg-white/5 transition-colors">
          <td class="py-3 px-4 font-mono font-bold text-[#865237] dark:text-[#dfa04e]">${escapeHtml(app.id)}</td>
          <td class="py-3 px-4">
            <div class="font-bold text-[#1A0F09] dark:text-white">${escapeHtml(app.startupName || 'Untitled')}</div>
            <div class="text-[10px] text-[#5C3D2E] dark:text-[#f5d6b4]/70 truncate max-w-[180px]">${escapeHtml(app.tagline || app.city || '—')}</div>
          </td>
          <td class="py-3 px-4 capitalize font-semibold">${escapeHtml(app.track || 'General')}</td>
          <td class="py-3 px-4">
            <div class="font-semibold text-[#1A0F09] dark:text-white">${escapeHtml(app.founderName || '—')}</div>
            <div class="text-[10px] text-[#5C3D2E]/70 dark:text-[#f5d6b4]/60 font-mono">${escapeHtml(app.founderEmail || '')}</div>
          </td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConfig.bg}">
              ${statusConfig.label}
            </span>
          </td>
          <td class="py-3 px-4">${scoreBadge}</td>
          <td class="py-3 px-4 text-[#5C3D2E]/70 dark:text-[#f5d6b4]/70 text-[11px] whitespace-nowrap">${dateStr}</td>
          <td class="py-3 px-4 text-right">
            <button
              type="button"
              onclick="window.openSubmissionDetail('${escapeHtml(app.id)}')"
              class="px-3 py-1.5 rounded-lg bg-[#865237]/10 dark:bg-white/10 text-[#865237] dark:text-[#dfa04e] hover:bg-[#865237]/20 font-bold text-xs cursor-pointer inline-flex items-center gap-1"
            >
              <span>Inspect & Grade</span> →
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderRecentSubmissions(apps) {
    const tbody = document.getElementById('overview-recent-table');
    if (!tbody) return;

    if (!apps || apps.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="py-4 text-center text-[#5C3D2E]/60">No submissions yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = apps.map(app => {
      const statusConfig = getStatusConfig(app.status);
      return `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer" onclick="window.openSubmissionDetail('${escapeHtml(app.id)}')">
          <td class="py-2.5 px-2 font-mono font-bold text-[#865237] dark:text-[#dfa04e]">${escapeHtml(app.id)}</td>
          <td class="py-2.5 px-2 font-bold text-[#1A0F09] dark:text-white">${escapeHtml(app.startupName)}</td>
          <td class="py-2.5 px-2 capitalize text-[11px]">${escapeHtml(app.track || 'General')}</td>
          <td class="py-2.5 px-2 text-[11px]">${escapeHtml(app.founderName || '—')}</td>
          <td class="py-2.5 px-2">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusConfig.bg}">
              ${statusConfig.label}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Open Submission Detail & Grading Modal
  window.openSubmissionDetail = function(appId) {
    const app = allApplications.find(a => a.id.toLowerCase() === String(appId).toLowerCase());
    if (!app) {
      showToast('Application record not found.', 'error');
      return;
    }
    activeModalApp = app;

    setText('modal-app-startup-name', app.startupName || 'Untitled Startup');
    setText('modal-app-id', app.id);
    setText('modal-app-track', app.track || '—');
    setText('modal-app-stage', app.stage || '—');
    setText('modal-app-location', `${app.city || ''}, ${app.country || 'Ghana'}`);
    setText('modal-app-teamsize', `${app.teamSize || 1} Persons`);

    setText('modal-founder-name', app.founderName || '—');
    setText('modal-founder-academic', `${app.academicLevel || 'Founder'} • ${app.city || 'Ghana'}`);

    const emailLink = document.getElementById('modal-founder-email-link');
    if (emailLink) {
      emailLink.href = `mailto:${app.founderEmail || ''}`;
      emailLink.textContent = app.founderEmail || 'Email';
    }

    const phoneLink = document.getElementById('modal-founder-phone-link');
    if (phoneLink) {
      phoneLink.href = `tel:${app.founderPhone || ''}`;
      phoneLink.textContent = app.founderPhone || 'Phone';
    }

    setText('modal-app-problem', app.problem || 'No problem statement provided.');
    setText('modal-app-solution', app.solution || 'No solution details provided.');
    setText('modal-app-traction', app.traction || 'Idea stage');
    setText('modal-app-funding', app.fundingRaised || 'Bootstrapped');

    // Deliverables buttons
    const delivContainer = document.getElementById('modal-deliverables-container');
    if (delivContainer) {
      let html = '';
      if (app.deckUrl) {
        html += `<a href="${escapeHtml(app.deckUrl)}" target="_blank" class="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-xs inline-flex items-center gap-1.5 hover:underline">📊 Pitch Deck ↗</a>`;
      }
      if (app.videoUrl) {
        html += `<a href="${escapeHtml(app.videoUrl)}" target="_blank" class="px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-800 dark:text-purple-300 font-bold text-xs inline-flex items-center gap-1.5 hover:underline">🎥 Demo Video ↗</a>`;
      }
      if (app.website) {
        const site = app.website.startsWith('http') ? app.website : `https://${app.website}`;
        html += `<a href="${escapeHtml(site)}" target="_blank" class="px-3 py-1.5 rounded-xl bg-blue-500/15 text-blue-800 dark:text-blue-300 font-bold text-xs inline-flex items-center gap-1.5 hover:underline">🌐 Website ↗</a>`;
      }
      if (Array.isArray(app.deliverables) && app.deliverables.length > 0) {
        app.deliverables.forEach(d => {
          if (d.url && d.url !== app.deckUrl && d.url !== app.videoUrl) {
            html += `<a href="${escapeHtml(d.url)}" target="_blank" class="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 text-[#5C3D2E] dark:text-[#f5d6b4] font-semibold text-xs inline-flex items-center gap-1.5 hover:underline">📎 ${escapeHtml(d.title)} ↗</a>`;
          }
        });
      }
      if (!html) {
        html = `<span class="text-xs text-[#5C3D2E]/60 italic">No external deliverable links submitted yet.</span>`;
      }
      delivContainer.innerHTML = html;
    }

    // Pre-fill grading form
    const statusSelect = document.getElementById('modal-status-select');
    if (statusSelect) statusSelect.value = app.status || 'submitted';

    const scoreInput = document.getElementById('modal-score-input');
    if (scoreInput) scoreInput.value = app.score !== null && app.score !== undefined ? app.score : '';

    const notesInput = document.getElementById('modal-notes-input');
    if (notesInput) notesInput.value = app.statusNotes || '';

    if (submissionModal) submissionModal.classList.remove('hidden');
  };

  // 3. STARTUP TEAMS DIRECTORY
  async function loadTeamsData() {
    try {
      const res = await adminFetch('/api/admin/teams');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        allTeams = data.data;
        renderTeamsCards(allTeams);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }

  function setupTeamsFilters() {
    const searchInput = document.getElementById('search-teams-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim().toLowerCase();
        if (!q) {
          renderTeamsCards(allTeams);
          return;
        }
        const filtered = allTeams.filter(t =>
          (t.startupName && t.startupName.toLowerCase().includes(q)) ||
          (t.leadFounder?.name && t.leadFounder.name.toLowerCase().includes(q)) ||
          (t.appId && t.appId.toLowerCase().includes(q))
        );
        renderTeamsCards(filtered);
      });
    }
  }

  function renderTeamsCards(teams) {
    const grid = document.getElementById('teams-cards-grid');
    const countEl = document.getElementById('teams-total-count');
    if (countEl) countEl.textContent = `${teams.length} Team${teams.length === 1 ? '' : 's'}`;
    if (!grid) return;

    if (teams.length === 0) {
      grid.innerHTML = `<div class="col-span-full text-center py-12 text-[#5C3D2E]/60">No teams found matching your query.</div>`;
      return;
    }

    grid.innerHTML = teams.map(team => {
      const statusConfig = getStatusBadge(team.status);
      const members = Array.isArray(team.members) ? team.members : [];

      let membersHtml = '';
      if (members.length > 0) {
        membersHtml = members.map(m => `
          <div class="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-black/30 border border-[#865237]/10 dark:border-[#f5d6b4]/10 flex items-center justify-between text-xs">
            <div>
              <div class="font-bold text-[#1A0F09] dark:text-white">${escapeHtml(m.name)}</div>
              <div class="text-[10px] text-[#5C3D2E] dark:text-[#f5d6b4]/70">${escapeHtml(m.role || 'Teammate')} ${m.academicLevel ? '• ' + escapeHtml(m.academicLevel) : ''}</div>
            </div>
            <div class="flex items-center gap-2 text-[11px]">
              ${m.phone ? `<a href="tel:${escapeHtml(m.phone)}" class="text-[#865237] dark:text-[#dfa04e] font-mono hover:underline">${escapeHtml(m.phone)}</a>` : ''}
              ${m.email ? `<a href="mailto:${escapeHtml(m.email)}" class="text-[#865237] dark:text-[#dfa04e] hover:underline">✉️</a>` : ''}
            </div>
          </div>
        `).join('');
      } else {
        membersHtml = `<div class="text-[11px] text-[#5C3D2E]/50 italic">Solo Founder (No extra teammates added yet).</div>`;
      }

      return `
        <div class="p-6 rounded-3xl bg-white dark:bg-[#24140b] border border-[#865237]/20 dark:border-[#f5d6b4]/15 shadow-sm space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-display font-bold text-base text-[#1A0F09] dark:text-white">${escapeHtml(team.startupName || 'Untitled')}</h3>
                <span class="px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusConfig.bg}">${statusConfig.label}</span>
              </div>
              <div class="text-xs text-[#865237] dark:text-[#dfa04e] font-mono font-bold mt-0.5">${escapeHtml(team.appId)} • <span class="capitalize font-sans">${escapeHtml(team.track || 'General')}</span></div>
            </div>
            <span class="px-2.5 py-1 rounded-full bg-[#865237]/10 dark:bg-white/10 text-xs font-bold text-[#865237] dark:text-[#dfa04e]">
              👥 ${team.teamSize} Member${team.teamSize === 1 ? '' : 's'}
            </span>
          </div>

          <!-- Lead Founder Card -->
          <div class="p-3.5 rounded-2xl bg-gradient-to-br from-[#FAF7F2] to-white dark:from-black/40 dark:to-black/20 border border-[#865237]/15 dark:border-[#f5d6b4]/15 space-y-1">
            <div class="text-[10px] font-bold uppercase text-[#865237] dark:text-[#dfa04e] tracking-wider">Lead Founder / CEO</div>
            <div class="flex items-center justify-between">
              <div>
                <div class="font-bold text-xs text-[#1A0F09] dark:text-white">${escapeHtml(team.leadFounder?.name || '—')}</div>
                <div class="text-[11px] text-[#5C3D2E] dark:text-[#f5d6b4]/70">${escapeHtml(team.leadFounder?.academicLevel || '')} ${team.city ? '• ' + escapeHtml(team.city) : ''}</div>
              </div>
              <div class="text-right">
                <a href="tel:${escapeHtml(team.leadFounder?.phone || '')}" class="block font-mono font-bold text-xs text-[#865237] dark:text-[#dfa04e] hover:underline">${escapeHtml(team.leadFounder?.phone || '')}</a>
                <a href="mailto:${escapeHtml(team.leadFounder?.email || '')}" class="text-[10px] text-[#5C3D2E]/70 dark:text-[#f5d6b4]/60 hover:underline">${escapeHtml(team.leadFounder?.email || '')}</a>
              </div>
            </div>
          </div>

          <!-- Teammates -->
          <div class="space-y-2">
            <div class="text-[10px] uppercase font-bold text-[#5C3D2E]/70 dark:text-[#f5d6b4]/60 tracking-wider">Additional Teammates</div>
            <div class="space-y-1.5">
              ${membersHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. BLOG & NEWS CMS
  async function loadBlogsData() {
    try {
      const res = await adminFetch('/api/blogs?all=true');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        allBlogs = data.data;
        renderBlogsTable(allBlogs);
      }
    } catch (err) {
      console.error('Error loading blogs:', err);
    }
  }

  function renderBlogsTable(blogs) {
    const tbody = document.getElementById('blogs-table-body');
    if (!tbody) return;

    if (blogs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-[#5C3D2E]/60">No articles created yet. Click "+ Write New Story" above.</td></tr>`;
      return;
    }

    tbody.innerHTML = blogs.map(blog => {
      const dateStr = blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft';
      const statusPill = blog.published
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">● Published</span>`
        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">○ Draft</span>`;

      return `
        <tr class="hover:bg-[#FAF7F2]/50 dark:hover:bg-white/5 transition-colors">
          <td class="py-3 px-4">
            <div class="font-bold text-[#1A0F09] dark:text-white line-clamp-1">${escapeHtml(blog.title)}</div>
            <div class="text-[10px] text-[#5C3D2E] dark:text-[#f5d6b4]/70 font-mono">/blog/${escapeHtml(blog.slug || '')}</div>
          </td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#865237]/10 dark:bg-white/10 text-[#865237] dark:text-[#dfa04e]">${escapeHtml(blog.category || 'News')}</span>
          </td>
          <td class="py-3 px-4 text-[#5C3D2E] dark:text-[#f5d6b4]/80 text-[11px]">${escapeHtml(blog.author || 'ADABAH')}</td>
          <td class="py-3 px-4">${statusPill}</td>
          <td class="py-3 px-4 font-mono font-bold text-[11px]">${blog.views || 0}</td>
          <td class="py-3 px-4 text-[#5C3D2E]/70 dark:text-[#f5d6b4]/70 text-[11px] whitespace-nowrap">${dateStr}</td>
          <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
            <button
              type="button"
              onclick="window.editBlogArticle('${escapeHtml(blog.id)}')"
              class="px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[#865237] dark:text-[#dfa04e] font-bold text-xs hover:bg-[#865237]/20 cursor-pointer"
            >
              Edit
            </button>
            <button
              type="button"
              onclick="window.deleteBlogArticle('${escapeHtml(blog.id)}')"
              class="px-2.5 py-1 rounded-lg text-red-600 dark:text-red-400 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
            >
              Delete
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function resetBlogCover() {
    const valInput = document.getElementById('blog-cover-val');
    const fileInput = document.getElementById('blog-cover-file');
    const dropzone = document.getElementById('blog-cover-dropzone');
    const preview = document.getElementById('blog-cover-preview');
    const previewImg = document.getElementById('blog-cover-preview-img');
    const filenameBadge = document.getElementById('blog-cover-filename');
    const statusEl = document.getElementById('blog-upload-status');

    if (valInput) valInput.value = '';
    if (fileInput) fileInput.value = '';
    if (previewImg) previewImg.src = '';
    if (preview) preview.classList.add('hidden');
    if (dropzone) dropzone.classList.remove('hidden');
    if (statusEl) statusEl.classList.add('hidden');
    if (filenameBadge) filenameBadge.textContent = 'Uploaded Cover';
  }

  function setBlogCoverPreview(url, name = 'Uploaded Cover') {
    const valInput = document.getElementById('blog-cover-val');
    const dropzone = document.getElementById('blog-cover-dropzone');
    const preview = document.getElementById('blog-cover-preview');
    const previewImg = document.getElementById('blog-cover-preview-img');
    const filenameBadge = document.getElementById('blog-cover-filename');

    if (valInput) valInput.value = url;
    if (previewImg) previewImg.src = url;
    if (filenameBadge) filenameBadge.textContent = name;
    if (dropzone) dropzone.classList.add('hidden');
    if (preview) preview.classList.remove('hidden');
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL(file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85));
        };
        img.onerror = () => resolve(e.target.result);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function uploadBlogImageFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF)', 'error');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be under 15MB', 'warning');
      return;
    }

    const statusEl = document.getElementById('blog-upload-status');
    if (statusEl) statusEl.classList.remove('hidden');

    try {
      const base64Data = await readFileAsBase64(file);

      const res = await adminFetch('/api/admin/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBlogCoverPreview(data.url, file.name);
        showToast('Image uploaded successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to upload image', 'error');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Failed to upload image.', 'error');
    } finally {
      if (statusEl) statusEl.classList.add('hidden');
    }
  }

  function setupBlogControls() {
    if (openCreateBlogBtn) {
      openCreateBlogBtn.addEventListener('click', () => {
        blogForm.reset();
        document.getElementById('blog-edit-id').value = '';
        document.getElementById('blog-modal-title').textContent = 'Write New Story / Announcement';
        document.getElementById('blog-published-input').checked = true;
        resetBlogCover();
        blogModal.classList.remove('hidden');
      });
    }

    if (closeBlogModalBtn) {
      closeBlogModalBtn.addEventListener('click', () => blogModal.classList.add('hidden'));
    }
    if (cancelBlogBtn) {
      cancelBlogBtn.addEventListener('click', () => blogModal.classList.add('hidden'));
    }

    // Auto slug generation from title
    const titleInput = document.getElementById('blog-title-input');
    const slugInput = document.getElementById('blog-slug-input');
    if (titleInput && slugInput) {
      titleInput.addEventListener('input', () => {
        if (!document.getElementById('blog-edit-id').value) {
          slugInput.value = titleInput.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }
      });
    }

    // Image Upload & Dropzone setup
    const dropzone = document.getElementById('blog-cover-dropzone');
    const fileInput = document.getElementById('blog-cover-file');
    const changeBtn = document.getElementById('blog-cover-change-btn');
    const removeBtn = document.getElementById('blog-cover-remove-btn');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('border-[#865237]', 'bg-[#865237]/5');
        });
      });

      ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('border-[#865237]', 'bg-[#865237]/5');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          uploadBlogImageFile(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          uploadBlogImageFile(e.target.files[0]);
        }
      });
    }

    if (changeBtn && fileInput) {
      changeBtn.addEventListener('click', () => fileInput.click());
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => resetBlogCover());
    }

    if (blogForm) {
      blogForm.addEventListener('submit', handleSaveBlog);
    }
  }

  async function handleSaveBlog(e) {
    e.preventDefault();
    const editId = document.getElementById('blog-edit-id').value;
    const title = document.getElementById('blog-title-input').value.trim();
    const category = document.getElementById('blog-category-select').value;
    const author = document.getElementById('blog-author-input').value.trim();
    const slug = document.getElementById('blog-slug-input').value.trim();
    const coverValEl = document.getElementById('blog-cover-val');
    const coverImage = coverValEl ? coverValEl.value.trim() : '';
    const excerpt = document.getElementById('blog-excerpt-input').value.trim();
    const content = document.getElementById('blog-content-input').value.trim();
    const published = document.getElementById('blog-published-input').checked;

    if (!title || !content) {
      showToast('Title and content are required.', 'warning');
      return;
    }

    const payload = {
      title,
      category,
      author,
      slug,
      coverImage,
      excerpt,
      content,
      published
    };

    const saveBtn = document.getElementById('save-blog-btn');
    const origText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span>Saving Story...</span>`;
    }

    try {
      const url = editId ? `/api/blogs/${encodeURIComponent(editId)}` : '/api/blogs';
      const method = editId ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(editId ? 'Article updated successfully!' : 'Article published to website!', 'success');
        blogModal.classList.add('hidden');
        await loadBlogsData();
        await loadSummaryData();
      } else {
        showToast(data.message || 'Error saving article.', 'error');
      }
    } catch (err) {
      console.error('Save blog error:', err);
      showToast('Network error saving article.', 'error');
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origText;
      }
    }
  }

  window.editBlogArticle = function(id) {
    const blog = allBlogs.find(b => b.id === id);
    if (!blog) return;

    document.getElementById('blog-edit-id').value = blog.id;
    document.getElementById('blog-title-input').value = blog.title || '';
    document.getElementById('blog-category-select').value = blog.category || 'Announcements';
    document.getElementById('blog-author-input').value = blog.author || '';
    document.getElementById('blog-slug-input').value = blog.slug || '';
    
    if (blog.coverImage) {
      setBlogCoverPreview(blog.coverImage, 'Current Cover');
    } else {
      resetBlogCover();
    }

    document.getElementById('blog-excerpt-input').value = blog.excerpt || '';
    document.getElementById('blog-content-input').value = blog.content || '';
    document.getElementById('blog-published-input').checked = blog.published !== false;

    document.getElementById('blog-modal-title').textContent = 'Edit Story / Article';
    blogModal.classList.remove('hidden');
  };

  window.deleteBlogArticle = async function(id) {
    if (!confirm('Are you sure you want to permanently delete this article?')) return;

    try {
      const res = await adminFetch(`/api/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Article deleted.', 'info');
        await loadBlogsData();
        await loadSummaryData();
      } else {
        showToast(data.message || 'Error deleting article', 'error');
      }
    } catch (err) {
      showToast('Network error deleting article.', 'error');
    }
  };

  // 5. SMS BROADCAST CENTER
  function setupBroadcastInteractions() {
    if (broadcastTargetType) {
      broadcastTargetType.addEventListener('change', updateBroadcastSubTargets);
    }

    if (broadcastMsgInput) {
      broadcastMsgInput.addEventListener('input', () => {
        const text = broadcastMsgInput.value;
        const len = text.length;
        const smsCount = Math.max(1, Math.ceil(len / 160));
        if (charCounter) {
          charCounter.textContent = `${len} / 160 chars (${smsCount} SMS)`;
        }
        if (phonePreviewText) {
          phonePreviewText.textContent = text.trim() || 'Your broadcast message preview will appear here as you type...';
        }
      });
    }

    // Quick Templates
    document.querySelectorAll('.quick-template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-template');
        const templates = {
          milestone: 'ADABAH CHALLENGE: Friendly reminder to submit your pitch deck and prototype link on your founder dashboard by Friday 11:59PM GMT.',
          shortlist: 'CONGRATULATIONS from ADABAH 2026: Your startup has officially advanced to the Top 50 Shortlist! Check your dashboard for stage 3 instructions.',
          workshop: 'ADABAH WORKSHOP ALERT: Join us this Saturday at 10:00AM for "Mastering Early-Stage Venture Economics" with our lead partner. Link on portal.',
          demoday: 'ADABAH DEMO DAY: Final countdown! Reviewers are scoring your milestone submissions today. Log in to ensure all team links are active.'
        };
        if (templates[type] && broadcastMsgInput) {
          broadcastMsgInput.value = templates[type];
          broadcastMsgInput.dispatchEvent(new Event('input'));
        }
      });
    });

    if (broadcastForm) {
      broadcastForm.addEventListener('submit', handleBroadcastSubmit);
    }
  }

  function updateBroadcastSubTargets() {
    const val = broadcastTargetType.value;
    if (val === 'track') {
      broadcastSubTargetWrapper.classList.remove('hidden');
      broadcastCustomWrapper.classList.add('hidden');
      broadcastSubTargetLabel.textContent = 'Select Startup Track';
      broadcastSubTargetSelect.innerHTML = `
        <option value="fintech">FinTech</option>
        <option value="agritech">AgriTech</option>
        <option value="healthtech">HealthTech</option>
        <option value="climatetech">ClimateTech</option>
        <option value="deeptech">AI & DeepTech</option>
      `;
    } else if (val === 'status') {
      broadcastSubTargetWrapper.classList.remove('hidden');
      broadcastCustomWrapper.classList.add('hidden');
      broadcastSubTargetLabel.textContent = 'Select Evaluation Stage';
      broadcastSubTargetSelect.innerHTML = `
        <option value="submitted">Submitted</option>
        <option value="under_review">Under Review</option>
        <option value="shortlisted">Shortlisted (Top 50)</option>
        <option value="finalist">Finalists (Top 10)</option>
        <option value="accepted">Winners</option>
      `;
    } else if (val === 'custom') {
      broadcastSubTargetWrapper.classList.add('hidden');
      broadcastCustomWrapper.classList.remove('hidden');
    } else {
      broadcastSubTargetWrapper.classList.add('hidden');
      broadcastCustomWrapper.classList.add('hidden');
    }
    updateBroadcastEstimator();
  }

  function updateBroadcastEstimator() {
    if (!estimatedRecipientCount) return;
    const val = broadcastTargetType ? broadcastTargetType.value : 'all';

    let count = 0;
    if (val === 'all') {
      count = allApplications.filter(a => a.founderPhone).length;
    } else if (val === 'track') {
      const selectedTrack = broadcastSubTargetSelect ? broadcastSubTargetSelect.value : 'fintech';
      count = allApplications.filter(a => a.track && a.track.toLowerCase() === selectedTrack.toLowerCase() && a.founderPhone).length;
    } else if (val === 'status') {
      const selectedStatus = broadcastSubTargetSelect ? broadcastSubTargetSelect.value : 'submitted';
      count = allApplications.filter(a => a.status && a.status.toLowerCase() === selectedStatus.toLowerCase() && a.founderPhone).length;
    } else if (val === 'custom') {
      const nums = (broadcastCustomNumbers ? broadcastCustomNumbers.value : '').split(/[\n,;]+/).map(p => p.trim()).filter(Boolean);
      count = nums.length;
    }
    estimatedRecipientCount.textContent = count;
  }

  async function handleBroadcastSubmit(e) {
    e.preventDefault();
    const msg = broadcastMsgInput.value.trim();
    if (!msg) {
      showToast('Please enter an SMS message body.', 'warning');
      return;
    }

    const targetType = broadcastTargetType.value;
    const targetValue = broadcastSubTargetSelect ? broadcastSubTargetSelect.value : '';
    const customRecipients = broadcastCustomNumbers ? broadcastCustomNumbers.value.trim() : '';

    const estCount = parseInt(estimatedRecipientCount.textContent || '0', 10);
    if (!confirm(`Are you sure you want to broadcast this SMS via BMS Africa (Sender: Adabah) to ${estCount} recipient(s)?\n\n"${msg}"`)) {
      return;
    }

    const submitBtn = document.getElementById('broadcast-submit-btn');
    const origText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Broadcasting SMS via BMS...</span>`;
    }

    try {
      const res = await adminFetch('/api/admin/broadcast-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetValue,
          customRecipients,
          message: msg
        })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Broadcast sent to ${data.deliveredCount} recipients via Adabah!`, 'success');
        broadcastMsgInput.value = '';
        broadcastMsgInput.dispatchEvent(new Event('input'));
        await loadBroadcastsData();
        await loadSummaryData();
      } else {
        showToast(data.message || 'Error dispatching broadcast SMS.', 'error');
      }
    } catch (err) {
      console.error('Broadcast error:', err);
      showToast('Network error while dispatching broadcast.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origText;
      }
    }
  }

  async function loadBroadcastsData() {
    try {
      const res = await adminFetch('/api/admin/broadcasts');
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.data)) {
        allBroadcasts = data.data;
        renderBroadcastHistoryTable(allBroadcasts);
        if (allBroadcasts.length > 0) {
          const last = allBroadcasts[0];
          setText('overview-last-broadcast-text', `"${last.message}"`);
          setText('overview-last-broadcast-meta', `Target: ${last.target} (${last.recipientCount} sent)`);
        }
      }
    } catch (err) {
      console.warn('Error loading broadcasts:', err);
    }
  }

  function renderBroadcastHistoryTable(campaigns) {
    const tbody = document.getElementById('broadcast-history-table-body');
    const countEl = document.getElementById('broadcast-history-count');
    if (countEl) countEl.textContent = `${campaigns.length} past campaign${campaigns.length === 1 ? '' : 's'}`;
    if (!tbody) return;

    if (campaigns.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="py-4 text-center text-[#5C3D2E]/60">No broadcast campaigns sent yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = campaigns.map(c => {
      const dateStr = c.timestamp ? new Date(c.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
      const statusPill = c.status === 'DELIVERED'
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">DELIVERED</span>`
        : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">${c.status}</span>`;

      return `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <td class="py-2.5 px-3 text-[#5C3D2E]/80 dark:text-[#f5d6b4]/80 whitespace-nowrap text-[11px]">${dateStr}</td>
          <td class="py-2.5 px-3 font-semibold capitalize">${escapeHtml(c.target)} ${c.targetValue ? `(${escapeHtml(c.targetValue)})` : ''}</td>
          <td class="py-2.5 px-3 max-w-[280px] truncate text-[#1A0F09] dark:text-white" title="${escapeHtml(c.message)}">${escapeHtml(c.message)}</td>
          <td class="py-2.5 px-3 font-mono font-bold text-center">${c.deliveredCount !== undefined ? c.deliveredCount : c.recipientCount} / ${c.recipientCount}</td>
          <td class="py-2.5 px-3">${statusPill}</td>
          <td class="py-2.5 px-3 font-mono text-[11px]">${c.creditsUsed || 1} SMS</td>
        </tr>
      `;
    }).join('');
  }

  // Modals & Evaluation Save
  function setupModals() {
    if (closeSubModalBtn) closeSubModalBtn.addEventListener('click', () => submissionModal.classList.add('hidden'));
    if (closeSubModalBottom) closeSubModalBottom.addEventListener('click', () => submissionModal.classList.add('hidden'));

    if (submissionModal) {
      submissionModal.addEventListener('click', (e) => {
        if (e.target === submissionModal) submissionModal.classList.add('hidden');
      });
    }

    if (blogModal) {
      blogModal.addEventListener('click', (e) => {
        if (e.target === blogModal) blogModal.classList.add('hidden');
      });
    }

    if (saveEvalBtn) {
      saveEvalBtn.addEventListener('click', handleSaveEvaluation);
    }
  }

  async function handleSaveEvaluation() {
    if (!activeModalApp) return;

    const status = document.getElementById('modal-status-select').value;
    const scoreVal = document.getElementById('modal-score-input').value;
    const notes = document.getElementById('modal-notes-input').value.trim();

    const payload = {
      status,
      statusNotes: notes
    };
    if (scoreVal !== '') {
      payload.score = Number(scoreVal);
    }

    saveEvalBtn.disabled = true;
    saveEvalBtn.textContent = 'Saving...';

    try {
      const res = await adminFetch(`/api/applications/${encodeURIComponent(activeModalApp.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(`Evaluation saved for ${activeModalApp.startupName}!`, 'success');
        submissionModal.classList.add('hidden');
        await loadApplicationsData();
        await loadTeamsData();
        await loadSummaryData();
      } else {
        showToast(data.message || 'Error updating status.', 'error');
      }
    } catch (err) {
      showToast('Network error while saving evaluation.', 'error');
    } finally {
      saveEvalBtn.disabled = false;
      saveEvalBtn.textContent = 'Save Evaluation & Status';
    }
  }

  // Helpers
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function setValue(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  }

  // ========================================================
  // 6. FOUNDER PROFILE CONTROLLER
  // ========================================================
  let currentFounderData = null;

  async function loadFounderData() {
    try {
      const res = await fetch('/api/content/founder');
      const data = await res.json();
      if (res.ok && data.success && data.data) {
        currentFounderData = data.data;
        populateFounderForm(currentFounderData);
      }
    } catch (err) {
      console.warn('Error fetching founder profile:', err);
    }
  }

  function populateFounderForm(f) {
    if (!f) return;
    setValue('founder-edit-name', f.name || '');
    setValue('founder-edit-title', f.title || '');
    setValue('founder-edit-tagline', f.tagline || '');
    setValue('founder-edit-vision', f.vision || '');
    setValue('founder-edit-bio', f.bio || '');
    setValue('founder-edit-message', f.message || '');
    setValue('founder-edit-photo-url', f.photo || '');

    const preview = document.getElementById('founder-edit-photo-preview');
    if (preview && f.photo) {
      preview.src = f.photo;
    }

    if (f.socials) {
      setValue('founder-edit-linkedin', f.socials.linkedin || '');
      setValue('founder-edit-twitter', f.socials.twitter || '');
      setValue('founder-edit-instagram', f.socials.instagram || '');
      setValue('founder-edit-email', f.socials.email || '');
    }
  }

  // ========================================================
  // FOUNDER PHOTO CROPPER & ADJUSTMENT CONTROLLER
  // ========================================================
  let cropperImg = null;
  let cropperScale = 1.0;
  let cropperOffsetX = 0;
  let cropperOffsetY = 0;
  let isDraggingCropper = false;
  let cropperDragStartX = 0;
  let cropperDragStartY = 0;
  let cropperInitialOffsetX = 0;
  let cropperInitialOffsetY = 0;
  let cropperInitialized = false;

  function initCropperListeners() {
    if (cropperInitialized) return;
    cropperInitialized = true;

    const modal = document.getElementById('founder-cropper-modal');
    const closeBtn = document.getElementById('close-founder-cropper-btn');
    const cancelBtn = document.getElementById('cancel-founder-cropper-btn');
    const applyBtn = document.getElementById('apply-founder-cropper-btn');
    const viewport = document.getElementById('cropper-viewport');
    const canvas = document.getElementById('cropper-canvas');

    const zoomSlider = document.getElementById('cropper-zoom-slider');
    const zoomInBtn = document.getElementById('cropper-zoom-in');
    const zoomOutBtn = document.getElementById('cropper-zoom-out');

    const moveUpBtn = document.getElementById('cropper-move-up');
    const moveDownBtn = document.getElementById('cropper-move-down');
    const moveLeftBtn = document.getElementById('cropper-move-left');
    const moveRightBtn = document.getElementById('cropper-move-right');
    const centerBtn = document.getElementById('cropper-center-btn');
    const resetBtn = document.getElementById('cropper-reset-btn');

    if (closeBtn) closeBtn.addEventListener('click', closeFounderCropperModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeFounderCropperModal);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeFounderCropperModal();
      });
    }

    // Zoom controls
    if (zoomSlider) {
      zoomSlider.addEventListener('input', () => {
        cropperScale = parseFloat(zoomSlider.value) || 1.0;
        updateZoomBadge();
        renderCropperCanvas();
      });
    }

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        cropperScale = Math.min(3.5, parseFloat((cropperScale + 0.15).toFixed(2)));
        if (zoomSlider) zoomSlider.value = cropperScale;
        updateZoomBadge();
        renderCropperCanvas();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        cropperScale = Math.max(1.0, parseFloat((cropperScale - 0.15).toFixed(2)));
        if (zoomSlider) zoomSlider.value = cropperScale;
        updateZoomBadge();
        renderCropperCanvas();
      });
    }

    // Nudge and Directional Controls (Move Left, Right, Up, Down)
    const NUDGE_STEP = 20;
    if (moveUpBtn) {
      moveUpBtn.addEventListener('click', () => {
        cropperOffsetY -= NUDGE_STEP;
        renderCropperCanvas();
      });
    }

    if (moveDownBtn) {
      moveDownBtn.addEventListener('click', () => {
        cropperOffsetY += NUDGE_STEP;
        renderCropperCanvas();
      });
    }

    if (moveLeftBtn) {
      moveLeftBtn.addEventListener('click', () => {
        cropperOffsetX -= NUDGE_STEP;
        renderCropperCanvas();
      });
    }

    if (moveRightBtn) {
      moveRightBtn.addEventListener('click', () => {
        cropperOffsetX += NUDGE_STEP;
        renderCropperCanvas();
      });
    }

    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        cropperOffsetX = 0;
        cropperOffsetY = 0;
        renderCropperCanvas();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        cropperOffsetX = 0;
        cropperOffsetY = 0;
        cropperScale = 1.0;
        if (zoomSlider) zoomSlider.value = 1.0;
        updateZoomBadge();
        renderCropperCanvas();
      });
    }

    // Direct Drag & Pan Handling on Viewport (Mouse & Touch)
    if (viewport) {
      // Mouse events
      viewport.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        isDraggingCropper = true;
        cropperDragStartX = e.clientX;
        cropperDragStartY = e.clientY;
        cropperInitialOffsetX = cropperOffsetX;
        cropperInitialOffsetY = cropperOffsetY;
        viewport.classList.remove('cursor-grab');
        viewport.classList.add('cursor-grabbing');
      });

      window.addEventListener('mousemove', (e) => {
        if (!isDraggingCropper || !canvas) return;
        const rect = viewport.getBoundingClientRect();
        const ratio = canvas.width / (rect.width || 1);
        cropperOffsetX = cropperInitialOffsetX + (e.clientX - cropperDragStartX) * ratio;
        cropperOffsetY = cropperInitialOffsetY + (e.clientY - cropperDragStartY) * ratio;
        renderCropperCanvas();
      });

      window.addEventListener('mouseup', () => {
        if (isDraggingCropper) {
          isDraggingCropper = false;
          if (viewport) {
            viewport.classList.remove('cursor-grabbing');
            viewport.classList.add('cursor-grab');
          }
        }
      });

      // Touch events (mobile / tablets)
      let initialPinchDist = null;
      let initialPinchScale = 1.0;

      viewport.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
          isDraggingCropper = true;
          cropperDragStartX = e.touches[0].clientX;
          cropperDragStartY = e.touches[0].clientY;
          cropperInitialOffsetX = cropperOffsetX;
          cropperInitialOffsetY = cropperOffsetY;
        } else if (e.touches.length === 2) {
          isDraggingCropper = false;
          initialPinchDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          initialPinchScale = cropperScale;
        }
      }, { passive: false });

      viewport.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (isDraggingCropper && e.touches.length === 1 && canvas) {
          const rect = viewport.getBoundingClientRect();
          const ratio = canvas.width / (rect.width || 1);
          cropperOffsetX = cropperInitialOffsetX + (e.touches[0].clientX - cropperDragStartX) * ratio;
          cropperOffsetY = cropperInitialOffsetY + (e.touches[0].clientY - cropperDragStartY) * ratio;
          renderCropperCanvas();
        } else if (e.touches.length === 2 && initialPinchDist) {
          const currentDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          const factor = currentDist / initialPinchDist;
          cropperScale = Math.min(3.5, Math.max(1.0, parseFloat((initialPinchScale * factor).toFixed(2))));
          if (zoomSlider) zoomSlider.value = cropperScale;
          updateZoomBadge();
          renderCropperCanvas();
        }
      }, { passive: false });

      viewport.addEventListener('touchend', (e) => {
        if (e.touches.length === 0) {
          isDraggingCropper = false;
          initialPinchDist = null;
        }
      });

      // Mouse wheel to zoom
      viewport.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        cropperScale = Math.min(3.5, Math.max(1.0, parseFloat((cropperScale + delta).toFixed(2))));
        if (zoomSlider) zoomSlider.value = cropperScale;
        updateZoomBadge();
        renderCropperCanvas();
      }, { passive: false });
    }

    // Apply Crop & Save
    if (applyBtn) {
      applyBtn.addEventListener('click', async () => {
        await applyFounderCrop();
      });
    }
  }

  function updateZoomBadge() {
    const badge = document.getElementById('cropper-zoom-badge');
    if (badge) badge.textContent = `${Math.round(cropperScale * 100)}%`;
  }

  function openFounderCropper(imageSource) {
    initCropperListeners();

    const modal = document.getElementById('founder-cropper-modal');
    const zoomSlider = document.getElementById('cropper-zoom-slider');
    const canvas = document.getElementById('cropper-canvas');

    if (!modal || !canvas) return;

    // Reset crop offsets and scale
    cropperScale = 1.0;
    cropperOffsetX = 0;
    cropperOffsetY = 0;
    if (zoomSlider) zoomSlider.value = 1.0;
    updateZoomBadge();

    // High resolution canvas for sharp retina export (aspect ratio 5:6)
    canvas.width = 600;
    canvas.height = 720;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cropperImg = img;
      modal.classList.remove('hidden');
      renderCropperCanvas();
    };
    img.onerror = () => {
      showToast('Could not load image for adjustment.', 'error');
    };
    img.src = imageSource;
  }

  function closeFounderCropperModal() {
    const modal = document.getElementById('founder-cropper-modal');
    if (modal) modal.classList.add('hidden');
  }

  function renderCropperCanvas() {
    const canvas = document.getElementById('cropper-canvas');
    if (!canvas || !cropperImg) return;
    const ctx = canvas.getContext('2d');
    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // Cover scale so image fills the 5:6 canvas
    const baseScale = Math.max(cw / cropperImg.width, ch / cropperImg.height);
    const drawWidth = cropperImg.width * baseScale * cropperScale;
    const drawHeight = cropperImg.height * baseScale * cropperScale;

    const x = (cw - drawWidth) / 2 + cropperOffsetX;
    const y = (ch - drawHeight) / 2 + cropperOffsetY;

    ctx.drawImage(cropperImg, x, y, drawWidth, drawHeight);
  }

  async function applyFounderCrop() {
    const canvas = document.getElementById('cropper-canvas');
    const applyBtn = document.getElementById('apply-founder-cropper-btn');
    const applyText = document.getElementById('apply-cropper-btn-text');
    const photoPreview = document.getElementById('founder-edit-photo-preview');
    const photoUrlInput = document.getElementById('founder-edit-photo-url');

    if (!canvas || !cropperImg) return;

    if (applyBtn) applyBtn.disabled = true;
    if (applyText) applyText.textContent = 'Processing Crop...';

    try {
      // Export high-quality cropped JPEG
      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.90);

      // Upload to server / Supabase storage
      showToast('Saving adjusted portrait...', 'info');
      let finalUrl = croppedDataUrl;

      try {
        const res = await adminFetch('/api/admin/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: croppedDataUrl,
            filename: `founder_portrait_${Date.now()}.jpg`
          })
        });
        const json = await res.json();
        if (res.ok && json.success && json.url) {
          finalUrl = json.url;
        }
      } catch (uploadErr) {
        console.warn('Network upload fallback to base64:', uploadErr);
      }

      // Update form state and preview
      if (photoPreview) photoPreview.src = finalUrl;
      if (photoUrlInput) photoUrlInput.value = finalUrl;

      closeFounderCropperModal();
      showToast('Portrait adjusted! Click "Save Changes" to publish.', 'success');
    } catch (err) {
      console.error('Error applying crop:', err);
      showToast('Error adjusting image: ' + err.message, 'error');
    } finally {
      if (applyBtn) applyBtn.disabled = false;
      if (applyText) applyText.textContent = 'Apply Crop & Use Photo';
    }
  }

  function setupFounderControls() {
    const photoFileInput = document.getElementById('founder-edit-photo-file');
    const photoPreview = document.getElementById('founder-edit-photo-preview');
    const openCropperBtn = document.getElementById('open-founder-cropper-btn');
    const form = document.getElementById('founder-editor-form');
    const topSaveBtn = document.getElementById('save-founder-btn-top');

    // When an image file is chosen from device, immediately open the interactive cropper!
    if (photoFileInput) {
      photoFileInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
          showToast('Please select a valid image file (JPG, PNG, WebP)', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (re) => {
          openFounderCropper(re.target.result);
        };
        reader.readAsDataURL(file);

        // Reset file input so re-selecting same image triggers change
        photoFileInput.value = '';
      });
    }

    // Button to adjust / reposition existing photo
    if (openCropperBtn) {
      openCropperBtn.addEventListener('click', () => {
        const currentSrc = (photoPreview && photoPreview.src) || (currentFounderData && currentFounderData.photo);
        if (currentSrc) {
          openFounderCropper(currentSrc);
        } else {
          showToast('Please upload a photo first.', 'info');
          if (photoFileInput) photoFileInput.click();
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveFounderProfile();
      });
    }

    if (topSaveBtn) {
      topSaveBtn.addEventListener('click', async () => {
        await saveFounderProfile();
      });
    }
  }

  async function saveFounderProfile() {
    const saveBtn = document.getElementById('save-founder-btn');
    const saveBtnText = document.getElementById('save-founder-btn-text');
    const topSaveBtn = document.getElementById('save-founder-btn-top');

    const name = getValue('founder-edit-name').trim();
    const title = getValue('founder-edit-title').trim();
    const tagline = getValue('founder-edit-tagline').trim();
    const vision = getValue('founder-edit-vision').trim();
    const bio = getValue('founder-edit-bio').trim();
    const message = getValue('founder-edit-message').trim();
    const photo = getValue('founder-edit-photo-url').trim();

    const socials = {
      linkedin: getValue('founder-edit-linkedin').trim(),
      twitter: getValue('founder-edit-twitter').trim(),
      instagram: getValue('founder-edit-instagram').trim(),
      email: getValue('founder-edit-email').trim()
    };

    if (!name || !title) {
      showToast('Founder name and title are required.', 'error');
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (saveBtnText) saveBtnText.textContent = 'Saving...';
    if (topSaveBtn) topSaveBtn.disabled = true;

    try {
      const payload = {
        name,
        title,
        tagline,
        vision,
        bio,
        message,
        photo,
        socials
      };

      const res = await adminFetch('/api/admin/founder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Founder profile updated successfully!', 'success');
        currentFounderData = data.data;
        populateFounderForm(currentFounderData);
      } else {
        showToast(data.message || 'Failed to update founder profile', 'error');
      }
    } catch (err) {
      showToast('Network error saving founder profile.', 'error');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
      if (saveBtnText) saveBtnText.textContent = 'Save Founder Profile';
      if (topSaveBtn) topSaveBtn.disabled = false;
    }
  }

  // Helper for image upload
  async function uploadImageFile(file, prefix = 'upload') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        try {
          const res = await adminFetch('/api/admin/upload-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              filename: `${prefix}_${file.name}`
            })
          });
          const json = await res.json();
          if (res.ok && json.success && json.url) {
            resolve(json.url);
          } else {
            resolve(base64Data);
          }
        } catch (uploadErr) {
          resolve(base64Data);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ========================================================
  // 7. PARTNERS & SPONSORS CONTROLLER
  // ========================================================
  let allAdminPartners = [];
  let partnerFilterCategory = 'all';

  async function loadPartnersData() {
    try {
      const res = await adminFetch('/api/content/partners?all=true');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        allAdminPartners = json.data;
      } else {
        allAdminPartners = [];
      }
      renderAdminPartnersTable();
    } catch (err) {
      console.warn('Error loading partners data:', err);
    }
  }

  function renderAdminPartnersTable() {
    const tbody = document.getElementById('admin-partners-table-body');
    const badge = document.getElementById('badge-total-partners');
    const statTotal = document.getElementById('stat-total-partners');
    const statActive = document.getElementById('stat-active-partners');
    const statTiers = document.getElementById('stat-total-tiers');

    if (badge) badge.textContent = allAdminPartners.length;
    if (statTotal) statTotal.textContent = allAdminPartners.length;
    if (statActive) statActive.textContent = allAdminPartners.filter(p => p.active !== false).length;

    const tiers = new Set(allAdminPartners.map(p => p.category));
    if (statTiers) statTiers.textContent = Math.max(tiers.size, 1);

    if (!tbody) return;

    const filtered = partnerFilterCategory === 'all'
      ? allAdminPartners
      : allAdminPartners.filter(p => p.category === partnerFilterCategory);

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-[#5C3D2E]/60 text-xs">
            No partners match the current filter. Click "+ Add Partner / Sponsor" to register one.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const categoryBadgeColors = {
        'Headline Sponsor': 'bg-[#dfa04e]/20 text-[#865237] dark:text-[#dfa04e]',
        'Academic Partner': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        'Technology Partner': 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
        'Ecosystem Partner': 'bg-purple-500/15 text-purple-700 dark:text-purple-400'
      };
      const badgeStyle = categoryBadgeColors[p.category] || 'bg-black/5 dark:bg-white/10 text-[#5C3D2E] dark:text-[#f5d6b4]';

      return `
        <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <td class="py-3 px-3">
            <div class="w-10 h-10 rounded-xl bg-[#FAF7F2] dark:bg-black/40 border border-[#865237]/15 p-1 flex items-center justify-center overflow-hidden">
              ${p.logo ? `
                <img src="${escapeHtml(p.logo)}" alt="logo" class="max-w-full max-h-full object-contain" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                <span class="hidden font-bold text-xs text-[#865237] dark:text-[#dfa04e]">${escapeHtml((p.name || 'P')[0])}</span>
              ` : `
                <span class="font-bold text-xs text-[#865237] dark:text-[#dfa04e]">${escapeHtml((p.name || 'P')[0])}</span>
              `}
            </div>
          </td>
          <td class="py-3 px-3">
            <div class="font-bold text-[#1A0F09] dark:text-white text-xs">${escapeHtml(p.name)}</div>
            <div class="text-[10px] text-[#5C3D2E]/70 dark:text-[#f5d6b4]/60 truncate max-w-[200px]">${escapeHtml(p.description || '')}</div>
          </td>
          <td class="py-3 px-3">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle}">
              ${escapeHtml(p.category || 'Partner')}
            </span>
          </td>
          <td class="py-3 px-3 font-mono text-[11px]">
            ${p.website ? `
              <a href="${escapeHtml(p.website)}" target="_blank" rel="noopener noreferrer" class="text-[#865237] dark:text-[#dfa04e] hover:underline flex items-center gap-1">
                <span class="truncate max-w-[140px]">${escapeHtml(p.website.replace(/^https?:\/\//, ''))}</span>
                <span class="text-[9px]">↗</span>
              </a>
            ` : `<span class="text-[#5C3D2E]/40">—</span>`}
          </td>
          <td class="py-3 px-3 text-center font-bold text-xs">
            ${p.sortOrder || 0}
          </td>
          <td class="py-3 px-3 text-center">
            ${p.active !== false ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
              </span>
            ` : `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-500/15 text-gray-500">
                <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span> Hidden
              </span>
            `}
          </td>
          <td class="py-3 px-3 text-right">
            <div class="inline-flex items-center gap-1.5">
              <button
                type="button"
                data-action="edit-partner"
                data-id="${escapeHtml(p.id)}"
                class="p-1.5 rounded-lg text-[#865237] dark:text-[#dfa04e] hover:bg-[#865237]/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Edit Partner"
              >
                ✏️
              </button>
              <button
                type="button"
                data-action="delete-partner"
                data-id="${escapeHtml(p.id)}"
                data-name="${escapeHtml(p.name)}"
                class="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Delete Partner"
              >
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row action listeners
    tbody.querySelectorAll('[data-action="edit-partner"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const partner = allAdminPartners.find(p => p.id === id);
        if (partner) openPartnerEditorModal(partner);
      });
    });

    tbody.querySelectorAll('[data-action="delete-partner"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name');
        if (confirm(`Are you sure you want to delete "${name}" from partners?`)) {
          await deletePartner(id);
        }
      });
    });
  }

  function setupPartnerControls() {
    const createBtn = document.getElementById('open-create-partner-btn');
    const closeBtn = document.getElementById('close-partner-modal-btn');
    const cancelBtn = document.getElementById('cancel-partner-modal-btn');
    const filterSelect = document.getElementById('admin-partner-filter');
    const modal = document.getElementById('partner-editor-modal');
    const form = document.getElementById('admin-partner-form');

    const logoFileInput = document.getElementById('partner-modal-logo-file');
    const logoUrlInput = document.getElementById('partner-modal-logo-url');
    const logoPreview = document.getElementById('partner-modal-logo-preview');
    const logoPlaceholder = document.getElementById('partner-modal-logo-placeholder');

    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openPartnerEditorModal(null);
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePartnerEditorModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closePartnerEditorModal);

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closePartnerEditorModal();
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        partnerFilterCategory = filterSelect.value;
        renderAdminPartnersTable();
      });
    }

    if (logoUrlInput && logoPreview && logoPlaceholder) {
      logoUrlInput.addEventListener('input', () => {
        const val = logoUrlInput.value.trim();
        if (val) {
          logoPreview.src = val;
          logoPreview.classList.remove('hidden');
          logoPlaceholder.classList.add('hidden');
        } else {
          logoPreview.classList.add('hidden');
          logoPlaceholder.classList.remove('hidden');
        }
      });
    }

    if (logoFileInput && logoPreview && logoPlaceholder) {
      logoFileInput.addEventListener('change', async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // Instant local preview
        const reader = new FileReader();
        reader.onload = (re) => {
          logoPreview.src = re.target.result;
          logoPreview.classList.remove('hidden');
          logoPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);

        // Upload to server
        try {
          showToast('Uploading partner logo...', 'info');
          const uploadedUrl = await uploadImageFile(file, 'partner_logo');
          if (uploadedUrl) {
            logoUrlInput.value = uploadedUrl;
            logoPreview.src = uploadedUrl;
            showToast('Logo uploaded!', 'success');
          }
        } catch (err) {
          showToast('Failed to upload logo: ' + err.message, 'error');
        }
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await savePartnerRecord();
      });
    }
  }

  function openPartnerEditorModal(partner = null) {
    const modal = document.getElementById('partner-editor-modal');
    const title = document.getElementById('partner-modal-title');
    const idInput = document.getElementById('partner-modal-id');
    const logoPreview = document.getElementById('partner-modal-logo-preview');
    const logoPlaceholder = document.getElementById('partner-modal-logo-placeholder');

    if (!modal) return;

    if (partner) {
      if (title) title.textContent = 'Edit Partner / Sponsor';
      if (idInput) idInput.value = partner.id;
      setValue('partner-modal-name', partner.name || '');
      setValue('partner-modal-category', partner.category || 'Headline Sponsor');
      setValue('partner-modal-order', partner.sortOrder || 1);
      setValue('partner-modal-logo-url', partner.logo || '');
      setValue('partner-modal-website', partner.website || '');
      setValue('partner-modal-description', partner.description || '');
      const activeCb = document.getElementById('partner-modal-active');
      if (activeCb) activeCb.checked = partner.active !== false;

      if (partner.logo && logoPreview && logoPlaceholder) {
        logoPreview.src = partner.logo;
        logoPreview.classList.remove('hidden');
        logoPlaceholder.classList.add('hidden');
      } else if (logoPreview && logoPlaceholder) {
        logoPreview.classList.add('hidden');
        logoPlaceholder.classList.remove('hidden');
      }
    } else {
      if (title) title.textContent = 'Add Partner / Sponsor';
      if (idInput) idInput.value = '';
      setValue('partner-modal-name', '');
      setValue('partner-modal-category', 'Ecosystem Partner');
      setValue('partner-modal-order', allAdminPartners.length + 1);
      setValue('partner-modal-logo-url', '');
      setValue('partner-modal-website', '');
      setValue('partner-modal-description', '');
      const activeCb = document.getElementById('partner-modal-active');
      if (activeCb) activeCb.checked = true;

      if (logoPreview && logoPlaceholder) {
        logoPreview.classList.add('hidden');
        logoPlaceholder.classList.remove('hidden');
      }
    }

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closePartnerEditorModal() {
    const modal = document.getElementById('partner-editor-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  async function savePartnerRecord() {
    const id = getValue('partner-modal-id').trim();
    const name = getValue('partner-modal-name').trim();
    const category = getValue('partner-modal-category');
    const sortOrder = Number(getValue('partner-modal-order')) || 0;
    const logo = getValue('partner-modal-logo-url').trim();
    const website = getValue('partner-modal-website').trim();
    const description = getValue('partner-modal-description').trim();
    const active = document.getElementById('partner-modal-active')?.checked !== false;
    const saveBtn = document.getElementById('save-partner-modal-btn');
    const saveText = document.getElementById('save-partner-modal-text');

    if (!name) {
      showToast('Partner name is required.', 'error');
      return;
    }

    if (saveBtn) saveBtn.disabled = true;
    if (saveText) saveText.textContent = 'Saving...';

    try {
      const payload = {
        name,
        category,
        sortOrder,
        logo,
        website,
        description,
        active
      };

      const url = id ? `/api/admin/partners/${id}` : '/api/admin/partners';
      const method = id ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(id ? 'Partner updated successfully!' : 'Partner added successfully!', 'success');
        closePartnerEditorModal();
        await loadPartnersData();
      } else {
        showToast(data.message || 'Error saving partner record.', 'error');
      }
    } catch (err) {
      showToast('Network error saving partner.', 'error');
    } finally {
      if (saveBtn) saveBtn.disabled = false;
      if (saveText) saveText.textContent = 'Save Partner';
    }
  }

  async function deletePartner(id) {
    try {
      const res = await adminFetch(`/api/admin/partners/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Partner deleted successfully.', 'success');
        await loadPartnersData();
      } else {
        showToast(data.message || 'Failed to delete partner', 'error');
      }
    } catch (err) {
      showToast('Network error deleting partner.', 'error');
    }
  }

  // ==========================================
  // 8. HERO BACKGROUND VIDEO CONTROLS
  // ==========================================
  let heroVideoSettings = {
    videoUrl: '',
    videoEnabled: false,
    videoOpacity: 0.25,
    posterUrl: ''
  };

  async function loadHeroVideoData() {
    try {
      const res = await fetch('/api/content/hero-video');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        heroVideoSettings = {
          videoUrl: data.videoUrl || '',
          videoEnabled: !!data.videoEnabled,
          videoOpacity: typeof data.videoOpacity === 'number' ? data.videoOpacity : 0.25,
          posterUrl: data.posterUrl || ''
        };
        renderHeroVideoUI();
      }
    } catch (err) {
      console.error('Error loading hero video settings:', err);
    }
  }

  function renderHeroVideoUI() {
    const enabledCb = document.getElementById('hero-video-enabled-cb');
    const urlInput = document.getElementById('hero-video-url-input');
    const opacitySlider = document.getElementById('hero-video-opacity-slider');
    const opacityVal = document.getElementById('hero-video-opacity-val');
    const posterInput = document.getElementById('hero-video-poster-input');
    
    const previewVideo = document.getElementById('admin-hero-preview-video');
    const previewEmpty = document.getElementById('admin-hero-preview-empty');
    const previewOverlay = document.getElementById('admin-hero-preview-overlay');
    const previewBadge = document.getElementById('admin-hero-preview-badge');
    
    const statStatus = document.getElementById('stat-hero-video-status');
    const statOpacity = document.getElementById('stat-hero-video-opacity');
    const statStorage = document.getElementById('stat-hero-video-storage');

    if (enabledCb) enabledCb.checked = heroVideoSettings.videoEnabled;
    if (urlInput) urlInput.value = heroVideoSettings.videoUrl;
    if (opacitySlider) opacitySlider.value = heroVideoSettings.videoOpacity;
    if (opacityVal) opacityVal.textContent = Math.round(heroVideoSettings.videoOpacity * 100) + '%';
    if (posterInput) posterInput.value = heroVideoSettings.posterUrl;

    if (statOpacity) statOpacity.textContent = Math.round(heroVideoSettings.videoOpacity * 100) + '%';
    if (previewOverlay) previewOverlay.style.opacity = heroVideoSettings.videoOpacity;

    if (statStatus) {
      if (heroVideoSettings.videoEnabled && heroVideoSettings.videoUrl) {
        statStatus.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="font-display font-bold text-base text-emerald-600 dark:text-emerald-400">Live Active</span>
        `;
      } else {
        statStatus.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-neutral-400"></span>
          <span class="font-display font-bold text-base text-[#1A0F09] dark:text-white">${heroVideoSettings.videoUrl ? 'Disabled' : 'No Video'}</span>
        `;
      }
    }

    if (statStorage) {
      if (!heroVideoSettings.videoUrl) {
        statStorage.textContent = 'None configured';
      } else if (heroVideoSettings.videoUrl.includes('supabase.co')) {
        statStorage.textContent = 'Supabase Cloud CDN';
      } else if (heroVideoSettings.videoUrl.startsWith('/uploads')) {
        statStorage.textContent = 'Local Server Upload';
      } else {
        statStorage.textContent = 'External Web Source';
      }
    }

    if (heroVideoSettings.videoUrl) {
      if (previewVideo) {
        previewVideo.classList.remove('hidden');
        if (previewVideo.src !== heroVideoSettings.videoUrl) {
          previewVideo.src = heroVideoSettings.videoUrl;
          previewVideo.load();
        }
        previewVideo.play().catch(() => {});
      }
      if (previewEmpty) previewEmpty.classList.add('hidden');
      if (previewBadge) {
        if (heroVideoSettings.videoEnabled) {
          previewBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30';
          previewBadge.textContent = 'Active on Homepage';
        } else {
          previewBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30';
          previewBadge.textContent = 'Inactive (Toggled Off)';
        }
      }
    } else {
      if (previewVideo) {
        previewVideo.classList.add('hidden');
        previewVideo.src = '';
      }
      if (previewEmpty) previewEmpty.classList.remove('hidden');
      if (previewBadge) {
        previewBadge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-white/10 text-[#5C3D2E] dark:text-[#f5d6b4]/80';
        previewBadge.textContent = 'Awaiting Video';
      }
    }
  }

  function setupHeroVideoControls() {
    const enabledCb = document.getElementById('hero-video-enabled-cb');
    const urlInput = document.getElementById('hero-video-url-input');
    const previewBtn = document.getElementById('hero-video-preview-btn');
    const opacitySlider = document.getElementById('hero-video-opacity-slider');
    const opacityVal = document.getElementById('hero-video-opacity-val');
    const posterInput = document.getElementById('hero-video-poster-input');
    const saveBtn = document.getElementById('save-hero-video-btn');
    const saveText = document.getElementById('save-hero-video-text');
    const clearBtn = document.getElementById('clear-hero-video-btn');

    const fileInput = document.getElementById('hero-video-file-input');
    const dropzone = document.getElementById('hero-video-dropzone');
    const progressContainer = document.getElementById('hero-video-upload-progress');
    const progressBar = document.getElementById('hero-video-upload-bar');
    const progressPct = document.getElementById('hero-video-upload-pct');
    const progressStatus = document.getElementById('hero-video-upload-status');
    const previewVideo = document.getElementById('admin-hero-preview-video');
    const previewOverlay = document.getElementById('admin-hero-preview-overlay');

    if (opacitySlider) {
      opacitySlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        heroVideoSettings.videoOpacity = val;
        if (opacityVal) opacityVal.textContent = Math.round(val * 100) + '%';
        if (previewOverlay) previewOverlay.style.opacity = val;
        const statOpacity = document.getElementById('stat-hero-video-opacity');
        if (statOpacity) statOpacity.textContent = Math.round(val * 100) + '%';
      });
    }

    if (enabledCb) {
      enabledCb.addEventListener('change', (e) => {
        heroVideoSettings.videoEnabled = e.target.checked;
        renderHeroVideoUI();
      });
    }

    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        const testUrl = urlInput ? urlInput.value.trim() : '';
        if (!testUrl) {
          showToast('Please enter a video URL first.', 'error');
          return;
        }
        heroVideoSettings.videoUrl = testUrl;
        renderHeroVideoUI();
        showToast('Testing video source in preview player.', 'info');
      });
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('border-[#865237]', 'dark:border-[#dfa04e]', 'bg-[#865237]/10');
      });
      dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-[#865237]', 'dark:border-[#dfa04e]', 'bg-[#865237]/10');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('border-[#865237]', 'dark:border-[#dfa04e]', 'bg-[#865237]/10');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleVideoUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files && fileInput.files[0]) {
          handleVideoUpload(fileInput.files[0]);
        }
      });
    }

    async function handleVideoUpload(file) {
      // Validate format
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|ogg)$/i)) {
        showToast('Please select a valid video file (.mp4, .webm, .mov, .ogg)', 'error');
        return;
      }

      // Validate size: 50MB
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        showToast(`Video file too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limit is 50MB.`, 'error');
        return;
      }

      if (progressContainer) progressContainer.classList.remove('hidden');
      if (progressBar) progressBar.style.width = '15%';
      if (progressPct) progressPct.textContent = '15%';
      if (progressStatus) progressStatus.textContent = 'Reading video file...';

      try {
        // Read file as base64 DataURL
        const reader = new FileReader();
        reader.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 35);
            if (progressBar) progressBar.style.width = pct + '%';
            if (progressPct) progressPct.textContent = pct + '%';
          }
        };

        const base64Data = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        if (progressBar) progressBar.style.width = '50%';
        if (progressPct) progressPct.textContent = '50%';
        if (progressStatus) progressStatus.textContent = 'Streaming to cloud bucket...';

        const res = await adminFetch('/api/admin/upload-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video: base64Data,
            videoData: base64Data,
            filename: file.name,
            contentType: file.type || 'video/mp4'
          })
        });

        const data = await res.json();
        const videoUrl = data.publicUrl || data.url;
        if (res.ok && data.success && videoUrl) {
          if (progressBar) progressBar.style.width = '100%';
          if (progressPct) progressPct.textContent = '100%';
          if (progressStatus) progressStatus.textContent = 'Upload complete!';

          heroVideoSettings.videoUrl = videoUrl;
          heroVideoSettings.videoEnabled = true;
          if (urlInput) urlInput.value = videoUrl;
          if (enabledCb) enabledCb.checked = true;

          renderHeroVideoUI();
          showToast(`Video successfully uploaded to cloud storage! (${(file.size / (1024 * 1024)).toFixed(1)}MB)`, 'success');

          setTimeout(() => {
            if (progressContainer) progressContainer.classList.add('hidden');
          }, 2500);
        } else {
          showToast(data.message || 'Error uploading video file', 'error');
          if (progressContainer) progressContainer.classList.add('hidden');
        }
      } catch (err) {
        console.error('Video upload error:', err);
        showToast('Network error while uploading video.', 'error');
        if (progressContainer) progressContainer.classList.add('hidden');
      } finally {
        if (fileInput) fileInput.value = '';
      }
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!heroVideoSettings.videoUrl && !urlInput.value) {
          showToast('No video is currently configured.', 'info');
          return;
        }
        if (confirm('Are you sure you want to remove the hero background video? The homepage will revert to the standard ambient background.')) {
          heroVideoSettings.videoUrl = '';
          heroVideoSettings.videoEnabled = false;
          if (urlInput) urlInput.value = '';
          if (enabledCb) enabledCb.checked = false;
          renderHeroVideoUI();
          showToast('Video removed. Remember to click "Save Settings" to publish changes.', 'warning');
        }
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const videoUrl = urlInput ? urlInput.value.trim() : '';
        const videoEnabled = enabledCb ? enabledCb.checked : false;
        const videoOpacity = opacitySlider ? parseFloat(opacitySlider.value) : 0.25;
        const posterUrl = posterInput ? posterInput.value.trim() : '';

        heroVideoSettings = { videoUrl, videoEnabled, videoOpacity, posterUrl };

        if (saveBtn) saveBtn.disabled = true;
        if (saveText) saveText.textContent = 'Saving...';

        try {
          const res = await adminFetch('/api/admin/hero-video', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroVideoSettings)
          });

          const data = await res.json();
          if (res.ok && data.success) {
            showToast('Hero background video settings saved and published!', 'success');
            renderHeroVideoUI();
          } else {
            showToast(data.message || 'Error saving hero video settings.', 'error');
          }
        } catch (err) {
          showToast('Network error saving hero video settings.', 'error');
        } finally {
          if (saveBtn) saveBtn.disabled = false;
          if (saveText) saveText.textContent = 'Save Settings';
        }
      });
    }

    if (previewVideo) {
      previewVideo.addEventListener('loadedmetadata', () => {
        const durSpan = document.getElementById('admin-hero-preview-duration');
        if (durSpan && previewVideo.duration) {
          const m = Math.floor(previewVideo.duration / 60);
          const s = Math.floor(previewVideo.duration % 60);
          durSpan.textContent = `${m}:${s < 10 ? '0' : ''}${s} (${previewVideo.videoWidth}x${previewVideo.videoHeight})`;
        }
      });
    }
  }

  function getStatusConfig(status) {
    const s = (status || 'submitted').toLowerCase();
    const config = {
      submitted: { label: 'Submitted', bg: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300' },
      under_review: { label: 'Under Review', bg: 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300' },
      shortlisted: { label: 'Shortlisted', bg: 'bg-purple-500/15 border-purple-500/30 text-purple-700 dark:text-purple-300' },
      finalist: { label: 'Finalist', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' },
      winner: { label: 'Winner 🏆', bg: 'bg-[#dfa04e]/25 border-[#dfa04e]/50 text-[#865237] dark:text-[#f5d6b4]' },
      accepted: { label: 'Accepted', bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' },
      rejected: { label: 'Not Selected', bg: 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300' }
    };
    return config[s] || config.submitted;
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

  function showToast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/20',
      error: 'bg-red-600 text-white border-red-500 shadow-red-900/20',
      warning: 'bg-amber-500 text-white border-amber-400 shadow-amber-900/20',
      info: 'bg-[#1A0F09] dark:bg-white text-white dark:text-[#1A0F09] border-[#865237]/30 shadow-black/20'
    };
    toast.className = `pointer-events-auto px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 transform translate-y-2 opacity-0 ${colors[type] || colors.info}`;
    toast.innerHTML = `<span>${escapeHtml(msg)}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startAdminDashboard);
} else {
  startAdminDashboard();
}
