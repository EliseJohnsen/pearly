# Migreringsguide: Bruk av fargeprofilen

Denne guiden viser hvordan du kan refaktorere eksisterende komponenter til å bruke den nye fargeprofilen.

## Eksempel: Før og etter

### Før (hardkodede Tailwind-klasser)

```tsx
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
    Overskrift
  </h2>
  <p className="text-gray-600 dark:text-gray-400">
    Dette er tekst
  </p>
  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg">
    Klikk her
  </button>
</div>
```

### Etter (med CSS-variabler)

```tsx
<div className="bg-[var(--card-bg)] rounded-lg shadow-lg p-8">
  <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
    Overskrift
  </h2>
  <p className="text-[var(--text-secondary)]">
    Dette er tekst
  </p>
  <button className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold py-3 px-6 rounded-lg">
    Klikk her
  </button>
</div>
```

### Etter (med utility-klasser)

Først, importer utility-klassene i `globals.css`:

```css
@import "./styles/tailwind-utils.css";
```

Deretter:

```tsx
<div className="card">
  <h2 className="text-2xl font-bold text-app-primary mb-4">
    Overskrift
  </h2>
  <p className="text-app-secondary">
    Dette er tekst
  </p>
  <button className="btn-primary">
    Klikk her
  </button>
</div>
```

## Vanlige erstatninger

| Gammel Tailwind-klasse | CSS-variabel | Utility-klasse |
|------------------------|--------------|----------------|
| `bg-white dark:bg-gray-800` | `bg-[var(--card-bg)]` | `bg-app-primary` eller `.card` |
| `text-gray-900 dark:text-white` | `text-[var(--text-primary)]` | `text-app-primary` |
| `text-gray-600 dark:text-gray-400` | `text-[var(--text-secondary)]` | `text-app-secondary` |
| `text-gray-500 dark:text-gray-400` | `text-[var(--text-muted)]` | `text-app-muted` |
| `bg-blue-600 hover:bg-blue-700` | `bg-[var(--primary)] hover:bg-[var(--primary-hover)]` | `btn-primary` |
| `bg-green-600 hover:bg-green-700` | `bg-[var(--success)] hover:bg-[var(--success-hover)]` | `btn-success` |
| `border-gray-300 dark:border-gray-600` | `border-[var(--border)]` | - |
| `bg-blue-50 dark:bg-blue-900/20` | `bg-[var(--info-bg)]` | `.info-box` |

## Refaktorering steg-for-steg

1. **Identifiser farger som gjentas**: Se etter Tailwind-klasser som brukes mange steder
2. **Erstatt med CSS-variabler**: Bytt ut hardkodede klasser med `var(--variabel-navn)`
3. **Test dark mode**: Sjekk at alt ser riktig ut i både light og dark mode
4. **Vurder utility-klasser**: For ofte brukte mønstre, bruk `.card`, `.btn-primary` etc.

## Inline styles (hvis nødvendig)

For komponenter som bruker inline styles (f.eks. dynamiske farger):

```tsx
// Gammel måte
<div style={{ backgroundColor: '#2563eb' }}>Innhold</div>

// Ny måte
<div style={{ backgroundColor: 'var(--primary)' }}>Innhold</div>

// Med TypeScript-objektet
import { colors } from '@/app/styles/colors';
<div style={{ backgroundColor: colors.primary.DEFAULT }}>Innhold</div>
```

## Fordeler med denne tilnærmingen

1. **Én kilde til sannhet**: Endre farger ett sted, oppdater hele appen
2. **Automatisk dark mode**: Ingen behov for `dark:` prefix overalt
3. **Bedre vedlikehold**: Enklere å holde designet konsistent
4. **Fleksibilitet**: Kan enkelt lage temaer eller variasjoner
5. **Type-sikkerhet**: TypeScript-objektet gir autofullføring og type-sjekking

## Neste steg

- Start med de mest brukte komponentene (knapper, kort, tekstfarger)
- Refaktorer én komponent av gangen
- Test grundig i både light og dark mode
- Vurder å lage flere utility-klasser for vanlige mønstre
