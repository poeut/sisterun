import Link from "next/link";
import { Shield, MapPin, Users, AlertTriangle } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="flex flex-col px-6 pb-10 pt-12">
      <header className="mb-10">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          <Shield className="h-3.5 w-3.5" /> Vérifié par parrainage + KYC
        </div>
        <h1 className="text-4xl font-bold leading-tight text-brand-900">
          Courez ensemble.
          <br />
          <span className="text-accent">En sécurité.</span>
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          La communauté de course 100&nbsp;% féminine à Paris : groupes vérifiés,
          parcours sûrs, alertes SOS d&apos;un seul tap.
        </p>
      </header>

      <div className="space-y-4 mb-10">
        <Feature
          icon={<Users className="h-5 w-5 text-brand-600" />}
          title="Communauté vérifiée"
          desc="Pièce d'identité + parrainage : aucune femme seule face à un inconnu."
        />
        <Feature
          icon={<MapPin className="h-5 w-5 text-brand-600" />}
          title="Parcours sécurisés"
          desc="5 itinéraires Paris notés sur l'éclairage, la fréquentation et l'horaire."
        />
        <Feature
          icon={<AlertTriangle className="h-5 w-5 text-brand-600" />}
          title="Bouton SOS"
          desc="Une pression : groupe alerté, contacts d'urgence prévenus, position partagée."
        />
      </div>

      <div className="space-y-3">
        <Link
          href="/register"
          className="flex h-14 items-center justify-center rounded-2xl bg-brand-500 text-base font-semibold text-white shadow-md shadow-brand-500/30 transition hover:bg-brand-600"
        >
          Créer mon compte
        </Link>
        <Link
          href="/login"
          className="flex h-14 items-center justify-center rounded-2xl border border-brand-200 text-base font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          J&apos;ai déjà un compte
        </Link>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Démo : <code className="font-mono">demo@sisterrun.fr</code> /{" "}
        <code className="font-mono">Demo123!</code>
      </p>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
