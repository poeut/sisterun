import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rankRoutes } from "@/lib/safety-routing";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const hourParam = searchParams.get("hour");
  const hour =
    hourParam !== null && !Number.isNaN(Number(hourParam))
      ? Number(hourParam)
      : new Date().getHours();

  const dbRoutes = await prisma.route.findMany();
  const scored = rankRoutes(
    dbRoutes.map((r) => ({
      id: r.id,
      name: r.name,
      distanceKm: r.distanceKm,
      safetyScore: r.safetyScore,
      bestTimeOfDay: r.bestTimeOfDay,
      lighting: r.lighting,
      popularity: r.popularity,
    })),
    hour
  );

  // Joint le geoJson original
  const result = scored.map((s) => {
    const dbR = dbRoutes.find((r) => r.id === s.id)!;
    return { ...s, description: dbR.description, geoJson: JSON.parse(dbR.geoJson) };
  });
  return NextResponse.json({ hour, routes: result });
}
