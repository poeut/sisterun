"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterInput } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      level: "BEGINNER",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Erreur lors de l'inscription.");
        setSubmitting(false);
        return;
      }
      // Auto-login
      const signRes = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      setSubmitting(false);
      if (signRes?.error) {
        toast.error("Compte créé mais impossible de se connecter automatiquement.");
        router.push("/login");
        return;
      }
      toast.success("Compte créé ! Étape suivante : vérification d'identité.");
      router.push("/kyc");
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Erreur réseau, réessayez.");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col px-6 pt-8 pb-10">
      <Link href="/" className="mb-6 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>

      <h1 className="text-3xl font-bold text-brand-900">Créer mon compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Rejoignez la communauté SisterRun. Vérification d&apos;identité juste après.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">Prénom</Label>
            <Input id="firstName" {...register("firstName")} />
            {errors.firstName ? (
              <p className="text-xs text-destructive">{errors.firstName.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Nom</Label>
            <Input id="lastName" {...register("lastName")} />
            {errors.lastName ? (
              <p className="text-xs text-destructive">{errors.lastName.message}</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          <p className="text-xs text-muted-foreground">
            8 caractères min, une majuscule, un chiffre.
          </p>
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Date de naissance</Label>
          <Input id="birthDate" type="date" {...register("birthDate")} />
          {errors.birthDate ? (
            <p className="text-xs text-destructive">{errors.birthDate.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Téléphone (optionnel)</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="level">Niveau de course</Label>
          <select
            id="level"
            {...register("level")}
            className="flex h-12 w-full rounded-xl border border-input bg-background px-4 text-base"
          >
            <option value="BEGINNER">Débutante (≤ 5 km)</option>
            <option value="INTERMEDIATE">Intermédiaire (5-10 km)</option>
            <option value="ADVANCED">Confirmée (≥ 10 km)</option>
          </select>
        </div>

        <label className="flex items-start gap-2 pt-2 text-sm">
          <input
            type="checkbox"
            {...register("acceptTerms")}
            className="mt-1 h-4 w-4 rounded border-input"
          />
          <span>
            J&apos;accepte les{" "}
            <Link href="/" className="text-brand-700 underline">
              conditions générales
            </Link>{" "}
            et la charte communautaire (zéro tolérance harcèlement).
          </span>
        </label>
        {errors.acceptTerms ? (
          <p className="text-xs text-destructive">{errors.acceptTerms.message}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-brand-700">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
