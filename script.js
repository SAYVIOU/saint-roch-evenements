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
        videoId: 'HPoDR_BGSrw',
        playerVars: {
            autoplay:       1,
            mute:           1,
            loop:           1,
            playlist:       'HPoDR_BGSrw',
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


/* ─────────────────────────────────────────
   4. MODALES TRAITEUR
   - openModal(id) : ouvre la modale ciblée
   - closeModal()  : ferme toutes les modales
   - Clic en dehors de la boîte → ferme
   - Touche Échap → ferme (géré ci-dessus)
───────────────────────────────────────── */
function openModal(id) {
    closeModal(); // ferme toute modale déjà ouverte
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.querySelectorAll('.tr-modal.open').forEach(m => {
        m.classList.remove('open');
    });
    document.body.style.overflow = '';
}

// Ferme si on clique sur l'overlay (fond sombre), pas sur la boîte
function closeModalOutside(event) {
    if (event.target.classList.contains('tr-modal')) {
        closeModal();
    }
}
