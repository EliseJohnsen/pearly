# UI Strings Guide

Dette prosjektet støtter flerspråklige UI-strings gjennom Sanity CMS.

## Hvordan det fungerer

### 1. I Sanity Studio

UI strings er satt opp med følgende struktur:

- **Key**: En unik nøkkel (f.eks. `forms.submit`, `buttons.cancel`)
- **Value**: Teksten som skal vises
- **Category**: Kategorisering av strings (forms, buttons, messages, navigation, validation, labels, general)
- **Description**: Hjelpetekst for redaktører

Sanity er konfigurert med internasjonalisering for norsk bokmål (nb) og engelsk (en).

### 2. Opprette UI Strings i Sanity

1. Gå til Sanity Studio
2. Opprett et nytt "UI Strings" dokument
3. Velg språk (nb eller en)
4. Fyll inn:
   - Key: `forms.submit` (bruk lowercase, dots og underscores)
   - Value: `Send inn` (norsk) eller `Submit` (engelsk)
   - Category: `forms`
   - Description: "Submit button text for contact form"
5. Husk å lage begge språkversjoner!

### 3. Bruke UI Strings i Frontend

#### For enkeltstrenger:

```tsx
'use client'

import {useUIString} from '@/app/hooks/useSanityData'

export default function MyComponent() {
  const submitText = useUIString('forms.submit')

  return <button>{submitText}</button>
}
```

#### For alle strings i en kategori:

```tsx
'use client'

import {useUIStringsByCategory} from '@/app/hooks/useSanityData'

export default function MyComponent() {
  const {data: formStrings, loading} = useUIStringsByCategory('forms')

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {formStrings?.map(string => (
        <p key={string.key}>{string.value}</p>
      ))}
    </div>
  )
}
```

#### For alle strings:

```tsx
'use client'

import {useUIStrings} from '@/app/hooks/useSanityData'

export default function MyComponent() {
  const {data: allStrings, loading} = useUIStrings()

  // ... bruk strings
}
```

## Språkvalg

Språket styres automatisk av `LocaleContext`. Når brukeren bytter språk med `LanguageSwitcher`-komponenten, oppdateres alle UI strings automatisk.

```tsx
import {LanguageSwitcher} from '@/app/contexts/LocaleContext'

// Bruk i layout eller navbar
<LanguageSwitcher />
```

## Kategorier

Tilgjengelige kategorier:
- `forms` - Skjemafelter og labels
- `buttons` - Knapper
- `messages` - Meldinger og notifikasjoner
- `navigation` - Navigasjonselementer
- `validation` - Valideringsfeilmeldinger
- `labels` - Generelle labels
- `general` - Annet

## Best Practices

1. **Navngivning**: Bruk beskrivende keys med namespace, f.eks. `forms.email.label`, `validation.email.required`
2. **Fallback**: Hvis en string ikke finnes, vises key-en som fallback
3. **Beskrivelser**: Legg alltid til beskrivelser i Sanity for å hjelpe redaktører
4. **Konsistens**: Bruk samme kategori for relaterte strings
5. **Begge språk**: Husk å alltid lage både norsk og engelsk versjon

## Eksempel

Se [UIStringExample.tsx](frontend/app/components/UIStringExample.tsx) for et fullstendig eksempel.
