# Prévisio

Prévisio est une application de gestion financière personnelle pensée pour suivre ses revenus, dépenses, budgets et prévisions sur plusieurs mois, directement depuis le navigateur.

L’objectif est simple : avoir une vue claire de son solde actuel, de ses budgets mensuels et de son solde prévisionnel à 30, 90 et 365 jours, sans dépendre d’un backend ni d’un abonnement.

## Sommaire

- [Vue d’ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Lancer le projet en développement](#lancer-le-projet-en-développement)
- [Scripts disponibles](#scripts-disponibles)
- [Structure du projet](#structure-du-projet)
- [Mode démonstration](#mode-démonstration)
- [Gestion des données](#gestion-des-données)
- [Bonnes pratiques d’utilisation](#bonnes-pratiques-dutilisation)
- [Exemple de parcours](#exemple-de-parcours)
- [Déploiement sur GitHub Pages](#déploiement-sur-github-pages)
- [Installation sur mobile](#installation-sur-mobile)
- [Licence](#licence)
- [À retenir](#à-retenir)

## Vue d’ensemble

Prévisio est une application Vue 3 + TypeScript orientée mobile-first, conçue pour aider à :

- suivre les entrées et sorties d’argent,
- gérer un compte principal,
- catégoriser les dépenses et revenus,
- définir des budgets mensuels,
- répertorier ses dépenses et revenus récurrents,
- visualiser le solde actuel et les prévisions financières,
- tester le produit en mode démo sans utiliser ses données réelles.

Le projet est pensé comme un outil de planification et d’analyse, avec un stockage local dans le navigateur. Les données sont donc accessibles rapidement, sans serveur, et restent sous le contrôle de l’utilisateur.

## Fonctionnalités

### 1. Dashboard financier

- **solde compte** : solde de départ du compte + opérations « réelles » dont la date est passée (le solde bancaire du jour),
- **fin de mois** : solde compte, une fois déduites toutes les opérations restantes du mois en cours (prévues, estimées, ou réelles datées plus tard dans le mois) et les échéances de récurrences à venir dans le mois,
- plan mensuel : entrées, dépenses et solde net du mois en cours et des deux mois suivants,
- liste des 5 opérations les plus anciennes (par date),
- répartition des dépenses du mois en cours par catégorie (nom, couleur, montant et part de chaque catégorie, du plus gros poste au plus petit) ; comme le plan mensuel, elle compte toutes les dépenses datées dans le mois, réelles, prévues ou estimées,
- solde prévisionnel à 30, 90 et 365 jours : solde compte + opérations « prévues » et « estimées » datées dans la période,
- montant des dépenses estimées et des opérations futures sur les 30 prochains jours.

Le plan mensuel, la fin de mois, les prévisions, la répartition des dépenses et les graphiques comptent les opérations saisies **et** les échéances à venir des récurrences actives (voir [Récurrences](#6-récurrences)).

### 2. Gestion du compte principal

- définition du solde initial,
- mise à jour du solde principal,
- suivi des données liées au compte réel ou démo,
- export et import de toutes les données réelles dans un fichier de sauvegarde.

### 3. Opérations

- ajout d’une opération avec montant, date, catégorie, statut et description,
- trois statuts : « réelle » (déjà passée sur le compte), « prévue » et « estimée » (opérations à venir utilisées par les prévisions),
- distinction entre revenus et dépenses,
- case « récurrente » pour repérer une opération (simple indicateur, sans lien avec les règles de récurrence),
- suppression et modification d’une opération existante.

### 4. Catégories

- création de catégories de revenus et de dépenses,
- couleur personnalisable pour les identifier visuellement,
- modification et suppression des catégories.

### 5. Budgets

- définition de montants prévus par catégorie et par mois,
- comparaison entre le montant prévu et le total des dépenses saisies dans la catégorie pour le mois,
- ajout et mise à jour des budgets mensuels.

### 6. Récurrences

- création de règles récurrentes mensuelles, trimestrielles ou annuelles,
- gestion des montants et dates de départ,
- modification et suppression des règles récurrentes.

Les échéances des règles actives sont calculées automatiquement et comptées comme des opérations « prévues » dans le plan mensuel, la fin de mois, les prévisions, la répartition des dépenses et les graphiques. Elles ne sont jamais enregistrées comme opérations : modifier ou supprimer une règle met tous les calculs à jour immédiatement.

Seules les échéances **à partir d’aujourd’hui** sont comptées (sur un an). Pour le passé, seules les opérations saisies comptent : une fois le loyer payé, on le saisit comme opération « réelle » et l’échéance correspondante, désormais passée, n’est pas comptée une seconde fois.

Les budgets, eux, comparent le montant prévu aux seules opérations saisies.

### 7. Graphiques

Écran accessible depuis le menu (onglet **Graphiques**) :

- graphique en barres des entrées et dépenses par mois (6 mois passés, mois en cours et 2 mois à venir), avec la courbe du solde net,
- graphique en anneau de la répartition des dépenses par catégorie pour un mois au choix (mois en cours par défaut), avec la liste détaillée en légende,
- montants affichés au survol ou au toucher.

### 8. Mode réel / mode démo

- mode réel : les données personnelles sont gérées localement dans le navigateur,
- mode démo : un jeu de données d’exemple permet de tester le produit sans risque (rien n’est enregistré),
- possibilité de réinitialiser la démo ou de nettoyer les données personnelles.

### 9. Expérience mobile

- interface pensée pour un usage sur smartphone,
- navigation compacte et adaptée au format mobile,
- structure claire avec sections fonctionnelles accessibles rapidement,
- installable sur l’écran d’accueil comme une application et utilisable hors connexion (voir [Installation sur mobile](#installation-sur-mobile)).

## Stack technique

- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Dexie / IndexedDB
- date-fns
- vite-plugin-pwa (application installable et hors connexion)
- Chart.js (écran Graphiques, chargé à la demande)
- Vitest

## Prérequis

Avant de lancer le projet, vérifie que tu as :

- Node.js 22.12 ou plus (requis par Vitest ; le déploiement utilise Node 24)
- npm

## Installation

Depuis la racine du projet :

```bash
npm install
```

## Lancer le projet en développement

```bash
npm run dev
```

Puis ouvre l’URL affichée dans le terminal, généralement :

```text
http://localhost:5173
```

## Scripts disponibles

```bash
npm run dev
```
Lance le serveur de développement.

```bash
npm run build
```
Construit la version de production.

```bash
npm run preview
```
Prévisualise le build de production localement.

```bash
npm test
```
Exécute les tests Vitest.

## Structure du projet

```text
.
├── .github/workflows/deploy.yml
├── public/            icônes de l’application
├── src/
│   ├── components/
│   ├── data/
│   ├── lib/
│   ├── router/
│   ├── stores/
│   ├── types/
│   ├── views/
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── tests/
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

### Détails utiles

- src/stores/finance.ts : logique principale de gestion du state,
- src/lib/forecast.ts : calculs de prévision et de plan mensuel,
- src/lib/db.ts : configuration Dexie pour le stockage local,
- src/lib/backup.ts : format et validation des fichiers d’export / import,
- src/lib/demo.ts et src/data/sampleData.ts : contenu et données du mode démo,
- src/components/FinanceChart.vue : composant d’affichage des graphiques Chart.js,
- src/views : écrans de l’application,
- tests : couverture fonctionnelle et régression.

## Mode démonstration

Le mode démo permet de :

- explorer le produit sans utiliser de vraies données,
- tester le parcours complet de l’application,
- présenter la solution à un tiers sans exposer ses données financières.

La bascule de mode se trouve dans l’interface principale, et la réinitialisation du mode démo est disponible dans l’en-tête (ou dans le menu rapide sur mobile).

Les modifications faites en mode démo restent en mémoire : elles ne sont jamais enregistrées et ne touchent pas aux données réelles. Réinitialiser la démo ou recharger la page restaure le jeu d’exemple.

## Gestion des données

Le projet utilise le stockage local du navigateur via IndexedDB avec Dexie.

Cela signifie que :

- les données sont stockées localement,
- l’application fonctionne sans base de données externe,
- la confidentialité est renforcée,
- le fonctionnement est rapide et facile à utiliser.

Le projet ne dépend pas d’un backend pour les fonctionnalités de base.

### Export / import

Depuis l’écran **Compte principal**, section **Sauvegarde** :

- **Exporter mes données** télécharge un fichier `previsio-sauvegarde-AAAA-MM-JJ.json` contenant le compte, les catégories, opérations, récurrences et budgets du mode réel ;
- **Importer une sauvegarde** remplace toutes les données réelles de l’appareil par celles du fichier, après confirmation.

C’est le moyen de conserver ses données ou de les transférer d’un appareil à l’autre (ordinateur → téléphone par exemple).

## Bonnes pratiques d’utilisation

1. Commencer par le mode réel ou démo selon le cas d’usage.
2. Définir le solde initial du compte principal.
3. Ajouter les catégories nécessaires.
4. Enregistrer les revenus et dépenses déjà passés avec le statut « réelle ».
5. Ajouter les récurrences (loyer, abonnements, salaire…) : leurs échéances à venir sont comptées automatiquement.
6. Saisir les autres opérations à venir avec le statut « prévue » ou « estimée ».
7. Définir les budgets mensuels.
8. Consulter le dashboard : solde compte, fin de mois et prévisions.
9. Exporter régulièrement ses données depuis l’écran Compte principal.

## Exemple de parcours

Un usage typique du produit est le suivant :

- définir le solde actuel du compte,
- créer les catégories de dépenses habituelles,
- saisir les opérations déjà passées,
- créer les récurrences (loyer, abonnements, salaire…) puis les autres opérations prévues des prochains mois,
- fixer des budgets mensuels,
- observer le plan mensuel et le solde prévisionnel sur le dashboard, puis l’évolution mois par mois dans l’écran Graphiques.

## Déploiement sur GitHub Pages

L’application est publiée automatiquement à chaque push sur `main` grâce au workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) : il installe les dépendances, lance les tests, construit le projet et publie le dossier `dist`.

Configuration à faire une seule fois sur GitHub :

1. Ouvrir le dépôt → **Settings** → **Pages**.
2. Dans **Build and deployment** → **Source**, choisir **GitHub Actions**.

L’application est ensuite disponible à l’adresse :

```text
https://ln45.github.io/Previsio/
```

Le chemin `/Previsio/` est défini par l’option `base` de [vite.config.ts](vite.config.ts). Si le dépôt est renommé, il faut mettre cette valeur à jour (elle est sensible à la casse). Le routeur utilise des URL avec `#` (`/Previsio/#/operations`), car GitHub Pages ne sait pas rediriger les autres chemins vers `index.html`.

## Installation sur mobile

Prévisio est une Progressive Web App (PWA) : elle s’installe depuis le navigateur, s’ouvre en plein écran comme une application et fonctionne hors connexion après la première visite.

- **Android (Chrome)** : ouvrir l’adresse ci-dessus ; un bandeau **Installer** apparaît en haut de l’application (le bouton est aussi dans le menu rapide). À défaut : menu ⋮ → **Installer l’application**. Le bandeau n’apparaît pas si l’application est déjà installée.
- **iPhone / iPad (Safari)** : ouvrir l’adresse, bouton **Partager** → **Sur l’écran d’accueil**.

Les mises à jour sont récupérées automatiquement au lancement suivant de l’application.

> Les données restent stockées dans le navigateur de l’appareil (IndexedDB). Elles ne sont pas synchronisées entre le téléphone et l’ordinateur, et désinstaller l’application ou effacer les données du site les supprime. Utilise l’[export / import](#export--import) pour les sauvegarder ou les transférer.

## Licence

Ce projet est livré sans licence spécifique dans le dépôt courant. Si tu souhaites l’exploiter en équipe ou le publier, il est conseillé de préciser la licence avant diffusion externe.

## À retenir

Prévisio est une application de planification financière personnelle, légère, locale et orientée usage quotidien. Elle permet de mieux comprendre son solde, de piloter ses budgets et d’anticiper les prochains mois à partir des opérations prévues.
