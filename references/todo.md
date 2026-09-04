# Map widgets : provider configurable Google / OSM-MapLibre

Issues couvertes : [#453](https://github.com/chairemobilite/evolution/issues/453), [#700](https://github.com/chairemobilite/evolution/issues/700), [#888](https://github.com/chairemobilite/evolution/issues/888), [#1146](https://github.com/chairemobilite/evolution/issues/1146), [#1156](https://github.com/chairemobilite/evolution/issues/1156).

## Décisions arrêtées

- Apple **retiré** (incompatibilité Apple Maps Server API ToU §1.3 avec stockage long terme des résultats de géocodage).
- Deux providers seulement : `google` | `osm`.
- Configurable **par widget** via `mapProvider` ; défaut `google` (rétro-compatible).
- Google : migration vers `@vis.gl/react-google-maps` + `google.maps.places.Place` (resout #453, #1146, #1156).
- OSM : MapLibre (déjà en deps via `react-map-gl` + `maplibre-gl`) + Photon.
- Google reste utilisable car les données OSM ne sont pas encore assez complètes pour la plupart des enquêtes québécoises (constat opérationnel ARTM/MTMD).
- Contrainte Google §5.2 : si `mapProvider: 'google'`, la carte de fond DOIT rester Google. Le mix Google geocoder + tuiles OSM est interdit. Documenté + validé en runtime (warn).

## Architecture cible

```
packages/evolution-frontend/src/components/inputs/maps/
├── InputMapTypes.ts                  # types partagés (déjà là)
├── MapProvider.ts                    # NEW – interface MapProviderAdapter
├── useMapProvider.ts                 # NEW – résout provider depuis widgetConfig + projectConfig
├── google/
│   ├── InputMapGoogle.tsx            # réécrit avec @vis.gl/react-google-maps
│   └── GoogleGeocoder.ts             # Place.searchByText() + Geocoder
└── osm/
    ├── InputMapMaplibre.tsx          # maplibre-gl + react-map-gl
    └── PhotonGeocoder.ts             # Photon (self-host configurable, fallback komoot)
```

`InputMapPoint`, `InputMapFindPlace`, `InfoMap` n'importent plus `InputMapGoogle` directement — ils passent par `useMapProvider()`.

## Changements API publique

`evolution-common/src/services/questionnaire/types/WidgetConfig.ts` — ajout sur `InputMapType` et `InfoMapWidgetConfig` :

```ts
/** Map renderer + geocoder. Defaults to projectConfig.defaultMapProvider ?? 'google'. */
mapProvider?: 'google' | 'osm';
/** When true, displays a search-as-you-type field above the map (issue #700). */
enableAutocomplete?: boolean;
```

`evolution-common/src/config/project.config.ts` :

```ts
defaultMapProvider?: 'google' | 'osm';
osmTiles?: { styleUrl: string };
osmGeocoder?: { url: string };  // Photon-compatible
```

Aucune valeur par défaut hardcodée pour l'URL OSM — chaque déploiement choisit (OpenFreeMap, Protomaps self-host, MapTiler, etc.). Si non défini et `mapProvider: 'osm'`, erreur claire au démarrage du widget.

## Découpage en PRs (petites, distinctes, mergeable individuellement)

### PR 1 — Refacto sans changement de comportement
- [ ] Créer `MapProvider.ts` (interface `MapProviderAdapter`)
- [ ] Créer `useMapProvider.ts` qui retourne l'adapter Google existant
- [ ] `InputMapPoint` / `InputMapFindPlace` / `InfoMap` consomment l'adapter au lieu d'importer Google directement
- [ ] Tests existants verts sans modification de fixture
- [ ] Aucun ajout de dépendance

### PR 2 — Migrer Google vers `@vis.gl/react-google-maps` (#453)
- [ ] Ajouter dep `@vis.gl/react-google-maps`
- [ ] Réécrire `InputMapGoogle.tsx` (`<APIProvider>` + `<Map>` + `<AdvancedMarker>`)
- [ ] Migrer `InfoMap.tsx` (Polyline/Polygon → `useMap` + Maps Drawing)
- [ ] Retirer `@react-google-maps/api` de `package.json`
- [ ] Tests existants paramétriques verts

### PR 3 — Remplacer `PlacesService` par `Place` (#1146 #1156)
- [ ] `GoogleGeocoder.geocodeMultiplePlaces` utilise `Place.searchByText()`
- [ ] `Place.fetchFields(['photos','displayName','formattedAddress','types','id'])` — règle l'image manquante (#1156)
- [ ] Mapping `place_id → id`, conserver les noms de champs publics côté `PlaceGeocodedProperties` pour ne rien casser dans les surveys downstream
- [ ] Tests : mock paramétrique sur l'adapter, pas sur l'API Google brute

### PR 4 — Provider OSM (MapLibre + Photon) (#888)
- [ ] `InputMapMaplibre.tsx` — utilise `react-map-gl/maplibre`
- [ ] `PhotonGeocoder.ts` — `GET {osmGeocoder.url}/api?q=…&lang=…&bbox=…`
- [ ] Mapping résultat Photon → `PlaceGeocodedProperties` (compat avec `InputMapFindPlace`)
- [ ] `useMapProvider` route correctement quand `mapProvider: 'osm'`
- [ ] Tests paramétriques (Google + OSM dans la même suite, table-driven)
- [ ] README : section déploiement OSM (style Maplibre + Photon URL)

### PR 5 — Autocomplete unifié (#700)
- [ ] `enableAutocomplete: true` ajoute un champ au-dessus de la carte
- [ ] Google : `<gmp-place-autocomplete>` (PlaceAutocompleteElement)
- [ ] OSM : input + Photon `/api?q=…` debounced
- [ ] Adapter expose `Autocomplete` component
- [ ] Tests : sélection met à jour la `value` du widget

## Risques et inconnus

- **Tuiles OSM** : pas de défaut hardcodé — choix laissé au déployeur. Documenté.
- **Photon self-host** : à mettre en place côté infra Polytechnique, hors-scope de ces PRs. Pour le dev, `photon.komoot.io` accepté avec rate limit.
- **Test runtime contre §5.2 Google** : si `mapProvider: 'google'` mais qu'un consommateur tente d'injecter un style MapLibre custom, on log un `console.warn` clair. Pas de blocage dur.
- **Données Google déjà en DB > 30 j** : hors-scope de ces PRs (problème opérationnel/légal préexistant). À traiter séparément si l'équipe le décide.

## Documentation à mettre à jour

- `README.md` racine : section "Map provider configuration" avec `GOOGLE_API_KEY`, `osmTiles.styleUrl`, `osmGeocoder.url`.
- JSDoc sur `MapProviderAdapter`, `useMapProvider`, et les nouveaux champs `mapProvider` / `enableAutocomplete`.
- Note explicite sur la contrainte Google §5.2 dans la JSDoc de `mapProvider`.

## Review

_(à remplir après merge — comportement vs main, tests ajoutés, surprises)_
