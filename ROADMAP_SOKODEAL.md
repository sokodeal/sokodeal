# Roadmap SokoDeal

## Objectif court terme

Faire de SokoDeal une marketplace simple, rapide et gratuite au lancement, avec une experience claire type Le Bon Coin, adaptee au Rwanda.

## Decisions actuelles

- Garder les fonctionnalites dans le code quand elles ne sont pas pretes.
- Masquer les fonctionnalites plutot que les supprimer, pour pouvoir les reactiver plus tard.
- Lancer l'application en mode gratuit afin d'attirer le plus d'utilisateurs possible.

## A masquer temporairement

- Systeme de paiement.
- Abonnements payants.
- Boosts d'annonces.
- Affichages relies aux annonces mises en avant.
- Statistiques reservees aux plans payants.

## Immobilier

- Ameliorer la carte immo.
- Permettre de chercher sur la carte, comme sur Booking ou les sites immobiliers.
- Afficher les annonces immobilieres de maniere claire avec localisation visible.
- Garder Kigali comme ville principale au lancement.
- Masquer ou reduire les autres villes pour simplifier l'experience.

## Categories a garder

- Immo.
- Vetements.
- Vehicule.
- Emploi / service.
- Animaux.
- Fourniture.
- Tech.
- Divers.

## Sous-categories

Chaque categorie doit garder ou recevoir des sous-categories simples, pour permettre de publier et filtrer facilement les annonces.

## Langue

- Mettre l'application en anglais.
- Garder les textes simples et courts.
- Harmoniser tous les labels, boutons, messages d'erreur et pages.

## Dashboard admin

- Creer ou ameliorer un dashboard detaille pour l'equipe SokoDeal.
- Suivre les annonces.
- Suivre les utilisateurs.
- Suivre les messages.
- Suivre les signalements ou contenus a verifier.
- Garder les donnees de paiement/boost masquables tant que la monetisation est desactivee.

## Profil utilisateur

- Ameliorer le profil pour qu'il ressemble davantage a une facade publique type Instagram.
- Avoir une page profil publique propre.
- Mettre en avant les annonces de l'utilisateur.
- Afficher les infos utiles sans surcharger.
- Garder une experience simple sur mobile.

## Messagerie

- Stabiliser la messagerie.
- Corriger les bugs.
- S'assurer que l'envoi et la reception fonctionnent bien.
- Afficher correctement les messages non lus.
- Eviter les lenteurs ou blocages.

## Travail deja teste

- Ajout d'un systeme de feature flags pour masquer temporairement la monetisation.
- Masquage des boosts et badges "Mis en avant" sur l'accueil.
- Page `/abonnement` remplacee par un message indiquant que SokoDeal est gratuit pour le moment.
- Onglets abonnement, boosts et stats masques dans le profil quand la monetisation est desactivee.

## Points techniques a surveiller

- Le serveur local Next.js peut devenir lent ou bloquer pendant les tests.
- Le cache `.next` peut contenir d'anciennes references, notamment autour de `api/verify-identity`.
- Le build Next.js a deja compile, mais l'environnement a rencontre une erreur Windows `spawn EPERM`.
- Les changements doivent rester reversibles.
