// public/js/admin-dashboard.js - Central Admin Operations Controller
// The ADABAH Startup Challenge 2026

function startAdminDashboard() {
  let allApplications = [];
  let allTeams = [];
  let allBlogs = [];
  let allBroadcasts = [];
  let summaryData = null;
  let activeModalApp = null;

  // DOM Elements
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  const mobileToggleBtn = document.getElementById('admin-mobile-toggle');
  const mobileCloseBtn = document.getElementById('admin-sidebar-close');
  const mobilePageTitle = document.getElementById('mobile-page-title');

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

  // Initialize
  init();

  async function init() {
    setupNavigation();
    setupModals();
    setupBroadcastInteractions();
    setupBlogControls();
    setupSubmissionsFilters();
    setupTeamsFilters();

    // Load initial data
    await loadInitialData();

    // Check URL hash or query for initial tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab') || (window.location.hash ? window.location.hash.replace('#', '') : 'overview');
    switchAdminPage(tabParam, false);
  }

  // Load All Core Data from APIs
  async function loadInitialData() {
    try {
      await Promise.allSettled([
        loadSummaryData(),
        loadApplicationsData(),
        loadTeamsData(),
        loadBlogsData(),
        loadBroadcastsData()
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
    const validPages = ['overview', 'submissions', 'teams', 'blogs', 'broadcast'];
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
      broadcast: 'SMS Broadcast'
    };
    if (mobilePageTitle) {
      mobilePageTitle.textContent = titles[pageId] || 'Overview';
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
      const res = await fetch('/api/admin/summary');
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
      const res = await fetch('/api/applications');
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
      const res = await fetch('/api/admin/teams');
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
          (t.leadFounder && t.leadFounder.name && t.leadFounder.name.toLowerCase().includes(q)) ||
          (t.appId && t.appId.toLowerCase().includes(q)) ||
          (t.members && t.members.some(m => m.name && m.name.toLowerCase().includes(q)))
        );
        renderTeamsCards(filtered);
      });
    }
  }

  function renderTeamsCards(teams) {
    const grid = document.getElementById('teams-cards-grid');
    if (!grid) return;

    if (teams.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-8 text-center text-[#5C3D2E]/60">No teams found.</div>`;
      return;
    }

    grid.innerHTML = teams.map(team => {
      const statusConfig = getStatusConfig(team.status);
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
      const res = await fetch('/api/blogs?all=true');
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

  function setupBlogControls() {
    if (openCreateBlogBtn) {
      openCreateBlogBtn.addEventListener('click', () => {
        blogForm.reset();
        document.getElementById('blog-edit-id').value = '';
        document.getElementById('blog-modal-title').textContent = 'Write New Story / Announcement';
        document.getElementById('blog-published-input').checked = true;
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
    const coverImage = document.getElementById('blog-cover-input').value.trim();
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

      const res = await fetch(url, {
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
    document.getElementById('blog-cover-input').value = blog.coverImage || '';
    document.getElementById('blog-excerpt-input').value = blog.excerpt || '';
    document.getElementById('blog-content-input').value = blog.content || '';
    document.getElementById('blog-published-input').checked = blog.published !== false;

    document.getElementById('blog-modal-title').textContent = 'Edit Story / Article';
    blogModal.classList.remove('hidden');
  };

  window.deleteBlogArticle = async function(id) {
    if (!confirm('Are you sure you want to permanently delete this article?')) return;

    try {
      const res = await fetch(`/api/blogs/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
      const res = await fetch('/api/admin/broadcast-sms', {
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
      const res = await fetch('/api/admin/broadcasts');
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
      const res = await fetch(`/api/applications/${encodeURIComponent(activeModalApp.id)}/status`, {
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
