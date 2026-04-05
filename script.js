/* ============================================================
   SAINT-ROCH-ÉVÉNEMENTS — script.js
   ============================================================
   Ce fichier gère tous les comportements interactifs du site.

   SOMMAIRE :
   1. VIDÉO HERO  — lecteur YouTube en arrière-plan (API IFrame)
   2. NAVIGATION  — barre qui change de couleur au scroll + menu mobile
   3. LIGHTBOX    — affichage des photos en grand (galerie + clic)
   4. MODALES     — détails des formules traiteur
   ============================================================ */


/* ─────────────────────────────────────────
   1. VIDÉO HERO — YouTube IFrame API
   • window.onYouTubeIframeAPIReady doit être
     défini AVANT l'injection du script YouTube
   • onReady force mute() + playVideo() pour
     contourner les restrictions d'autoplay
───────────────────────────────────────── */

// 1a — Callback global appelé par YouTube quand l'API est prête
window.onYouTubeIframeAPIReady = function () {
    new YT.Player('hero-yt', {
        videoId: 'Hm-bGGTaZ04',
        playerVars: {
            autoplay:       1,
            mute:           1,
            loop:           1,
            playlist:       'Hm-bGGTaZ04',
            controls:       0,
            showinfo:       0,
            rel:            0,
            iv_load_policy: 3,
            modestbranding: 1,
            disablekb:      1,
            playsinline:    1,
            enablejsapi:    1
        },
        events: {
            onReady: function (e) {
                e.target.mute();
                e.target.playVideo();
            }
        }
    });
};

// Note : le script YouTube IFrame API est chargé dans le <head> de index.html

// Force le retour en haut de page à chaque chargement (évite que le téléphone
// mémorise la position de défilement de la visite précédente)
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual'; // désactive la restauration automatique du navigateur
}
window.scrollTo(0, 0);
// iOS Safari peut ignorer scrollTo synchrone — on le redéclenche au chargement complet
window.addEventListener('load', function () { window.scrollTo(0, 0); });


/* ─────────────────────────────────────────
   FORMULAIRE DE RÉSERVATION
   - Sur OVH : envoi réel via send.php
   - Sur GitHub Pages : message d'info
   - Affiche confirmation ou erreur selon ?merci=1 / ?erreur=...
───────────────────────────────────────── */
(function () {
    const params = new URLSearchParams(window.location.search);

    // Après redirection de send.php → affiche le bon message
    if (params.get('merci') === '1') {
        const el = document.getElementById('form-merci');
        if (el) {
            el.style.display = 'block';
            document.getElementById('reservation-form').style.display = 'none';
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        }
        // Nettoie l'URL
        history.replaceState(null, '', window.location.pathname + '#contact');
    }
    if (params.get('erreur')) {
        const el = document.getElementById('form-erreur');
        if (el) {
            el.style.display = 'block';
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        }
        history.replaceState(null, '', window.location.pathname + '#contact');
    }

    // Sur GitHub Pages : le PHP ne tourne pas → on bloque l'envoi et on informe
    const form = document.getElementById('reservation-form');
    if (form && window.location.hostname.includes('github.io')) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            alert('Le formulaire sera actif une fois le site hébergé sur OVH.\n\nEn attendant, contactez-nous directement :\n📞 07 68 37 16 64\n✉️ contact@saint-roch-evenements.fr');
        });
    }
})();


/* ─────────────────────────────────────────
   2. NAVIGATION
   - Fond qui s'assombrit quand on scrolle
   - Bouton hamburger pour mobile
───────────────────────────────────────── */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 80);
});

// Menu mobile : ouverture / fermeture
document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
});

// Fermer le menu en cliquant sur un lien
document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
        document.getElementById('navLinks').classList.remove('open');
    });
});


/* ─────────────────────────────────────────
   3. LIGHTBOX
   - Cliquer sur une photo l'affiche en grand
   - Flèches gauche/droite uniquement dans le même groupe
   - Swipe gauche/droite sur mobile
   - Touche Échap ou clic dehors pour fermer
───────────────────────────────────────── */

// Sélecteurs CSS par groupe de photos
const groupSelectors = {
    salle:     '.salle-gallery img',
    couchages: '.couch-photo-wrap img',
    galerie:   '.galerie-item img'
};

// Chaque entrée = { src, alt }
let currentImages = [];
let currentIndex  = 0;

function openLightbox(src, group) {
    const selector = groupSelectors[group] || '.galerie-item img, .salle-gallery img, .couch-photo-wrap img';
    currentImages = Array.from(document.querySelectorAll(selector))
        .map(i => ({ src: i.src, alt: i.alt || '' }));

    currentIndex = currentImages.findIndex(i => i.src === src || i.src.endsWith(src.replace(/^.*\//, '/')));
    if (currentIndex === -1) currentIndex = 0;

    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
    updateLightbox();
}

function updateLightbox() {
    const item = currentImages[currentIndex];
    document.getElementById('lightbox-img').src  = item.src;
    document.getElementById('lightbox-img').alt  = item.alt;
    document.getElementById('lightbox-caption').textContent = item.alt;
    document.getElementById('lightbox-counter').textContent =
        currentImages.length > 1 ? `${currentIndex + 1} / ${currentImages.length}` : '';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
}

function moveLightbox(dir) {
    currentIndex = (currentIndex + dir + currentImages.length) % currentImages.length;
    updateLightbox();
}

// Navigation clavier
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeLightbox();
        closeModal();
    }
    if (e.key === 'ArrowRight') moveLightbox(1);
    if (e.key === 'ArrowLeft')  moveLightbox(-1);
});

// Swipe gauche/droite dans le lightbox (mobile)
(function () {
    let lbStartX = 0, lbStartY = 0;
    const lb = document.getElementById('lightbox');
    lb.addEventListener('touchstart', e => {
        lbStartX = e.touches[0].clientX;
        lbStartY = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - lbStartX;
        const dy = Math.abs(e.changedTouches[0].clientY - lbStartY);
        if (Math.abs(dx) > 50 && dy < 80) moveLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });
})();


/* ─────────────────────────────────────────
   4. MODALES TRAITEUR + TARIFS
   - Groupes de modales : navigation swipe/flèches entre elles
   - openModal(id)  : ouvre la modale ciblée
   - closeModal()   : ferme toutes les modales
   - moveModal(dir) : passe à la modale suivante/précédente du groupe
   - Swipe gauche/droite sur mobile
   - Flèches ‹ › injectées automatiquement
───────────────────────────────────────── */

// Groupes de modales navigables
const MODAL_GROUPS = {
    traiteur: ['modal-vin','modal-champetre','modal-tradition','modal-brasero','modal-brunch','modal-affineur'],
    tarifs:   ['modal-tarif-jour','modal-tarif-2j','modal-tarif-we']
};

let currentModalId = null;

function _getModalGroup(id) {
    for (const ids of Object.values(MODAL_GROUPS)) {
        if (ids.includes(id)) return ids;
    }
    return null;
}

function openModal(id) {
    closeModal();
    const modal = document.getElementById(id);
    if (!modal) return;
    currentModalId = id;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // Mettre à jour la visibilité des flèches
    const group = _getModalGroup(id);
    const idx   = group ? group.indexOf(id) : -1;
    const prev  = modal.querySelector('.modal-nav-prev');
    const next  = modal.querySelector('.modal-nav-next');
    if (prev) prev.style.opacity = (group && idx > 0)                   ? '1' : '0';
    if (next) next.style.opacity = (group && idx < group.length - 1)    ? '1' : '0';
    // Indicateur de position (points)
    const dots = modal.querySelectorAll('.modal-dot');
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

function closeModal() {
    document.querySelectorAll('.tr-modal.open').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
    currentModalId = null;
}

function closeModalOutside(event) {
    if (event.target.classList.contains('tr-modal')) closeModal();
}

function moveModal(dir) {
    if (!currentModalId) return;
    const group = _getModalGroup(currentModalId);
    if (!group) return;
    const newIdx = group.indexOf(currentModalId) + dir;
    if (newIdx >= 0 && newIdx < group.length) openModal(group[newIdx]);
}

// Injection automatique : flèches + points + swipe dans chaque modale
(function () {
    document.querySelectorAll('.tr-modal').forEach(modal => {
        const id    = modal.id;
        const group = _getModalGroup(id);
        const idx   = group ? group.indexOf(id) : -1;

        // ── Flèches ‹ ›
        ['prev','next'].forEach(dir => {
            const btn = document.createElement('button');
            btn.className  = `modal-nav-btn modal-nav-${dir}`;
            btn.innerHTML  = dir === 'prev' ? '‹' : '›';
            btn.setAttribute('aria-label', dir === 'prev' ? 'Précédent' : 'Suivant');
            btn.style.opacity = '0'; // sera mis à jour par openModal
            btn.onclick = e => { e.stopPropagation(); moveModal(dir === 'prev' ? -1 : 1); };
            modal.appendChild(btn);
        });

        // ── Points de navigation (dots)
        if (group && group.length > 1) {
            const bar = document.createElement('div');
            bar.className = 'modal-dots';
            group.forEach((_, i) => {
                const d = document.createElement('span');
                d.className = 'modal-dot' + (i === idx ? ' active' : '');
                bar.appendChild(d);
            });
            // Insérer les dots dans la boîte modale (en bas)
            const box = modal.querySelector('.tr-modal-inner, .tarif-modal-box');
            if (box) box.appendChild(bar);
        }

        // ── Swipe touch sur la boîte (pas l'overlay pour ne pas déclencher la fermeture)
        const box = modal.querySelector('.tr-modal-inner, .tarif-modal-box');
        if (box) {
            let swX = 0, swY = 0;
            box.addEventListener('touchstart', e => {
                swX = e.touches[0].clientX;
                swY = e.touches[0].clientY;
            }, { passive: true });
            box.addEventListener('touchend', e => {
                const dx = e.changedTouches[0].clientX - swX;
                const dy = Math.abs(e.changedTouches[0].clientY - swY);
                if (Math.abs(dx) > 50 && dy < 100) moveModal(dx < 0 ? 1 : -1);
            }, { passive: true });
        }
    });
})();


/* ─────────────────────────────────────────
   5. CARROUSEL COUCHAGES — flèches + swipe
───────────────────────────────────────── */
(function () {
    var grid = document.getElementById('couch-grid');
    if (!grid) return;
    function cardWidth() {
        var card = grid.querySelector('.tr-card');
        return card ? card.offsetWidth + parseInt(getComputedStyle(grid).gap || 16) : 300;
    }
    document.querySelector('.couch-arrow-prev').addEventListener('click', function () {
        grid.scrollBy({ left: -cardWidth(), behavior: 'smooth' });
    });
    document.querySelector('.couch-arrow-next').addEventListener('click', function () {
        grid.scrollBy({ left: cardWidth(), behavior: 'smooth' });
    });
})();


/* ─────────────────────────────────────────
   6. SCROLL REVEAL — fondu doux à l'entrée dans le viewport
───────────────────────────────────────── */
(function () {
    if (!('IntersectionObserver' in window)) return; // vieux navigateurs : pas d'animation

    // Éléments qui apparaissent en fondu
    const singleSelectors = [
        '#lieu .lieu-text',
        '#lieu .lieu-photo',
        '#salle .cap-banner',
        '#salle .salle-gallery',
        '#salle .options-note',
        '#couchages .couch-total',
        '#traiteur .traiteur-intro',
        '#traiteur .tr-note',
        '.tarif-info-grid .tib',
        '#temoignages .temo-cta',
        '#disponibilites .dispo-wrap',
        '#disponibilites .dispo-note',
        '.contact-info',
        '.contact-form',
        '.map-wrap',
        '.event-band',
    ];

    // Grilles de cartes avec cascade de délais
    const gridSelectors = [
        { parent: '.equip-grid',     child: '.equip-card' },
        { parent: '.couch-photos',   child: '.couch-photo-wrap' },
        { parent: '.tarif-info-grid',child: '.tib' },
        { parent: '.temo-grid',      child: '.temo-card' },
        { parent: '.salle-gallery',  child: 'img' },
    ];

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    // Appliquer aux éléments individuels
    singleSelectors.forEach(function (sel) {
        document.querySelectorAll(sel).forEach(function (el) {
            el.classList.add('reveal');
            observer.observe(el);
        });
    });

    // Appliquer avec cascade aux grilles
    gridSelectors.forEach(function (cfg) {
        document.querySelectorAll(cfg.parent).forEach(function (grid) {
            grid.querySelectorAll(cfg.child).forEach(function (card, i) {
                card.classList.add('reveal', 'reveal-delay-' + Math.min(i + 1, 5));
                observer.observe(card);
            });
        });
    });

    // Section titles + subtitles
    document.querySelectorAll('.section-title, .section-subtitle, .divider').forEach(function (el) {
        el.classList.add('reveal');
        observer.observe(el);
    });
})();


/* ─────────────────────────────────────────
   7. SLIDER TÉMOIGNAGES
   1 témoignage visible à la fois, flèches + points + swipe
───────────────────────────────────────── */
(function () {
    const cards = Array.from(document.querySelectorAll('.temo-card'));
    if (cards.length < 2) return;

    let current = 0;
    cards[0].classList.add('temo-active');

    function show(idx, fromLeft) {
        cards[current].classList.remove('temo-active', 'temo-from-left');
        current = ((idx % cards.length) + cards.length) % cards.length;
        cards[current].classList.toggle('temo-from-left', !!fromLeft);
        cards[current].classList.add('temo-active');
        document.querySelectorAll('.temo-dot').forEach(function (d, i) {
            d.classList.toggle('active', i === current);
        });
    }

    // Créer la navigation (flèches + points)
    const nav = document.createElement('div');
    nav.className = 'temo-nav';

    const prev = document.createElement('button');
    prev.className = 'temo-nav-btn'; prev.innerHTML = '‹'; prev.setAttribute('aria-label', 'Précédent');
    prev.addEventListener('click', function () { show(current - 1, true); });

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'temo-dots';
    cards.forEach(function (_, i) {
        const dot = document.createElement('span');
        dot.className = 'temo-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', function () { show(i, i < current); });
        dotsWrap.appendChild(dot);
    });

    const next = document.createElement('button');
    next.className = 'temo-nav-btn'; next.innerHTML = '›'; next.setAttribute('aria-label', 'Suivant');
    next.addEventListener('click', function () { show(current + 1, false); });

    nav.appendChild(prev); nav.appendChild(dotsWrap); nav.appendChild(next);

    // Insérer avant .temo-cta
    const cta = document.querySelector('.temo-cta');
    cta.parentNode.insertBefore(nav, cta);

    // Swipe tactile
    let swX = 0;
    const grid = document.querySelector('.temo-grid');
    grid.addEventListener('touchstart', function (e) { swX = e.touches[0].clientX; }, { passive: true });
    grid.addEventListener('touchend', function (e) {
        const dx = e.changedTouches[0].clientX - swX;
        if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1), dx > 0);
    }, { passive: true });
})();


/* ─────────────────────────────────────────
   7. CALENDRIER DES DISPONIBILITÉS
   Les dates sont lues depuis disponibilites.json
   Modifiables via /gestion-agenda.html
───────────────────────────────────────── */
(function () {
    const today    = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    let offset = 0;
    let takenSet  = new Set();
    let optionSet = new Set();
    let giteSet   = new Set();
    const JOURS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

    function pad(n) { return String(n).padStart(2, '0'); }

    function renderMonth(year, month) {
        const firstDay    = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        let startDow = firstDay.getDay() - 1;
        if (startDow < 0) startDow = 6;
        const title = firstDay.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        let html = `<div class="dispo-month">
            <div class="dispo-month-title">${title}</div>
            <div class="dispo-grid">`;
        JOURS.forEach(j => { html += `<div class="dispo-dow">${j}</div>`; });
        for (let i = 0; i < startDow; i++) html += `<div class="dispo-day empty"></div>`;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            let cls = 'dispo-day';
            if (dateStr < todayStr)         cls += ' past';
            else if (takenSet.has(dateStr) || optionSet.has(dateStr)) {
                cls += giteSet.has(dateStr) ? ' gite' : ' taken';
            }
            else                            cls += ' free';
            if (dateStr === todayStr) cls += ' today';
            html += `<div class="${cls}">${d}</div>`;
        }
        html += `</div></div>`;
        return html;
    }

    function render() {
        const container = document.getElementById('dispoMonths');
        if (!container) return;
        let html = '';
        for (let i = 0; i < 3; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() + offset + i, 1);
            html += renderMonth(d.getFullYear(), d.getMonth());
        }
        container.innerHTML = html;
    }

    // Charger les dates via l'API GitHub (pas de cache CDN, mise à jour instantanée)
    const _API_URL = 'https://api.github.com/repos/SAYVIOU/saint-roch-evenements/contents/disponibilites.json';
    fetch(_API_URL + '?t=' + Date.now(), {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        cache: 'no-store'
    })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
            if (data && data.content) {
                const _r = atob(data.content.replace(/\n/g,''));
                return JSON.parse(new TextDecoder().decode(Uint8Array.from(_r, c => c.charCodeAt(0))));
            }
            return fetch('disponibilites.json?t=' + Date.now()).then(r2 => r2.json());
        })
        .then(data => {
            takenSet  = new Set(data.taken  || []);
            optionSet = new Set(data.option || []);
            const reservations = data.reservations || {};
            giteSet = new Set(
                [...takenSet, ...optionSet].filter(d => {
                    const r = reservations[d] || {};
                    const main = r.rangeRef ? (reservations[r.rangeRef] || {}) : r;
                    return main.type === 'gite';
                })
            );
        })
        .catch(() => {}) // silencieux si le fichier est absent
        .finally(() => { render(); });

    document.getElementById('dispoPrev').addEventListener('click', () => {
        if (offset > 0) { offset--; render(); }
    });
    document.getElementById('dispoNext').addEventListener('click', () => {
        offset++;
        render();
    });
})();
