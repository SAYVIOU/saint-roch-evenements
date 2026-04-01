<?php
/**
 * Saint-Roch-Événements — Traitement du formulaire de réservation
 * Ce fichier fonctionne sur OVH (hébergement mutualisé avec PHP)
 * Il reçoit les données du formulaire et envoie un email à l'adresse de contact.
 */

// ─── Configuration ───────────────────────────────────────────────────────────
define('DESTINATAIRE', 'contact@saint-roch-evenements.fr');
define('SUJET',        'Nouvelle demande de réservation — Saint-Roch-Événements');
define('SITE_URL',     'https://saint-roch-evenements.fr'); // ← à adapter si besoin
// ─────────────────────────────────────────────────────────────────────────────

// Vérifie que la requête vient bien d'un envoi de formulaire
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

// Nettoie les données reçues
function clean($value) {
    return htmlspecialchars(trim($value ?? ''), ENT_QUOTES, 'UTF-8');
}

$nom     = clean($_POST['nom']       ?? '');
$prenom  = clean($_POST['prenom']    ?? '');
$tel     = clean($_POST['telephone'] ?? '');
$email   = filter_var(trim($_POST['email'] ?? ''), FILTER_SANITIZE_EMAIL);
$date    = clean($_POST['date']      ?? '');
$formule = clean($_POST['formule']   ?? '');
$invites = clean($_POST['invites']   ?? '');
$message = clean($_POST['message']   ?? '');

// Vérifie que les champs obligatoires sont remplis
if (empty($nom) || empty($prenom) || empty($tel) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: index.html?erreur=champs');
    exit;
}

// ── Corps de l'email ──────────────────────────────────────────────────────────
$corps  = "╔══════════════════════════════════════════════╗\n";
$corps .= "   NOUVELLE DEMANDE DE RÉSERVATION\n";
$corps .= "   Saint-Roch-Événements\n";
$corps .= "╚══════════════════════════════════════════════╝\n\n";

$corps .= "👤 CONTACT\n";
$corps .= "   Nom       : $nom $prenom\n";
$corps .= "   Téléphone : $tel\n";
$corps .= "   Email     : $email\n\n";

$corps .= "📅 ÉVÉNEMENT\n";
$corps .= "   Date souhaitée    : " . ($date    ?: 'Non précisée') . "\n";
$corps .= "   Formule souhaitée : " . ($formule ?: 'Non précisée') . "\n";
$corps .= "   Nombre d'invités  : " . ($invites ?: 'Non précisé')  . "\n\n";

$corps .= "💬 MESSAGE\n";
$corps .= "   " . str_replace("\n", "\n   ", $message ?: 'Aucun message') . "\n\n";

$corps .= "────────────────────────────────────────────────\n";
$corps .= "Message envoyé depuis saint-roch-evenements.fr\n";

// ── En-têtes email ────────────────────────────────────────────────────────────
$headers  = "From: Saint-Roch-Événements <noreply@saint-roch-evenements.fr>\r\n";
$headers .= "Reply-To: $nom $prenom <$email>\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "Content-Transfer-Encoding: 8bit\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

// ── Envoi ─────────────────────────────────────────────────────────────────────
$envoye = mail(DESTINATAIRE, '=?UTF-8?B?' . base64_encode(SUJET) . '?=', $corps, $headers);

if ($envoye) {
    header('Location: index.html?merci=1');
} else {
    header('Location: index.html?erreur=envoi');
}
exit;
