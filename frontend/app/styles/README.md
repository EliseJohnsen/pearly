# Fargeprofil for Bead it!

Dette prosjektet bruker en sentralisert fargeprofil som gjør det enkelt å endre farger i hele applikasjonen fra ett sted.

## Hvordan bruke fargeprofilen

### Metode 1: CSS-variabler (anbefalt for inline styles)

Bruk CSS-variablene definert i `globals.css`:

```tsx
<div style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>
  Innhold
</div>
```

### Metode 2: Tailwind-klasser med variabler

Tailwind CSS v4 støtter automatisk CSS-variabler:

```tsx
<div className="bg-[var(--card-bg)] text-[var(--text-primary)]">
  Innhold
</div>
```

### Metode 3: TypeScript fargeobjekt

Importer fargeobjektet fra `colors.ts`:

```tsx
import { colors } from '@/app/styles/colors';

<div style={{ backgroundColor: colors.card.light.bg }}>
  Innhold
</div>
```

## Tilgjengelige fargevariabler

### CSS-variabler (i globals.css)

#### Bakgrunnsfarger
- `--background` - Hoved bakgrunnsfarge
- `--background-secondary` - Sekundær bakgrunnsfarge
- `--foreground` - Forgrunns/tekstfarge

#### Primærfarger
- `--primary` - Primær aksentfarge (blå)
- `--primary-hover` - Hover-tilstand for primærfarge
- `--primary-light` - Lys variant av primærfarge
- `--primary-dark` - Mørk variant av primærfarge

#### Sekundærfarger
- `--success` - Suksessfarge (grønn)
- `--success-hover` - Hover-tilstand for suksessfarge

#### Tekstfarger
- `--text-primary` - Primær tekstfarge
- `--text-secondary` - Sekundær tekstfarge
- `--text-muted` - Dempet tekstfarge

#### Kantfarger
- `--border` - Standard kantfarge
- `--border-subtle` - Subtil kantfarge

#### Kortkomponenter
- `--card-bg` - Bakgrunnsfarge for kort
- `--card-border` - Kantfarge for kort

#### Info-bokser
- `--info-bg` - Bakgrunnsfarge for info-bokser
- `--info-text` - Tekstfarge for info-bokser
- `--info-accent` - Aksentfarge for info-bokser

#### Input-komponenter
- `--input-bg` - Bakgrunnsfarge for input-felt
- `--input-border` - Kantfarge for input-felt

#### Disabled states
- `--disabled-bg` - Bakgrunnsfarge for disabled-tilstand
- `--disabled-text` - Tekstfarge for disabled-tilstand

#### Gradient
- `--gradient-from` - Start-farge for gradienter
- `--gradient-to` - Slutt-farge for gradienter

## Dark Mode

Alle farger har automatisk støtte for dark mode via `@media (prefers-color-scheme: dark)`.

Når brukerens system er i dark mode, vil variablene automatisk bytte til mørke verdier.

## Endre farger

For å endre farger i hele applikasjonen:

1. **For CSS-tilnærmingen:** Rediger verdiene i `app/globals.css` under `:root` og `@media (prefers-color-scheme: dark)`

2. **For TypeScript-tilnærmingen:** Rediger verdiene i `app/styles/colors.ts`

## Eksempel: Endre primærfarge fra blå til lilla

I `globals.css`:

```css
:root {
  --primary: #9333ea;          /* purple-600 */
  --primary-hover: #7e22ce;    /* purple-700 */
  --primary-light: #faf5ff;    /* purple-50 */
  --primary-dark: #581c87;     /* purple-900 */
}
```

I `colors.ts`:

```typescript
primary: {
  DEFAULT: '#9333ea',  // purple-600
  hover: '#7e22ce',    // purple-700
  light: '#faf5ff',    // purple-50
  dark: '#581c87',     // purple-900
},
```

Dette vil automatisk oppdatere alle knapper, lenker og aksenter i hele applikasjonen!
