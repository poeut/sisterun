"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Trash2, Plus, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  relation: string | null;
};

export default function EmergencyContactsPage() {
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [relation, setRelation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = () =>
    fetch("/api/emergency-contacts")
      .then((r) => r.json())
      .then((d) => setContacts(d.contacts));

  useEffect(() => {
    refresh().catch(() => toast.error("Erreur de chargement."));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/emergency-contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, relation }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error || "Erreur d'ajout.");
      return;
    }
    setName("");
    setPhone("");
    setEmail("");
    setRelation("");
    toast.success("Contact ajouté.");
    refresh();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/emergency-contacts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Suppression impossible.");
      return;
    }
    toast.success("Contact supprimé.");
    refresh();
  };

  return (
    <main className="px-6 pt-6 pb-10">
      <Link href="/profile" className="mb-4 inline-flex items-center text-sm text-brand-700">
        <ChevronLeft className="mr-1 h-4 w-4" /> Retour
      </Link>

      <h1 className="text-2xl font-bold text-brand-900">Contacts d&apos;urgence</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ces contacts sont prévenus si tu déclenches le bouton SOS pendant une course.
      </p>

      {/* Liste */}
      <section className="mt-6 space-y-2">
        {contacts === null ? (
          <div className="space-y-2">
            <div className="h-16 animate-pulse rounded-2xl bg-brand-50" />
            <div className="h-16 animate-pulse rounded-2xl bg-brand-50" />
          </div>
        ) : contacts.length === 0 ? (
          <EmptyState
            icon={<Phone className="h-6 w-6" />}
            title="Aucun contact pour l'instant"
            description="Ajoute au moins une personne de confiance avant ta première course."
          />
        ) : (
          contacts.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <p className="font-medium">
                    {c.name}
                    {c.relation ? (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.relation}
                      </span>
                    ) : null}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" /> {c.phone}
                    {c.email ? (
                      <>
                        <span className="mx-1">·</span>
                        <Mail className="h-3 w-3" /> {c.email}
                      </>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-destructive hover:text-destructive/80"
                  aria-label="Supprimer"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </section>

      {/* Form */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Ajouter un contact
        </h2>
        <form onSubmit={add} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Maman, Camille (sœur)…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0612345678"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email (optionnel)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="relation">Relation (optionnel)</Label>
            <Input
              id="relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Ex : Mère, Coloc, Ami(e)…"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            <Plus className="mr-2 h-5 w-5" /> Ajouter le contact
          </Button>
        </form>
      </section>
    </main>
  );
}
