# Prompt for designere som skal jobbe med Pearly

Kopier og lim inn denne prompten til Claude Code når du skal begynne å jobbe:

---

Hei! Jeg skal jobbe med frontend design på Pearly-prosjektet. Dette er hva du trenger å vite:

## Min rolle
Jeg er designer og skal gjøre små UI/styling-endringer i frontend. Jeg er ikke så kjent med Git/GitHub workflow, så jeg trenger hjelp med:
- Å lage brancher
- Å commite endringer
- Å lage pull requests
- Å kjøre opp frontenden lokalt

## Prosjektinfo
- **Repository:** <https://github.com/EliseJohnsen/pearly>
- **Base branch for PRs:** `dev` (IKKE main!)
- **Frontend:** Next.js 16 med React 19 og Tailwind CSS 4
- **Lokalisering:** Vi bruker norsk i UI

## Hva jeg trenger hjelp med

### 1. Før jeg starter å jobbe
Hjelp meg å:
1. Sjekke hvilken branch jeg er på
2. Lage en ny branch fra `dev` med et beskrivende navn (f.eks. `design/update-button-styling`)
3. Starte frontend development server lokalt

### 2. Når jeg jobber
- Jeg vil primært gjøre styling-endringer med Tailwind CSS
- **VIKTIG:** Bruk alltid farger fra design systemet i `frontend/app/globals.css`
- Hjelp meg å finne riktige komponenter å endre
- Forklar hvilke Tailwind classes jeg bør bruke

### 3. Når jeg er ferdig
Hjelp meg å:
1. Se hva jeg har endret (`git status` og `git diff`)
2. Commite endringene med en god commit-melding
3. Pushe til GitHub
4. Lage en Pull Request mot `dev` branch

## Viktige regler for styling
- **Alltid bruk design system-farger** fra globals.css (aldri hardkodede hex-verdier)
- **For å endre eller legge til farger:** Rediger CSS custom properties i `frontend/app/globals.css` (f.eks. `--primary: #F05A41;`)
- Bruk Tailwind utility classes (f.eks. `bg-primary`, `text-white`, `p-4`)
- Test endringer i nettleseren på både desktop og mobil
- Spør hvis du er usikker på hvilken Tailwind class du skal bruke

## Eksempel på typiske oppgaver
- "Oppdater button-styling til å ha rounded corners og hover effekt"
- "Gjør headeren responsiv for mobil"
- "Endre farge på alle lenker til å bruke primary color"
- "Legg til mer spacing mellom produkt-kortene"

Kan du hjelpe meg å komme i gang? Først vil jeg gjerne at du:
1. Sjekker hvilken branch jeg er på nå
2. Hjelper meg å lage en ny design-branch
3. Starter frontend development server

---

## Tips til bruk

### Når du skal starte en ny oppgave:
```
Jeg skal [beskrivelse av oppgave]. Kan du hjelpe meg å:
1. Lage en ny branch med et passende navn
2. Finne riktige filer å endre
3. Starte dev server hvis den ikke kjører
```

### Når du er ferdig med endringer:
```
Jeg er ferdig med endringene mine. Kan du hjelpe meg å:
1. Se over hva jeg har endret
2. Commite med en god melding
3. Pushe og lage PR mot dev branch
```

### Når du lurer på styling:
```
Hvordan kan jeg [ønsket styling]? Hvilke Tailwind classes skal jeg bruke?
```

### Hvis noe går galt:
```
Jeg har gjort en feil / det ser feil ut. Kan du hjelpe meg å fikse det?
```
