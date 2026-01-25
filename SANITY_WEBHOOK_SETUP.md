# Sanity Webhook Oppsett

Dette dokumentet forklarer hvordan du setter opp webhooks i Sanity slik at produkter opprettet i Sanity Studio automatisk synkroniseres til backend-databasen.

## Oversikt

Når en innholdsprodusent oppretter eller oppdaterer et produkt i Sanity Studio, sender Sanity en webhook til backend-API-et som oppretter/oppdaterer produktet i databasen.

## Steg 1: Sett opp Webhook i Sanity Studio

1. Gå til [Sanity Management Console](https://www.sanity.io/manage)
2. Velg ditt prosjekt (`perle` / `qpdup7gv`)
3. Gå til **API** → **Webhooks**
4. Klikk **Create webhook**

## Steg 2: Konfigurer Webhook

Fyll ut følgende felt:

### Name
```
Product Sync to Database
```

### Description (valgfritt)
```
Synkroniserer produkter fra Sanity Studio til backend-database
```

### URL
- **Development:** `http://localhost:8000/api/webhooks/sanity/product`
- **Production:** `https://your-backend-url.com/api/webhooks/sanity/product`

### Dataset
```
production
```

### Trigger on
Velg følgende events:
- ✅ **Create** - Når nye produkter opprettes
- ✅ **Update** - Når produkter oppdateres
- ✅ **Delete** - Når produkter slettes (valgfritt)

### Filter (GROQ)
Bare send webhooks for produkt-dokumenter:
```groq
_type == "products"
```

### Projection (GROQ) - Valgfritt
Du kan begrense hvilke felt som sendes for å redusere payload-størrelse:
```groq
{
  _id,
  _type,
  _rev,
  _deleted,
  productType,
  sku,
  title,
  slug,
  description,
  longDescription,
  status,
  images[]{
    asset->{
      _id,
      url
    },
    alt,
    isPrimary
  },
  patternId,
  category,
  difficulty,
  colors,
  gridSize,
  variants,
  currency,
  vatRate,
  tags,
  order,
  seo
}
```

### Secret (valgfritt, men anbefalt)
Generer en tilfeldig secret for å verifisere webhooks:
```bash
openssl rand -hex 32
```

Lagre denne secreten i backend `.env` filen:
```env
SANITY_WEBHOOK_SECRET=din_genererte_secret_her
```

### HTTP Method
```
POST
```

### HTTP Headers (valgfritt)
Ingen ekstra headers nødvendig.

## Steg 3: Test Webhooket

1. Klikk **Save** for å opprette webhooket
2. Klikk på webhooket i listen
3. Klikk **Test** for å sende en test-payload
4. Sjekk backend-loggene for å bekrefte at webhooket ble mottatt

## Steg 4: Opprett et testprodukt

1. Gå til Sanity Studio (`http://localhost:3333/studio` eller produksjons-URL)
2. Velg **Produkter** i menyen
3. Klikk **Create new product**
4. Fyll ut:
   - **Produkttype:** Velg type (f.eks. "Perler")
   - **SKU:** F.eks. "BEADS-001"
   - **Produktnavn:** F.eks. "Mix perlepakke"
   - **Slug:** Generes automatisk
   - **Beskrivelse:** Kort beskrivelse
   - **Status:** "I salg"
   - **Bilder:** Last opp minst ett bilde
   - **Varianter:** Legg til minst én variant med pris
5. Klikk **Publish**

## Steg 5: Verifiser Synkronisering

Sjekk at produktet ble opprettet i databasen:

### Via API
```bash
curl http://localhost:8000/api/products
```

### Via Database
```sql
SELECT * FROM products WHERE sku = 'BEADS-001';
```

## Webhook Payload Eksempel

Når et produkt opprettes i Sanity, sender webhooket følgende payload:

```json
{
  "_id": "abc123",
  "_type": "products",
  "_rev": "v1",
  "productType": "kit",
  "sku": "BEADS-001",
  "title": "Mix perlepakke",
  "slug": {
    "current": "mix-perlepakke"
  },
  "description": "Fargerik blanding av perler",
  "status": "in_stock",
  "images": [
    {
      "asset": {
        "_ref": "image-abc123-1920x1080-png"
      },
      "alt": "Mix perlepakke",
      "isPrimary": true
    }
  ],
  "variants": [
    {
      "sku": "BEADS-001-500G",
      "name": "500g pakke",
      "price": 149,
      "stockQuantity": 100,
      "isActive": true
    }
  ],
  "currency": "NOK",
  "vatRate": 25,
  "tags": ["perler", "mix"],
  "order": 0
}
```

## Webhook Endpoint Logikk

Backend-endepunktet (`/api/webhooks/sanity/product`) gjør følgende:

1. **Verifiserer signaturen** (hvis SANITY_WEBHOOK_SECRET er satt)
2. **Sjekker om produktet eksisterer:**
   - Søker først etter `sanity_document_id`
   - Hvis ikke funnet, søker etter `sku`
3. **Oppretter eller oppdaterer produktet:**
   - Nye produkter: Oppretter Product, ProductImage og ProductVariant records
   - Eksisterende produkter: Oppdaterer kun Product-felter (ikke images/variants)
4. **Returnerer status:**
   - `201 Created` for nye produkter
   - `200 OK` for oppdateringer

## Viktige Merknader

### Produkter med Mønster
- Produkter opprettet fra backend (med mønster) kan IKKE slettes via Sanity
- `patternId` feltet er optional - bare produkter fra mønster-generatoren har dette

### Bilder og Varianter
- Ved oppdatering av eksisterende produkter, oppdateres IKKE bilder og varianter
- Dette for å unngå at backend-genererte data overskrives
- For å oppdatere bilder/varianter, gjør det via backend-API

### Produkttyper
Følgende produkttyper støttes:
- `pattern` - Perleplatemønstre (kan ha pattern_id)
- `kit` - Perlekit med mønster
- `beads` - Perler uten mønster
- `tools` - Verktøy
- `pegboards` - Perleplater
- `other` - Andre produkter

## Feilsøking

### Webhook mottas ikke
1. Sjekk at backend kjører og er tilgjengelig på webhook URL
2. Sjekk at firewall/security groups tillater innkommende trafikk
3. Sjekk Sanity webhook-loggen for feilmeldinger

### "Invalid webhook signature" feil
1. Sjekk at `SANITY_WEBHOOK_SECRET` i `.env` matcher secret i Sanity
2. Fjern eventuelt webhook secret for testing (ikke anbefalt i produksjon)

### Produkt opprettes ikke i database
1. Sjekk backend-logger for feilmeldinger
2. Verifiser at alle påkrevde felter er fylt ut i Sanity
3. Sjekk at SKU er unik

### "Duplicate key error"
- SKU eksisterer allerede i databasen
- Bruk en annen SKU eller oppdater eksisterende produkt

## Environment Variabler

Legg til følgende i backend `.env`:

```env
# Sanity Configuration
SANITY_PROJECT_ID=qpdup7gv
SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token_here
SANITY_API_VERSION=2024-12-16

# Webhook Security (valgfritt)
SANITY_WEBHOOK_SECRET=your_webhook_secret_here
```

## Neste Steg

Etter webhooket er satt opp:

1. **Test både veier:**
   - Opprett produkt i Sanity → verifiser i database
   - Opprett produkt fra backend → verifiser i Sanity

2. **Sett opp produksjons-webhook:**
   - Bruk produksjons-URL
   - Aktiver webhook secret
   - Test grundig før live-bruk

3. **Overvåkning:**
   - Sett opp logging/monitoring for webhook-feil
   - Sjekk Sanity webhook-logger regelmessig
