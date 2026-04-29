"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validators";

function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get("callbackUrl") || "/map";
  const errorParam = sp.get("error");
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "demo@sisterrun.fr", password: "Demo123!" },
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    const res = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });
    setSubmitting(false);
    if (res?.error) {
      toast.error("Identifiants invalides ou compte banni.");
      return;
    }
    toast.success("Bienvenue !");
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <>
      {errorParam === "banned" ? (
        <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Votre compte a été suspendu. Contactez la modération.
        </div>
      ) : null}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email ? (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Se connecter"}
        </Button>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col px-6 pt-8 pb-10">
      <Link href="/" className="mb-6 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>

      <h1 className="text-3xl font-bold text-brand-900">Bon retour</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Connectez-vous pour rejoindre vos prochaines courses.
      </p>

      <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-xl bg-brand-50" />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/register" className="font-medium text-brand-700">
          Créer un compte
        </Link>
      </p>

      <div className="mt-auto pt-8 text-center text-xs text-muted-foreground">
        Démo pré-remplie : <code>demo@sisterrun.fr</code> / <code>Demo123!</code>
      </div>
    </main>
  );
}
