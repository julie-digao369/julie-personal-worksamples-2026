// ── Live clock — Shanghai time (GMT+8) ──────────────────────
function updateClock() {
  const now = new Date();
  const shanghai = new Date(
    now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' })
  );
  const h = String(shanghai.getHours()).padStart(2, '0');
  const m = String(shanghai.getMinutes()).padStart(2, '0');
  const s = String(shanghai.getSeconds()).padStart(2, '0');
  const el = document.getElementById('clock');
  if (el) el.textContent = `${h}:${m}:${s} GMT+8`;
}
updateClock();
setInterval(updateClock, 1000);

// ── Mobile nav toggle ────────────────────────────────────────
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

function closeNav() {
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
  navToggle.setAttribute('aria-expanded', false);
  document.body.classList.remove('nav-open');
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open);
    document.body.classList.toggle('nav-open', open);
  });

  // Close when any link is tapped
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close when tapping the scrim
  document.addEventListener('click', (e) => {
    if (!navLinks.classList.contains('open')) return;
    if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
    closeNav();
  });
}

// ── Role / tab selector ──────────────────────────────────────
const tabs          = document.querySelectorAll('.role-tab');
const roleTabsNav   = document.querySelector('.role-tabs');
const projCards     = document.querySelectorAll('.proj-card[data-group]');
const projSection   = document.querySelector('.proj-scroll-section');
const projTrack     = document.querySelector('.proj-scroll-track');
const projListSection = document.querySelector('.proj-list-section');
const projGroups    = document.querySelectorAll('.proj-list-section .projects-group');

let marqueeReady = false;

function setupMarquee() {
  if (marqueeReady) return;
  [...projCards].forEach(card => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    projTrack.appendChild(clone);
  });
  marqueeReady = true;
}

function teardownMarquee() {
  if (!marqueeReady) return;
  projTrack.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove());
  marqueeReady = false;
}

function selectRole(role) {
  tabs.forEach(tab => {
    const isActive = tab.dataset.role === role;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  if (!projSection || !projListSection) return;

  const isMobile = window.innerWidth <= 768;

  if (role === 'all' && !isMobile) {
    projSection.hidden = false;
    projListSection.hidden = true;
    projCards.forEach(card => { card.hidden = false; });
    setupMarquee();
    projSection.classList.add('marquee-active');
  } else {
    projSection.hidden = true;
    projSection.classList.remove('marquee-active');
    teardownMarquee();
    projListSection.hidden = false;
    projGroups.forEach(group => {
      group.hidden = role !== 'all' && group.dataset.group !== role;
    });
  }
}

if (tabs.length) {
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      selectRole(tab.dataset.role);
      sessionStorage.setItem('activeTab', tab.dataset.role);

      // Scroll to the first card of the selected category
      setTimeout(() => {
        const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
        const filterH = document.querySelector('.filter-bar')?.offsetHeight || 44;
        const offset = navH + filterH + 16;
        const role = tab.dataset.role;
        const isMobile = window.innerWidth <= 768;

        let target;
        if (role === 'all' && !isMobile) {
          target = document.getElementById('projects');
        } else if (role === 'all') {
          target = document.querySelector('.proj-list-section .projects-group .proj-row');
        } else {
          target = document.querySelector(`#panel-${role} .proj-row`);
        }

        if (target) {
          const top = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      }, 50);
    });
  });
}

// Keyboard navigation — arrow keys
if (roleTabsNav) {
  roleTabsNav.addEventListener('keydown', e => {
    const tabsArray = Array.from(tabs);
    const currentIndex = tabsArray.findIndex(t => t.getAttribute('aria-selected') === 'true');
    let next;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = tabsArray[(currentIndex + 1) % tabsArray.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = tabsArray[(currentIndex - 1 + tabsArray.length) % tabsArray.length];
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = tabsArray[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      next = tabsArray[tabsArray.length - 1];
    }

    if (next) {
      selectRole(next.dataset.role);
      next.focus();
    }
  });
}

// Restore last active tab
const savedTab = sessionStorage.getItem('activeTab');
selectRole(savedTab || 'all');

// ── Scroll-based fade-in animations ─────────────────────────

// ── Scrolled nav (transparent → white) ──────────────────────
const siteNav = document.querySelector('.site-nav');
if (siteNav) {
  const syncNav = () => siteNav.classList.toggle('scrolled', window.scrollY > 20);
  syncNav();
  window.addEventListener('scroll', syncNav, { passive: true });
}

// ── Filter bar scroll shadow ─────────────────────────────────
const filterBar = document.querySelector('.filter-bar');
if (filterBar) {
  window.addEventListener('scroll', () => {
    filterBar.classList.toggle('scrolled', window.scrollY > 100);
  }, { passive: true });
}

const fadeEls = document.querySelectorAll('.fade-in');

if ('IntersectionObserver' in window) {
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  fadeEls.forEach(el => fadeObserver.observe(el));
}

// ── Staggered card reveal ────────────────────────────────────
const cards = document.querySelectorAll('.card');
if (cards.length && 'IntersectionObserver' in window) {
  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    card.style.transition = 'opacity 0.6s cubic-bezier(.22,1,.36,1), transform 0.6s cubic-bezier(.22,1,.36,1)';
  });

  const cardObserver = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    visible.forEach((entry, i) => {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 80);
      cardObserver.unobserve(entry.target);
    });
  }, { threshold: 0.08 });

  cards.forEach(card => cardObserver.observe(card));
}

// ── Smooth page transitions ──────────────────────────────────
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (!link) return;

  const href = link.getAttribute('href');
  if (!href) return;
  if (link.target === '_blank') return;
  if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) return;

  e.preventDefault();
  document.body.classList.add('page-exit');
  setTimeout(() => { window.location.href = href; }, 300);
});

window.addEventListener('pageshow', () => {
  document.body.classList.remove('page-exit');
});

// ── NDA modal ────────────────────────────────────────────────
const ndaModal      = document.getElementById('nda-modal');
const ndaModalTitle = document.getElementById('nda-modal-title');
const ndaModalBody  = document.getElementById('nda-modal-body');
const ndaClose      = ndaModal && ndaModal.querySelector('.nda-modal-close');
const ndaBackdrop   = ndaModal && ndaModal.querySelector('.nda-modal-backdrop');

function openNdaModal(title, body) {
  ndaModalTitle.textContent = title;
  ndaModalBody.textContent  = body;
  ndaModal.hidden = false;
  document.body.style.overflow = 'hidden';
  ndaClose.focus();
}

function closeNdaModal() {
  ndaModal.hidden = true;
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  const card = e.target.closest('.card--nda');
  if (!card) return;
  openNdaModal(card.dataset.modalTitle, card.dataset.modalBody);
});

document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = document.activeElement && document.activeElement.closest('.card--nda');
  if (!card) return;
  e.preventDefault();
  openNdaModal(card.dataset.modalTitle, card.dataset.modalBody);
});

if (ndaClose)    ndaClose.addEventListener('click', closeNdaModal);
if (ndaBackdrop) ndaBackdrop.addEventListener('click', closeNdaModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ndaModal && !ndaModal.hidden) closeNdaModal();
});
