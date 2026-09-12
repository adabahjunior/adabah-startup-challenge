// public/js/founder.js - Dynamic About Founder Page Controller
// The ADABAH Startup Challenge 2026

document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle Controller
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('adabah_theme', isDark ? 'dark' : 'light');
      } catch (e) {}
    });
  });

  // Mobile Menu Controller
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Fetch and populate dynamic founder content from API
  async function loadFounderProfile() {
    try {
      const res = await fetch('/api/content/founder');
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      const f = json.data;

      // Text Fields
      const nameEl = document.getElementById('founder-name');
      const titleEl = document.getElementById('founder-title');
      const taglineEl = document.getElementById('founder-tagline');
      const visionEl = document.getElementById('founder-vision');
      const bioEl = document.getElementById('founder-bio');
      const messageEl = document.getElementById('founder-message');
      const photoCaptionEl = document.getElementById('founder-photo-caption');

      if (nameEl && f.name) nameEl.textContent = f.name;
      if (titleEl && f.title) titleEl.textContent = f.title;
      if (taglineEl && f.tagline) taglineEl.textContent = f.tagline;
      if (visionEl && f.vision) visionEl.textContent = `"${f.vision.replace(/^"|"$/g, '')}"`;
      if (bioEl && f.bio) bioEl.textContent = f.bio;
      if (messageEl && f.message) messageEl.textContent = f.message.startsWith('"') ? f.message : `"${f.message}"`;
      if (photoCaptionEl && f.name) photoCaptionEl.textContent = f.name;

      // Photo
      const photoEl = document.getElementById('founder-photo');
      const avatarEl = document.getElementById('founder-message-avatar');
      if (photoEl && f.photo) photoEl.src = f.photo;
      if (avatarEl && f.photo) avatarEl.src = f.photo;

      // Social Links
      if (f.socials) {
        const linkIn = document.getElementById('founder-social-linkedin');
        const twitter = document.getElementById('founder-social-twitter');
        const insta = document.getElementById('founder-social-instagram');
        const email = document.getElementById('founder-social-email');

        if (linkIn && f.socials.linkedin) linkIn.href = f.socials.linkedin;
        if (twitter && f.socials.twitter) twitter.href = f.socials.twitter;
        if (insta && f.socials.instagram) insta.href = f.socials.instagram;
        if (email && f.socials.email) email.href = `mailto:${f.socials.email}`;
      }

      // Highlights / Metrics
      if (Array.isArray(f.highlights) && f.highlights.length > 0) {
        const container = document.getElementById('founder-highlights');
        if (container) {
          container.innerHTML = f.highlights.map(h => `
            <div class="space-y-1">
              <div class="font-display font-black text-2xl sm:text-3xl text-[#865237] dark:text-[#dfa04e]">
                ${escapeHtml(h.metric || '')}
              </div>
              <div class="text-[11px] sm:text-xs text-[#5C3D2E] dark:text-[#f5d6b4]/70 font-semibold">
                ${escapeHtml(h.label || '')}
              </div>
            </div>
          `).join('');
        }
      }
    } catch (err) {
      console.warn('Using pre-rendered founder profile:', err);
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

  loadFounderProfile();
});
