// admin.js - Judge & Committee Review Dashboard

let currentApplications = [];
let activeReviewApp = null;

window.openAdminModal = function () {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  loadAdminData();
};

window.closeAdminModal = function () {
  const modal = document.getElementById('admin-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
};

async function loadAdminData() {
  const search = document.getElementById('admin-search')?.value.trim() || '';
  const track = document.getElementById('admin-track-filter')?.value || 'all';
  const status = document.getElementById('admin-status-filter')?.value || 'all';

  const params = new URLSearchParams();
  if (track !== 'all') params.append('track', track);
  if (status !== 'all') params.append('status', status);
  if (search) params.append('search', search);

  try {
    const statsRes = await fetch('/api/stats');
    const statsData = await statsRes.json();
    if (statsData.success) {
      updateAdminStats(statsData.data);
    }

    const appsRes = await fetch(`/api/applications?${params.toString()}`);
    const appsData = await appsRes.json();
    if (appsData.success) {
      currentApplications = appsData.data;
      renderAdminTable(currentApplications);
    }
  } catch (err) {
    showToast('Error loading reviewer dashboard data', 'error');
  }
}

function updateAdminStats(stats) {
  const totalEl = document.getElementById('admin-total-count');
  const reviewEl = document.getElementById('admin-review-count');
  const shortEl = document.getElementById('admin-shortlisted-count');
  const finalEl = document.getElementById('admin-finalist-count');

  if (totalEl) totalEl.innerText = stats.totalApplications || 0;
  if (reviewEl) reviewEl.innerText = stats.statusCounts?.under_review || 0;
  if (shortEl) shortEl.innerText = stats.statusCounts?.shortlisted || 0;
  if (finalEl) finalEl.innerText = stats.statusCounts?.finalist || 0;
}

function renderAdminTable(apps) {
  const tbody = document.getElementById('admin-table-body');
  if (!tbody) return;

  if (apps.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="py-8 text-center text-[#f5d6b4]/50">
          No applications match the selected filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = apps.map(app => {
    const dateFormatted = new Date(app.submittedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `
      <tr class="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-[#865237]/15 dark:border-[#f5d6b4]/10">
        <td class="py-3 px-3">
          <span class="font-mono text-[#6B3410] dark:text-[#f5d6b4] font-black block">${app.id}</span>
          <span class="text-[10px] text-[#5C3D2E] dark:text-[#f5d6b4]/70 font-medium">${dateFormatted}</span>
        </td>
        <td class="py-3 px-3">
          <div class="font-bold text-[#1A0F09] dark:text-white">${escapeHtml(app.startupName)}</div>
          <div class="text-[11px] text-[#5C3D2E] dark:text-[#f5d6b4]/70">${escapeHtml(app.founderName)} • ${escapeHtml(app.country)}</div>
        </td>
        <td class="py-3 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F4EDE4] text-[#6B3410] dark:bg-[#865237]/40 dark:text-[#f5d6b4] uppercase border border-[#865237]/25 dark:border-[#f5d6b4]/20">${app.track}</span>
        </td>
        <td class="py-3 px-3 font-semibold uppercase text-[10px] text-[#5C3D2E] dark:text-[#f5d6b4]/70">
          ${app.stage}
        </td>
        <td class="py-3 px-3 font-mono font-black ${app.score ? 'text-[#8F4C15] dark:text-[#dfa04e]' : 'text-[#5C3D2E] dark:text-stone-400'}">
          ${app.score ? `${app.score}/100` : '—'}
        </td>
        <td class="py-3 px-3">
          <span class="status-badge status-${app.status}">${app.status.replace('_', ' ')}</span>
        </td>
        <td class="py-3 px-3 text-right">
          <button class="px-3 py-1 rounded-lg btn-adabah-primary font-bold text-xs shadow-sm cursor-pointer" onclick="openDetailModal('${app.id}')">
            Review →
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openDetailModal = function (appId) {
  const app = currentApplications.find(a => a.id === appId);
  if (!app) return;
  activeReviewApp = app;

  const modal = document.getElementById('admin-detail-modal');
  const title = document.getElementById('detail-modal-title');
  const body = document.getElementById('detail-modal-body');
  const statusSelect = document.getElementById('detail-status-select');

  if (title) title.innerText = `${app.startupName} (${app.id})`;
  if (statusSelect) statusSelect.value = app.status;

  if (body) {
    body.innerHTML = `
      <div class="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#120904] border border-[#865237]/20 dark:border-[#f5d6b4]/15 space-y-3">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-[#865237]/15 dark:border-[#f5d6b4]/15 pb-3">
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Track:</span>
            <span class="font-bold text-[#8F4C15] dark:text-[#dfa04e] uppercase">${app.track}</span>
          </div>
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Stage:</span>
            <span class="font-bold text-[#1A0F09] dark:text-white uppercase">${app.stage}</span>
          </div>
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Team Size:</span>
            <span class="font-bold text-[#1A0F09] dark:text-white">${app.teamSize} members</span>
          </div>
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Lead Founder:</span>
            <span class="font-bold text-[#1A0F09] dark:text-white">${escapeHtml(app.founderName)}</span>
          </div>
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Contact:</span>
            <span class="text-[#6B3410] dark:text-[#f5d6b4] font-mono font-bold">${escapeHtml(app.founderEmail)}</span>
          </div>
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-semibold text-[11px]">Phone:</span>
            <span class="text-[#6B3410] dark:text-[#f5d6b4] font-mono font-bold">${escapeHtml(app.founderPhone)}</span>
          </div>
        </div>

        <div>
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-bold mb-0.5 text-[11px]">Tagline:</span>
          <p class="text-[#1A0F09] dark:text-white font-medium">${escapeHtml(app.tagline || 'N/A')}</p>
        </div>

        <div>
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-bold mb-0.5 text-[11px]">Problem Statement:</span>
          <p class="text-[#3B2215] dark:text-[#f5d6b4]/90 leading-relaxed font-normal">${escapeHtml(app.problem)}</p>
        </div>

        <div>
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-bold mb-0.5 text-[11px]">Solution & Approach:</span>
          <p class="text-[#3B2215] dark:text-[#f5d6b4]/90 leading-relaxed font-normal">${escapeHtml(app.solution)}</p>
        </div>

        <div>
          <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block font-bold mb-0.5 text-[11px]">Traction & Metrics:</span>
          <p class="text-[#3B2215] dark:text-[#f5d6b4]/90 leading-relaxed font-normal">${escapeHtml(app.traction || 'Not provided')}</p>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block text-[11px] font-semibold">Pitch Deck:</span>
            ${app.deckUrl ? `<a href="${escapeHtml(app.deckUrl)}" target="_blank" class="text-[#8F4C15] dark:text-[#dfa04e] underline font-bold">Open Deck Link ↗</a>` : '<span class="text-[#5C3D2E] dark:text-stone-400 font-semibold">None</span>'}
          </div>
          <div>
            <span class="text-[#5C3D2E] dark:text-[#f5d6b4]/70 block text-[11px] font-semibold">Demo Video:</span>
            ${app.videoUrl ? `<a href="${escapeHtml(app.videoUrl)}" target="_blank" class="text-[#8F4C15] dark:text-[#dfa04e] underline font-bold">Watch Video ↗</a>` : '<span class="text-[#5C3D2E] dark:text-stone-400 font-semibold">None</span>'}
          </div>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[#1A0F09] dark:text-[#f5d6b4] font-bold mb-1">Assign Committee Score (0-100):</label>
            <input type="number" id="detail-score-input" min="0" max="100" class="w-full font-mono font-bold" value="${app.score || ''}" placeholder="e.g. 92" />
          </div>
          <div>
            <label class="block text-[#1A0F09] dark:text-[#f5d6b4] font-bold mb-1">Funding History:</label>
            <input type="text" class="w-full opacity-80" value="${escapeHtml(app.fundingRaised || 'Bootstrapped')}" disabled />
          </div>
        </div>

        <div>
          <label class="block text-[#1A0F09] dark:text-[#f5d6b4] font-bold mb-1">Review Committee Notes:</label>
          <textarea id="detail-notes-input" rows="2" class="w-full" placeholder="Notes explaining the score, website eligibility, or advancement...">${escapeHtml(app.statusNotes || '')}</textarea>
        </div>
      </div>
    `;
  }

  modal.classList.remove('hidden');
};

function closeDetailModal() {
  const modal = document.getElementById('admin-detail-modal');
  if (modal) modal.classList.add('hidden');
  activeReviewApp = null;
}

// Initialize Admin Portal Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const openBtns = document.querySelectorAll('#open-admin-btn, #mobile-admin-btn, #footer-admin-btn');
  const closeBtn = document.getElementById('close-admin-modal-btn');
  const refreshBtn = document.getElementById('admin-refresh-btn');
  const exportBtn = document.getElementById('admin-export-csv');
  const searchInput = document.getElementById('admin-search');
  const trackFilter = document.getElementById('admin-track-filter');
  const statusFilter = document.getElementById('admin-status-filter');
  const closeDetailBtn = document.getElementById('close-detail-modal-btn');
  const saveStatusBtn = document.getElementById('save-status-btn');

  openBtns.forEach(b => b.addEventListener('click', window.openAdminModal));
  if (closeBtn) closeBtn.addEventListener('click', window.closeAdminModal);
  if (refreshBtn) refreshBtn.addEventListener('click', loadAdminData);

  if (searchInput) searchInput.addEventListener('input', debounce(loadAdminData, 300));
  if (trackFilter) trackFilter.addEventListener('change', loadAdminData);
  if (statusFilter) statusFilter.addEventListener('change', loadAdminData);

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.location.href = '/api/export?format=csv';
    });
  }

  if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetailModal);

  if (saveStatusBtn) {
    saveStatusBtn.addEventListener('click', async () => {
      if (!activeReviewApp) return;

      const newStatus = document.getElementById('detail-status-select').value;
      const newScore = document.getElementById('detail-score-input').value;
      const newNotes = document.getElementById('detail-notes-input').value;

      try {
        const res = await fetch(`/api/applications/${activeReviewApp.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            score: newScore ? Number(newScore) : null,
            statusNotes: newNotes
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          showToast(`Application ${activeReviewApp.id} updated!`, 'success');
          closeDetailModal();
          loadAdminData();
        } else {
          showToast(data.message || 'Failed to update status', 'error');
        }
      } catch (err) {
        showToast('Network error while updating application', 'error');
      }
    });
  }
});

function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}
