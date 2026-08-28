import { lazy, Suspense, type ComponentProps } from "react";

const Inner = lazy(() => import("./PlacesMap").then((m) => ({ default: m.PlacesMap })));

type Props = ComponentProps<typeof Inner>;

/** Defers Leaflet + markercluster out of the entry bundle. */
export function PlacesMapLazy(props: Props) {
  return (
    <Suspense fallback={<div className={`map-wrap${props.tall ? " tall" : ""}`} aria-hidden="true" />}>
      <Inner {...props} />
    </Suspense>
  );
}
