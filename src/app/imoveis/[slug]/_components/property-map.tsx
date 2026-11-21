'use client'

import type { PropertyCoords } from '@/shared'
import type * as MapLibre from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useMemo } from 'react'
import Map, { Layer, Source } from 'react-map-gl/maplibre'

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_API_KEY

// maplibre-gl 6 is ESM-only and, under a bundler, needs its worker URL set once
// (official Next.js/Turbopack setup): the static `new URL(…, import.meta.url)`
// makes Next emit the worker as a hashed same-origin asset (`worker-src 'self'`).
// Loaded lazily so the library stays out of SSR, as react-map-gl did before.
let mapLibPromise: Promise<typeof MapLibre> | undefined
function loadMapLib() {
  mapLibPromise ??= import('maplibre-gl').then((maplibre) => {
    maplibre.setWorkerUrl(
      new URL('maplibre-gl/dist/maplibre-gl-worker.mjs', import.meta.url).toString(),
    )
    return maplibre
  })
  return mapLibPromise
}

/**
 * Renderiza um círculo de ~300m centrado nas coords (já arredondadas pra ~100m no create).
 * Não mostra pin exato — alinha com a promessa "endereço completo após a visita".
 */
export function PropertyMap({ coords }: { coords: PropertyCoords }) {
  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: { type: 'Point' as const, coordinates: [coords.lng, coords.lat] },
        },
      ],
    }),
    [coords.lat, coords.lng],
  )

  if (!MAPTILER_KEY) {
    return (
      <div className="bg-muted border-border/60 flex aspect-[16/10] w-full items-center justify-center rounded-xl border">
        <p className="text-muted-foreground text-sm">Mapa indisponível.</p>
      </div>
    )
  }

  return (
    <div className="bg-muted border-border/60 aspect-[16/10] w-full overflow-hidden rounded-xl border">
      <Map
        mapLib={loadMapLib()}
        initialViewState={{ latitude: coords.lat, longitude: coords.lng, zoom: 14 }}
        mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
      >
        <Source id="location" type="geojson" data={geojson}>
          {/*
            Raios em pixels interpolados pra aproximar 300m de raio na terra
            (1 tile zoom 14 ≈ 9.5m/px em latitude ~-3°):
              - halo ≈ 500m (visual soft spread)
              - core ≈ 300m (a "aproximação declarada")
          */}
          <Layer
            id="location-halo"
            type="circle"
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 52, 17, 416],
              'circle-color': '#0891b2',
              'circle-opacity': 0.15,
            }}
          />
          <Layer
            id="location-core"
            type="circle"
            paint={{
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 32, 17, 250],
              'circle-color': '#0891b2',
              'circle-opacity': 0.45,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />
        </Source>
      </Map>
    </div>
  )
}
