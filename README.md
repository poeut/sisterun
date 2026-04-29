# SisterRun

> **Courez ensemble. En sécurité.**
> Application mobile communautaire de course pour femmes — Paris (phase 1).

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-SQLite-2D3748)](https://www.prisma.io)

---

## Pourquoi SisterRun ?

- **81 %** des femmes ont déjà subi du harcèlement dans l'espace public (IPSOS/IFOP).
- **51 %** des femmes coureuses ont déjà été dérangées pendant un run.

SisterRun permet aux femmes de Paris de **courir en groupe en sécurité** :
vérification d'identité (KYC), parrainage, signalements, parcours sécurisés,
bouton SOS, contacts d'urgence.

---

## Démarrage rapide (3 commandes)

```bash
npm install        # installe + génère le client Prisma
npm run db:reset   # crée la BDD SQLite + seed (20 utilisatrices, 10 runs, 5 parcours)
npm run dev        # http://localhost:3000
```

Comptes de démo pré-créés :

| Rôle  | Email                | Mot de passe |
|-------|----------------------|--------------|
| Démo  | `demo@sisterrun.fr`  | `Demo123!`   |
| Admin | `admin@sisterrun.fr` | `Admin123!`  |

---

## Stack technique

| Couche          | Choix |
|-----------------|-------|
| Framework       | **Next.js 14** (App Router) + React 18 + TypeScript |
| Styling         | **Tailwind CSS** + shadcn/ui (Radix UI primitives) |
| State global    | **Zustand** |
| Formulaires     | **react-hook-form + zod** |
| Cartographie    | **Mapbox GL JS** (avec fallback **Leaflet + OpenStreetMap** si pas de clé) |
| Backend         | **Next.js API Routes** + **Prisma ORM** |
| Base de données | **SQLite** local (fichier `prisma/dev.db`) |
| Auth            | **NextAuth.js** (Auth.js v5) — credentials + JWT |
| Realtime        | **Pusher Channels** (avec fallback **polling** si pas de clé) |
| Tests           | **Vitest** (logique métier critique) |
| Lang UI         | Français |

---

## Structure

```
sisterrun/
├── prisma/              schéma + seed + migrations
├── public/uploads/      photos CI, selfies, check-ins
├── public/routes/       parcours pré-enregistrés Paris
├── src/
│   ├── app/             App Router (auth, app, admin, api)
│   ├── components/      ui/ auth/ map/ runs/ chat/ safety/ profile/ layout/ common/
│   ├── lib/             prisma, auth, kyc-mock, geo, safety-routing, sanctions
│   ├── stores/          Zustand stores (auth, runs, location, ui)
│   ├── hooks/           use-geolocation, use-realtime, use-camera
│   ├── types/           types DTO partagés
│   └── constants/       Paris bbox, RUN_LEVELS, etc.
└── tests/               vitest — sanctions, safety-routing, kyc
```

---

## Variables d'environnement

Voir [`.env.example`](./.env.example). Toutes les variables ont un fallback fonctionnel
sans clé API : la démo tourne **out-of-the-box** sans Mapbox ni Pusher.

```bash
cp .env.example .env.local
```

---

## Fonctionnalités clés

- **KYC mocké** : upload pièce d'identité + selfie (3 s analyse simulée)
- **Carte des courses actives** sur Paris (Mapbox ou Leaflet auto-fallback)
- **Création / jointure de courses** en 3 clics max
- **Check-in photo** 10 min avant le départ pour confirmer la présence
- **Chat de course** en temps réel (Pusher ou polling 3 s auto-fallback)
- **Bouton SOS** : 1 tap → alerte tous les participants + contacts d'urgence
- **Signalements & sanctions** : parrainage avec blocage 6 mois
- **Parcours suggérés** scorés sur éclairage, fréquentation, horaire
- **Mini back-office admin** de modération
- **RGPD** : export & suppression des données

---

## Tests

```bash
npm test            # sanctions, safety-routing, kyc
```

---

## Scripts npm

| Script             | Description |
|--------------------|-------------|
| `npm run dev`      | Lance le serveur Next.js en dev (port 3000) |
| `npm run build`    | Build de production |
| `npm run start`    | Démarre le build de production |
| `npm run db:push`  | Pousse le schéma Prisma vers SQLite |
| `npm run db:reset` | Reset complet + seed |
| `npm run seed`     | Re-seed la base |
| `npm test`         | Tests Vitest |
| `npm run lint`     | ESLint Next.js |

---

## Démo jury

Voir [`DEMO.md`](./DEMO.md) — script chronométré de 5 minutes
(disponible à partir de la Phase 8).

---

## Statut du projet

Implémentation par phases :

- [x] **Phase 1** — Init Next.js, Tailwind, shadcn/ui, Prisma, structure dossiers
- [ ] **Phase 2** — Schéma Prisma complet, migrations, seed, tests métier
- [ ] **Phase 3** — Auth NextAuth + flow KYC
- [ ] **Phase 4** — Layout protégé, profil, contacts urgence
- [ ] **Phase 5** — Carte + courses
- [ ] **Phase 6** — Détail course + chat + check-in
- [ ] **Phase 7** — SOS + signalements + sanctions + admin
- [ ] **Phase 8** — Parcours, RGPD, polish, DEMO.md

---

## Licence

Projet pédagogique — © 2026 SisterRun.
