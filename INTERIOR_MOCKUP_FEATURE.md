# Automatisk interiørvisualisering - Feature dokumentasjon

## Oversikt

Denne featuren genererer automatisk interiør-mockups av perlemønstre når de opprettes som produkter. Mønsteret vises innrammet og plassert på en vegg i et ekte rom, med riktig skala basert på fysiske dimensjoner.

## Hvordan det fungerer

### Brukeropplevelse
1. Bruker laster opp bilde og genererer perlemønster
2. Bruker klikker "Opprett produkt"
3. **Automatisk**: Systemet genererer interiør-mockup basert på mønsterets størrelse
4. Produktet opprettes i Sanity med 2 bilder:
   - **Bilde 1**: Mønsterbildet (primary)
   - **Bilde 2**: Interiør-mockup med mønsteret på veggen

### Teknisk flyt
```
Mønster genereres (f.eks. 2x2 brett = 58x58 perler = ~30x30 cm)
    ↓
Bruker oppretter produkt
    ↓
Backend henter room template fra Sanity (boardsDimension: "2x2")
    ↓
Mockup Generator:
  1. Legger ramme rundt mønsteret
  2. Anvender perspektiv-transformasjon
  3. Plasserer innrammet mønster i rombildet
    ↓
Mockup lastes opp til Sanity
    ↓
Produkt opprettes med begge bildene
```

## Komponenter

### 1. Sanity Schema: `roomTemplate`
**Fil**: [sanity/schemaTypes/roomTemplate.ts](sanity/schemaTypes/roomTemplate.ts)

Definerer struktur for interiørbilder i Sanity:
- `boardsDimension`: Matcher `{boards_width}x{boards_height}` (f.eks. "2x2", "4x4")
- `image`: Interiørbildet
- `frameZone`: Koordinater for hvor mønsteret skal plasseres (4 hjørner)
- `frameStyle`: Rammefarge (black, white, wood)
- `roomType`, `style`: Kategorisering
- `isActive`: Om denne skal brukes
- `sortOrder`: Prioritet hvis flere matcher

### 2. Backend Services

#### RoomTemplateService
**Fil**: [backend/app/services/room_template_service.py](backend/app/services/room_template_service.py)

- `get_room_template_for_dimensions()`: Finner room template i Sanity basert på brett-dimensjon
- `download_room_image()`: Laster ned interiørbildet fra Sanity CDN

#### MockupGenerator
**Fil**: [backend/app/services/mockup_generator.py](backend/app/services/mockup_generator.py)

- `add_frame()`: Legger ramme rundt mønsteret
- `apply_perspective_transform()`: Anvender perspektiv-transformasjon med OpenCV
- `generate_mockup()`: Hovedfunksjon som genererer ferdig mockup

### 3. API Integration
**Fil**: [backend/app/api/products.py](backend/app/api/products.py)

Oppdatert `create_product_from_pattern_data()` endpoint:
1. Laster opp mønsterbilde til Sanity
2. **NYT**: Henter matching room template
3. **NYT**: Genererer mockup
4. **NYT**: Laster opp mockup til Sanity
5. Oppretter produkt med alle bilder

## Oppsett

### 1. Sanity Schema
Sanity schema er allerede oppdatert. Kjør Sanity Studio for å se nye "Interiørbilder (Room Templates)".

```bash
cd sanity
npm run dev
```

### 2. Opprett Room Templates
Se detaljert guide: [ROOM_TEMPLATE_SETUP.md](ROOM_TEMPLATE_SETUP.md)

**Rask start:**
1. Åpne Sanity Studio
2. Create → "Interiørbilder (Room Templates)"
3. Last opp interiørbilde
4. Sett `boardsDimension` (f.eks. "2x2")
5. Definer frame zone koordinater
6. Velg rammestil
7. Publish

### 3. Testing
```bash
# Start backend
cd backend
python -m uvicorn app.main:app --reload

# Generer mønster og opprett produkt
# Sjekk logger for mockup-generering
```

## Eksempel: Room Template for 2x2 brett

```typescript
{
  name: "Moderne stue - 2x2 brett",
  boardsDimension: "2x2",  // Matcher 58x58 perler
  frameZone: {
    topLeft: { x: 720, y: 280 },
    topRight: { x: 1050, y: 300 },
    bottomLeft: { x: 740, y: 540 },
    bottomRight: { x: 1030, y: 560 }
  },
  frameStyle: "black",
  roomType: "living_room",
  isActive: true,
  sortOrder: 0
}
```

## Brett-dimensjoner og fysiske størrelser

| Brett (WxH) | Perler | Fysisk størrelse | Use case |
|-------------|--------|------------------|----------|
| 1x1         | 29x29  | ~15x15 cm        | Små dekorelementer |
| 2x2         | 58x58  | ~30x30 cm        | Mest populær, små bilder |
| 3x3         | 87x87  | ~45x45 cm        | Medium bilder |
| 4x4         | 116x116| ~60x60 cm        | Store bilder |
| 6x6         | 174x174| ~90x90 cm        | Kunstprosjekter |

*Beregning: 1 perle ≈ 1.034 cm, 29 perler per brett = ~30 cm*

## Avhengigheter

Alle avhengigheter er allerede i `requirements.txt`:
- `opencv-contrib-python>=4.8.0` - Perspektiv-transformasjon
- `Pillow>=11.0.0` - Bildebehandling
- `numpy>=2.2.0` - Array-operasjoner
- `httpx>=0.27.0` - HTTP-requests til Sanity

## Feilhåndtering

Mockup-generering feiler **ikke** hele produktopprettelsen:
- Hvis ingen room template finnes → Warning i logger, produkt opprettes uten mockup
- Hvis mockup-generering feiler → Warning i logger, produkt opprettes uten mockup
- Pattern image og styled image lastes alltid opp

## Logging

Backend logger gir full innsikt:
```
INFO: Looking for room template for dimensions: 2x2
INFO: Found room template: Moderne stue - medium størrelse
INFO: Generating mockup: pattern=(1160, 1160), room=(1920, 1080), frame=black
INFO: Framed pattern size: (1251, 1251)
INFO: Mockup generated successfully: (1920, 1080)
INFO: Uploaded mockup to Sanity: image-abc123...
```

## Fremtidige forbedringer (ikke implementert)

- [ ] Bruker velger room template manuelt
- [ ] Flere rammer (border styles)
- [ ] Juster frame størrelse basert på pattern størrelse
- [ ] Support for custom room templates per bruker
- [ ] AI-genererte interiører med Stable Diffusion
- [ ] AR preview med WebXR

## Filstruktur

```
perle/
├── sanity/
│   └── schemaTypes/
│       ├── roomTemplate.ts          # NYT: Sanity schema
│       └── index.ts                 # Oppdatert: importerer roomTemplate
├── backend/
│   └── app/
│       ├── services/
│       │   ├── room_template_service.py  # NYT: Henter room templates
│       │   ├── mockup_generator.py       # NYT: Genererer mockups
│       │   └── sanity_service.py         # Eksisterende
│       └── api/
│           └── products.py               # Oppdatert: Integrerer mockup
├── ROOM_TEMPLATE_SETUP.md           # Detaljert setup-guide
└── INTERIOR_MOCKUP_FEATURE.md       # Denne filen
```

## Support

For spørsmål eller problemer:
1. Sjekk [ROOM_TEMPLATE_SETUP.md](ROOM_TEMPLATE_SETUP.md) for setup-hjelp
2. Sjekk backend logs: `docker logs perle-backend-1`
3. Verifiser room templates i Sanity Studio

---

**Status**: ✅ Ferdig implementert og klar til testing
**Versjon**: 1.0.0
**Dato**: 2026-01-10
