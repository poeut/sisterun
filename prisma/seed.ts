import { PrismaClient, RunLevel, RunStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();

// =========================================================================
// HELPERS
// =========================================================================

const hash = (pw: string) => bcrypt.hashSync(pw, 10);

const PHOTO = (seed: number, w = 200, h = 200) =>
  `https://picsum.photos/seed/sisterrun-${seed}/${w}/${h}`;

const yearsAgo = (years: number) =>
  new Date(new Date().setFullYear(new Date().getFullYear() - years));

const minutesFromNow = (m: number) => new Date(Date.now() + m * 60 * 1000);
const daysFromNow = (d: number) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

// =========================================================================
// DATA
// =========================================================================

type SeedUser = {
  email: string;
  firstName: string;
  lastName: string;
  level: RunLevel;
  age: number;
  bio?: string;
  verified: boolean;
  banned?: boolean;
  role?: Role;
  premium?: boolean;
};

const SEED_USERS: SeedUser[] = [
  // Comptes de démo principaux
  { email: "demo@sisterrun.fr", firstName: "Léa", lastName: "Martin", level: "INTERMEDIATE", age: 28, verified: true, bio: "Je cours dans le 11e, j'adore les sorties matinales." },
  { email: "admin@sisterrun.fr", firstName: "Sarah", lastName: "Dubois", level: "ADVANCED", age: 35, verified: true, role: "ADMIN", bio: "Modératrice SisterRun." },

  // Communauté
  { email: "amelie.bernard@example.fr", firstName: "Amélie", lastName: "Bernard", level: "BEGINNER", age: 24, verified: true, bio: "Débutante, motivée !" },
  { email: "camille.petit@example.fr", firstName: "Camille", lastName: "Petit", level: "INTERMEDIATE", age: 31, verified: true },
  { email: "marie.robert@example.fr", firstName: "Marie", lastName: "Robert", level: "ADVANCED", age: 29, verified: true, premium: true, bio: "Marathon Paris 2025 finisher." },
  { email: "julie.richard@example.fr", firstName: "Julie", lastName: "Richard", level: "BEGINNER", age: 22, verified: true },
  { email: "elise.thomas@example.fr", firstName: "Élise", lastName: "Thomas", level: "INTERMEDIATE", age: 33, verified: true, premium: true },
  { email: "noemie.moreau@example.fr", firstName: "Noémie", lastName: "Moreau", level: "ADVANCED", age: 41, verified: true },
  { email: "claire.simon@example.fr", firstName: "Claire", lastName: "Simon", level: "INTERMEDIATE", age: 27, verified: true },
  { email: "lucie.michel@example.fr", firstName: "Lucie", lastName: "Michel", level: "BEGINNER", age: 19, verified: false, bio: "Je viens d'arriver à Paris, hâte de courir avec vous !" },
  { email: "pauline.garcia@example.fr", firstName: "Pauline", lastName: "Garcia", level: "INTERMEDIATE", age: 30, verified: true },
  { email: "manon.david@example.fr", firstName: "Manon", lastName: "David", level: "ADVANCED", age: 38, verified: true },
  { email: "chloe.bertrand@example.fr", firstName: "Chloé", lastName: "Bertrand", level: "BEGINNER", age: 25, verified: false },
  { email: "ines.morel@example.fr", firstName: "Inès", lastName: "Morel", level: "INTERMEDIATE", age: 26, verified: true },
  { email: "sofia.fournier@example.fr", firstName: "Sofia", lastName: "Fournier", level: "BEGINNER", age: 23, verified: true },

  // Profils signalés / sous sanction (pour la démo modération)
  { email: "alex.lambert@example.fr", firstName: "Alex", lastName: "Lambert", level: "INTERMEDIATE", age: 32, verified: true, bio: "[Profil signalé pour la démo]" },
  { email: "morgan.faure@example.fr", firstName: "Morgan", lastName: "Faure", level: "BEGINNER", age: 28, verified: true, bio: "[Profil signalé pour la démo]" },
  { email: "sam.legrand@example.fr", firstName: "Sam", lastName: "Legrand", level: "ADVANCED", age: 36, verified: true, banned: true, bio: "[Bannie pour la démo]" },

  // Profils non vérifiés (en attente KYC)
  { email: "louise.guerin@example.fr", firstName: "Louise", lastName: "Guérin", level: "BEGINNER", age: 21, verified: false },
  { email: "elena.boyer@example.fr", firstName: "Elena", lastName: "Boyer", level: "INTERMEDIATE", age: 34, verified: false },
];

// =========================================================================
// MAIN
// =========================================================================

async function main() {
  console.log("→ Reset des tables");
  // Ordre : enfants → parents
  await prisma.message.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.sosAlert.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.sanction.deleteMany();
  await prisma.sponsorship.deleteMany();
  await prisma.emergencyContact.deleteMany();
  await prisma.run.deleteMany();
  await prisma.route.deleteMany();
  await prisma.user.deleteMany();

  // ---------- USERS ----------
  console.log("→ Création des utilisatrices");
  const users = await Promise.all(
    SEED_USERS.map((u, i) =>
      prisma.user.create({
        data: {
          email: u.email,
          passwordHash: hash(
            u.email === "admin@sisterrun.fr" ? "Admin123!" :
            u.email === "demo@sisterrun.fr" ? "Demo123!" :
            "Password1!"
          ),
          firstName: u.firstName,
          lastName: u.lastName,
          birthDate: yearsAgo(u.age),
          phone: `06${String(10000000 + i * 137).slice(-8)}`,
          bio: u.bio ?? null,
          level: u.level,
          photoUrl: PHOTO(i + 1),
          verified: u.verified,
          verifiedAt: u.verified ? new Date() : null,
          banned: u.banned ?? false,
          bannedAt: u.banned ? new Date() : null,
          banReason: u.banned ? "Bannissement de démonstration" : null,
          role: u.role ?? "USER",
          premium: u.premium ?? false,
        },
      })
    )
  );
  const byEmail = (e: string) => users.find((u) => u.email === e)!;
  console.log(`  ${users.length} utilisatrices créées`);

  // ---------- PARCOURS ----------
  console.log("→ Création des parcours");
  const routesJsonPath = path.join(
    process.cwd(),
    "public",
    "routes",
    "paris-routes.json"
  );
  const rawRoutes: Array<{
    name: string;
    description: string;
    distanceKm: number;
    safetyScore: number;
    bestTimeOfDay: string;
    lighting: number;
    popularity: number;
    geoJson: unknown;
  }> = JSON.parse(fs.readFileSync(routesJsonPath, "utf-8"));

  const routes = await Promise.all(
    rawRoutes.map((r) =>
      prisma.route.create({
        data: {
          name: r.name,
          description: r.description,
          distanceKm: r.distanceKm,
          geoJson: JSON.stringify(r.geoJson),
          safetyScore: r.safetyScore,
          bestTimeOfDay: r.bestTimeOfDay,
          lighting: r.lighting,
          popularity: r.popularity,
        },
      })
    )
  );
  console.log(`  ${routes.length} parcours créés`);

  // ---------- PARRAINAGES ----------
  console.log("→ Parrainages");
  const sponsorships = [
    // Démo a parrainé Lucie + Chloé (deux non-vérifiées)
    { sponsor: byEmail("demo@sisterrun.fr"), sponsored: byEmail("lucie.michel@example.fr") },
    { sponsor: byEmail("demo@sisterrun.fr"), sponsored: byEmail("chloe.bertrand@example.fr") },
    // Marie a parrainé Alex (qui sera signalé)
    { sponsor: byEmail("marie.robert@example.fr"), sponsored: byEmail("alex.lambert@example.fr") },
    // Marie a aussi parrainé Morgan (qui sera signalé) → 2e signalement déclenchera le ban du parrain
    { sponsor: byEmail("marie.robert@example.fr"), sponsored: byEmail("morgan.faure@example.fr") },
    // Sarah (admin) a parrainé Louise et Elena
    { sponsor: byEmail("admin@sisterrun.fr"), sponsored: byEmail("louise.guerin@example.fr") },
    { sponsor: byEmail("admin@sisterrun.fr"), sponsored: byEmail("elena.boyer@example.fr") },
  ];
  for (const s of sponsorships) {
    await prisma.sponsorship.create({
      data: { sponsorId: s.sponsor.id, sponsoredId: s.sponsored.id },
    });
  }
  console.log(`  ${sponsorships.length} parrainages`);

  // ---------- COURSES ----------
  console.log("→ Création des courses");
  const PARIS_SPOTS = [
    { addr: "Buttes-Chaumont, Paris 19e", lat: 48.8809, lng: 2.3829, routeIdx: 0 },
    { addr: "Bois de Vincennes (Lac Daumesnil), Paris 12e", lat: 48.8295, lng: 2.4326, routeIdx: 1 },
    { addr: "Canal Saint-Martin, Paris 10e", lat: 48.8717, lng: 2.3679, routeIdx: 2 },
    { addr: "Champ de Mars, Paris 7e", lat: 48.8556, lng: 2.2986, routeIdx: 3 },
    { addr: "Parc Monceau, Paris 8e", lat: 48.8799, lng: 2.3094, routeIdx: 4 },
    { addr: "Parc Montsouris, Paris 14e", lat: 48.8222, lng: 2.3389, routeIdx: 0 },
    { addr: "Jardin du Luxembourg, Paris 6e", lat: 48.8462, lng: 2.3372, routeIdx: 4 },
    { addr: "Bois de Boulogne, Paris 16e", lat: 48.8624, lng: 2.2466, routeIdx: 1 },
    { addr: "Berges de Seine — Trocadéro", lat: 48.8606, lng: 2.2870, routeIdx: 3 },
    { addr: "Tuileries, Paris 1er", lat: 48.8634, lng: 2.3275, routeIdx: 2 },
  ];

  // 5 SCHEDULED dans les 7 prochains jours
  const scheduled = [
    { title: "Sortie matinale Buttes-Chaumont", spot: 0, organizer: "demo@sisterrun.fr", level: "INTERMEDIATE" as const, when: minutesFromNow(60 * 18), max: 8 },
    { title: "Tranquille au lac Daumesnil", spot: 1, organizer: "amelie.bernard@example.fr", level: "BEGINNER" as const, when: daysFromNow(1), max: 6 },
    { title: "Run Champ de Mars", spot: 3, organizer: "marie.robert@example.fr", level: "ADVANCED" as const, when: daysFromNow(2), max: 10 },
    { title: "Découverte canal Saint-Martin", spot: 2, organizer: "elise.thomas@example.fr", level: "INTERMEDIATE" as const, when: daysFromNow(3), max: 8 },
    { title: "Boucle Parc Monceau", spot: 4, organizer: "claire.simon@example.fr", level: "BEGINNER" as const, when: daysFromNow(5), max: 8 },
  ];

  // 2 ACTIVE (en cours pour la démo immédiate)
  const active = [
    { title: "DÉMO — Run Champ de Mars en cours", spot: 3, organizer: "demo@sisterrun.fr", level: "INTERMEDIATE" as const, when: minutesFromNow(-15), max: 8 },
    { title: "Sortie Bois de Boulogne", spot: 7, organizer: "noemie.moreau@example.fr", level: "ADVANCED" as const, when: minutesFromNow(-25), max: 6 },
  ];

  // 3 COMPLETED
  const completed = [
    { title: "Run Tuileries", spot: 9, organizer: "camille.petit@example.fr", level: "INTERMEDIATE" as const, when: daysFromNow(-2), max: 8 },
    { title: "Boucle Parc Montsouris", spot: 5, organizer: "demo@sisterrun.fr", level: "BEGINNER" as const, when: daysFromNow(-5), max: 6 },
    { title: "Sortie Trocadéro", spot: 8, organizer: "manon.david@example.fr", level: "ADVANCED" as const, when: daysFromNow(-7), max: 10 },
  ];

  const allRunSpecs = [
    ...scheduled.map((s) => ({ ...s, status: "SCHEDULED" as RunStatus })),
    ...active.map((s) => ({ ...s, status: "ACTIVE" as RunStatus })),
    ...completed.map((s) => ({ ...s, status: "COMPLETED" as RunStatus })),
  ];

  const runs = [];
  for (const spec of allRunSpecs) {
    const spot = PARIS_SPOTS[spec.spot];
    const route = routes[spot.routeIdx];
    const run = await prisma.run.create({
      data: {
        organizerId: byEmail(spec.organizer).id,
        title: spec.title,
        description: "Sortie organisée via SisterRun.",
        startLat: spot.lat,
        startLng: spot.lng,
        startAddress: spot.addr,
        scheduledAt: spec.when,
        durationMin: 45,
        level: spec.level,
        maxParticipants: spec.max,
        routeId: route?.id,
        status: spec.status,
      },
    });
    runs.push(run);
  }
  console.log(`  ${runs.length} courses créées`);

  // ---------- PARTICIPATIONS ----------
  console.log("→ Participations");
  const demo = byEmail("demo@sisterrun.fr");
  const participants = [
    // démo participe à 2 courses (+ celles qu'elle organise)
    { run: runs[1], user: demo },
    { run: runs[2], user: demo },
    // Quelques participations sur la course active de démo
    { run: runs[5], user: byEmail("amelie.bernard@example.fr") },
    { run: runs[5], user: byEmail("camille.petit@example.fr") },
    { run: runs[5], user: byEmail("marie.robert@example.fr") },
    // Participations diverses
    { run: runs[0], user: byEmail("amelie.bernard@example.fr") },
    { run: runs[0], user: byEmail("camille.petit@example.fr") },
    { run: runs[0], user: byEmail("ines.morel@example.fr") },
    { run: runs[2], user: byEmail("noemie.moreau@example.fr") },
    { run: runs[2], user: byEmail("manon.david@example.fr") },
    { run: runs[3], user: byEmail("pauline.garcia@example.fr") },
    { run: runs[3], user: byEmail("sofia.fournier@example.fr") },
    { run: runs[6], user: byEmail("noemie.moreau@example.fr") },
    { run: runs[6], user: byEmail("manon.david@example.fr") },
  ];
  for (const p of participants) {
    // Inclut l'organisateur en participant aussi (cohérence métier)
    await prisma.participation.upsert({
      where: { userId_runId: { userId: p.user.id, runId: p.run.id } },
      update: {},
      create: { userId: p.user.id, runId: p.run.id },
    });
  }
  // Organisateurs ajoutés en participants
  for (const r of runs) {
    await prisma.participation.upsert({
      where: { userId_runId: { userId: r.organizerId, runId: r.id } },
      update: {},
      create: { userId: r.organizerId, runId: r.id },
    });
  }
  console.log("  participations OK");

  // ---------- CONTACTS URGENCE ----------
  console.log("→ Contacts d'urgence pour démo");
  await prisma.emergencyContact.createMany({
    data: [
      { userId: demo.id, name: "Maman", phone: "0612345678", email: "mere.demo@example.fr", relation: "Mère" },
      { userId: demo.id, name: "Camille (sœur)", phone: "0698765432", relation: "Sœur" },
      { userId: demo.id, name: "Tom (colocataire)", phone: "0644556677", relation: "Coloc" },
    ],
  });

  // ---------- SIGNALEMENTS + SANCTIONS ----------
  console.log("→ Signalements + sanctions de démo");
  const reporter = byEmail("amelie.bernard@example.fr");

  // Alex : 1 signalement validé → WARNING + parrain (Marie) bloqué 6 mois
  await prisma.report.create({
    data: {
      reporterId: reporter.id,
      reportedId: byEmail("alex.lambert@example.fr").id,
      reason: "INAPPROPRIATE_BEHAVIOR",
      comment: "Comportement déplacé pendant la course Tuileries.",
      status: "VALIDATED",
      resolvedAt: new Date(),
      resolution: "Signalement validé par modération.",
    },
  });
  await prisma.sanction.create({
    data: {
      userId: byEmail("alex.lambert@example.fr").id,
      type: "WARNING",
      reason: "1er signalement validé.",
    },
  });
  const sponsorBlockEnd = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);
  await prisma.sanction.create({
    data: {
      userId: byEmail("marie.robert@example.fr").id,
      type: "SPONSOR_BLOCK_6M",
      reason: "Filleul (Alex L.) signalé.",
      endsAt: sponsorBlockEnd,
    },
  });
  await prisma.user.update({
    where: { id: byEmail("marie.robert@example.fr").id },
    data: { sponsorBlockedUntil: sponsorBlockEnd },
  });

  // Sam : déjà bannie (3 signalements validés) — flag déjà mis dans seed user
  await prisma.report.createMany({
    data: [
      { reporterId: reporter.id, reportedId: byEmail("sam.legrand@example.fr").id, reason: "HARASSMENT", status: "VALIDATED", resolvedAt: new Date() },
      { reporterId: byEmail("camille.petit@example.fr").id, reportedId: byEmail("sam.legrand@example.fr").id, reason: "HARASSMENT", status: "VALIDATED", resolvedAt: new Date() },
      { reporterId: byEmail("marie.robert@example.fr").id, reportedId: byEmail("sam.legrand@example.fr").id, reason: "INAPPROPRIATE_BEHAVIOR", status: "VALIDATED", resolvedAt: new Date() },
    ],
  });
  await prisma.sanction.create({
    data: {
      userId: byEmail("sam.legrand@example.fr").id,
      type: "PERMANENT_BAN",
      reason: "3 signalements validés.",
    },
  });

  // Morgan : 1 signalement PENDING (à modérer pour la démo admin)
  await prisma.report.create({
    data: {
      reporterId: byEmail("camille.petit@example.fr").id,
      reportedId: byEmail("morgan.faure@example.fr").id,
      reason: "FAKE_PROFILE",
      comment: "La photo de profil ne correspond pas au selfie.",
      status: "PENDING",
    },
  });

  console.log("  signalements + sanctions OK");

  // ---------- MESSAGES DE CHAT ----------
  console.log("→ Messages dans les courses ACTIVE");
  const activeRun = runs[5]; // course active de démo
  const chatAuthors = [
    byEmail("demo@sisterrun.fr"),
    byEmail("amelie.bernard@example.fr"),
    byEmail("camille.petit@example.fr"),
    byEmail("marie.robert@example.fr"),
  ];
  const chatMessages = [
    { author: 0, content: "Hello les filles, on se retrouve à 18h pile devant la Tour Eiffel !" },
    { author: 1, content: "Top ! Je serai en tee-shirt rose 🩷" },
    { author: 2, content: "Pareil, j'arrive depuis le métro Bir-Hakeim." },
    { author: 3, content: "On part pile à l'heure, on synchronise les montres ⌚️" },
    { author: 0, content: "Allure ~6'/km, on s'attend les unes les autres." },
  ];
  for (const m of chatMessages) {
    await prisma.message.create({
      data: {
        runId: activeRun.id,
        userId: chatAuthors[m.author].id,
        content: m.content,
      },
    });
  }
  console.log("  messages OK");

  console.log("\n✅ Seed terminé.");
  console.log("Comptes : demo@sisterrun.fr / Demo123!  |  admin@sisterrun.fr / Admin123!");
  console.log("Autres utilisatrices : password = Password1!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
