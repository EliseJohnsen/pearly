# Room Template Setup Guide

Dette dokumentet forklarer hvordan du setter opp interiørbilder (room templates) i Sanity for automatisk mockup-generering.

## Oversikt

Når et perlemønster opprettes som produkt, vil systemet automatisk:
1. Finne riktig interiørbilde basert på mønsterets brett-dimensjon (f.eks. 2x2, 4x4)
2. Generere en mockup med mønsteret innrammet og plassert på veggen
3. Legge mockup-bildet til som **produktbilde #2** (etter mønsterbildet)

## Opprett Room Template i Sanity

### 1. Gå til Sanity Studio
- Åpne Sanity Studio: `http://localhost:3333` (eller din produksjons-URL)
- Logg inn med Sanity-kontoen din

### 2. Opprett nytt Room Template
1. Klikk på **"+ Create"**
2. Velg **"Interiørbilder (Room Templates)"**

### 3. Fyll ut feltene

#### Grunnleggende informasjon
- **Navn**: Beskrivende navn (f.eks. "Moderne stue - medium størrelse")
- **Interiørbilde**: Last opp et høykvalitets interiørbilde (anbefalt min. 1920x1080px)
- **Brett-dimensjon**: Format `WxH` (f.eks. `2x2`, `4x4`, `6x6`)
  - `2x2` = 58x58 perler (~30x30 cm)
  - `4x4` = 116x116 perler (~60x60 cm)
  - `6x6` = 174x174 perler (~90x90 cm)

#### Frame Zone (Ramme-sone)
Dette definerer hvor mønsteret skal plasseres i bildet. Du må finne koordinatene for de fire hjørnene av området hvor rammen skal være.

**Tips for å finne koordinater:**
1. Åpne interiørbildet i et bildebehandlingsprogram (Photoshop, GIMP, etc.)
2. Finn x,y-koordinatene for hvert hjørne av området hvor bildet skal henge
3. Koordinatene starter fra øvre venstre hjørne (0,0)

**Eksempel:**
```
Øvre venstre:  { x: 450, y: 200 }
Øvre høyre:    { x: 850, y: 220 }  (litt skjevt for perspektiv)
Nedre venstre: { x: 480, y: 580 }
Nedre høyre:   { x: 820, y: 600 }
```

#### Andre felt
- **Rammestil**: Velg mellom Svart, Hvit eller Tre
- **Romtype**: Valgfri kategorisering (Stue, Soverom, etc.)
- **Stil**: Valgfri kategorisering (Moderne, Skandinavisk, etc.)
- **Aktiv**: La denne være `true` for at bildet skal brukes
- **Sorteringsrekkefølge**: Hvis du har flere bilder for samme dimensjon, brukes det med lavest nummer

### 4. Lagre
Klikk **"Publish"** for å gjøre room template tilgjengelig.

## Eksempelbilder

### Anbefalt bildestørrelser
| Brett-dimensjon | Perler | Fysisk størrelse | Anbefalt bildeoppløsning |
|-----------------|--------|------------------|--------------------------|
| 1x1             | 29x29  | ~15x15 cm        | 1920x1080                |
| 2x2             | 58x58  | ~30x30 cm        | 1920x1080                |
| 3x3             | 87x87  | ~45x45 cm        | 2560x1440                |
| 4x4             | 116x116| ~60x60 cm        | 2560x1440                |
| 6x6             | 174x174| ~90x90 cm        | 3840x2160                |

### Tips for gode interiørbilder

1. **Høy oppløsning**: Minimum 1920x1080px, helst høyere
2. **God belysning**: Naturlig lys fungerer best
3. **Ren vegg**: Velg en vegg uten for mye detaljer
4. **Perspektiv**: Et lite perspektiv (ikke helt rett forfra) ser mer naturlig ut
5. **Kontrast**: Sørg for at veggen har nok kontrast til at rammen vises tydelig
6. **Møbler**: Ha møbler i bildet for skala-referanse (sofa, konsollbord, etc.)

## Hvordan finne koordinater med bildebehandlingsprogram

### Metode 1: Photoshop
1. Åpne bildet i Photoshop
2. Velg **"Move Tool"** (V)
3. Hold musepekeren over ønsket punkt
4. Se koordinater i **Info-panelet** (Window > Info)

### Metode 2: GIMP (gratis)
1. Åpne bildet i GIMP
2. Velg **Pointer-verktøyet**
3. Koordinater vises nederst i venstre hjørne når du holder over et punkt

### Metode 3: Online verktøy
1. Gå til https://www.image-map.net/
2. Last opp bildet
3. Klikk på punkter for å se koordinater

### Metode 4: Python script (for utviklere)
```python
from PIL import Image
import matplotlib.pyplot as plt

img = Image.open("room.jpg")
plt.imshow(img)
plt.title("Klikk for å se koordinater")
plt.axis('on')

def onclick(event):
    print(f"x={int(event.xdata)}, y={int(event.ydata)}")

plt.gcf().canvas.mpl_connect('button_press_event', onclick)
plt.show()
```

## Testing

### Test at room template fungerer
1. Opprett et perlemønster med matching dimensjon
2. Klikk "Opprett produkt" i pattern display
3. Sjekk backend-logger for:
   ```
   Looking for room template for dimensions: 2x2
   Found room template: Moderne stue - medium størrelse
   Uploaded mockup to Sanity: image-...
   ```
4. Gå til produktet i Sanity Studio
5. Verifiser at det er 2 bilder:
   - Bilde 1: Mønsteret (isPrimary: true)
   - Bilde 2: Interior mockup

## Feilsøking

### Mockup genereres ikke
**Årsaker:**
- Ingen room template med matching dimensjon i Sanity
- Room template er satt til `isActive: false`
- Feil i frame zone koordinater

**Sjekk:**
1. Logger i backend: `docker logs perle-backend-1`
2. Sanity Studio: Verifiser at room template eksisterer og er aktiv
3. Dimensjon matcher: `boardsDimension` må være nøyaktig samme som `{boards_width}x{boards_height}`

### Mockup ser feil ut
**Årsaker:**
- Frame zone koordinater er feil
- Bildet har feil perspektiv

**Løsning:**
1. Dobbeltsjekk koordinatene i bildebehandlingsprogram
2. Juster koordinatene i Sanity Studio
3. Test på nytt

### Ramme ser feil ut
**Årsaker:**
- Feil rammestil valgt

**Løsning:**
1. Endre `frameStyle` i room template
2. Test med forskjellige stiler (black, white, wood)

## Vedlikehold

### Legge til nye størrelser
Når du vil støtte nye brett-dimensjoner:
1. Finn eller ta bilde av passende interiør
2. Opprett nytt room template i Sanity
3. Sett riktig `boardsDimension` (f.eks. `3x3` eller `5x5`)

### Oppdatere eksisterende bilder
1. Gå til room template i Sanity Studio
2. Last opp nytt bilde
3. Juster frame zone hvis nødvendig
4. Klikk "Publish"

## Beste praksis

### MVP-anbefaling (Start med disse)
1. **2x2 brett** (58x58 perler, ~30x30 cm)
   - Mest populær størrelse for små prosjekter
   - Enklest å plassere i interiør

2. **4x4 brett** (116x116 perler, ~60x60 cm)
   - God mellomstørrelse
   - Fungerer godt på store vegger

3. **6x6 brett** (174x174 perler, ~90x90 cm)
   - Store kunstprosjekter
   - Trengs mindre ofte

### Flere bilder per dimensjon
Du kan ha flere room templates for samme dimensjon:
- Forskjellige romtyper (stue, soverom, kontor)
- Forskjellige stiler (moderne, skandinavisk, minimalistisk)
- Systemet velger det med **lavest sortOrder**

## Eksempel: Komplett Room Template

```json
{
  "name": "Moderne stue med grå sofa - Medium (2x2)",
  "boardsDimension": "2x2",
  "frameZone": {
    "topLeft": { "x": 720, "y": 280 },
    "topRight": { "x": 1050, "y": 300 },
    "bottomLeft": { "x": 740, "y": 540 },
    "bottomRight": { "x": 1030, "y": 560 }
  },
  "frameStyle": "black",
  "roomType": "living_room",
  "style": "modern",
  "isActive": true,
  "sortOrder": 0
}
```

## Arkitektur

### Flyt
1. Bruker genererer mønster (f.eks. 2x2 brett)
2. Bruker klikker "Opprett produkt"
3. Backend:
   - Laster opp mønsterbilde til Sanity
   - Henter room template med `boardsDimension: "2x2"`
   - Genererer mockup med perspektiv-transformasjon
   - Laster opp mockup til Sanity
   - Oppretter produkt med begge bildene

### Rekkefølge av produktbilder
1. **Bilde 1 (isPrimary: true)**: Mønsterbildet
2. **Bilde 2**: Interior mockup (hvis room template finnes)
3. **Bilde 3**: Styled image (hvis AI-stil ble brukt)

Dette sikrer at produktsiden alltid viser mønsteret først, etterfulgt av interiørvisualisering.
