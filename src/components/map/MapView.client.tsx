"use client";
// Wrapper côté client qui charge MapView en dynamic import (ssr: false)
// pour éviter "window is not defined" pendant le SSR.

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MapView as MapViewType } from "./MapView";

const MapViewDynamic = dynamic(() => import("./MapView").then((m) => m.MapView), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-brand-50 text-sm text-brand-700">
      Chargement de la carte…
    </div>
  ),
});

export default function MapViewClient(
  props: ComponentProps<typeof MapViewType>
) {
  return <MapViewDynamic {...props} />;
}
