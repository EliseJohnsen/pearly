# Admin API-nøkler - Håndtering og Bruk

Dette dokumentet forklarer hvordan du oppretter og regenererer API-nøkler for admin-brukere i Perle-applikasjonen.

## 📚 Bakgrunn

Admin-autentisering i Perle fungerer med API-nøkler i stedet for passord. Dette er designet for:
- **Enkel distribusjon**: Del én nøkkel i stedet for brukernavn + passord
- **Enkel rotasjon**: Regenerer nøkkel hvis den kompromitteres
- **Stateless autentisering**: API-nøkkel byttes til JWT-token ved innlogging

### Autentiseringsflyt

```
1. Admin logger inn med API-nøkkel
2. Backend validerer nøkkelen mot hashet versjon i database
3. Backend genererer JWT-token (30 dagers gyldighet)
4. JWT-token brukes for alle etterfølgende requests
```

## 🔑 Din Nåværende API-nøkkel

```
admin_WdIZ9vQpoebHi_-YJK0uGe4_BgIAEJZ5NbB4wb7ntwQ
```

### Slik logger du inn

1. **Lokal utvikling**: Gå til [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
2. **Produksjon**: Gå til [https://pearly-bice.vercel.app/admin/login](https://pearly-bice.vercel.app/admin/login)
3. Lim inn API-nøkkelen ovenfor
4. Klikk "Logg inn"

## 🛠️ Hvordan Opprette Nye API-nøkler

### Alternativ 1: Opprette Ny Admin-bruker

Bruk scriptet `create_admin.py` for å opprette en helt ny admin-bruker:

```bash
cd backend
python scripts/create_admin.py --name "Brukerens Navn" --email "bruker@perle.no"
```

**Eksempel:**
```bash
python scripts/create_admin.py --name "John Doe" --email "john@perle.no"
```

**Output:**
```
======================================================================
SUCCESS: Admin bruker opprettet!
======================================================================
Navn: John Doe
E-post: john@perle.no
API-nøkkel: admin_xyz123abc456...
======================================================================
```

### Alternativ 2: Regenerere Nøkkel for Eksisterende Bruker

Hvis du mister nøkkelen eller den kompromitteres, bruk `regenerate_api_key.py`:

```bash
cd backend
python scripts/regenerate_api_key.py --email "elise@perle.no"
```

**Output:**
```
======================================================================
SUCCESS: API key regenerated!
======================================================================
Name: Elise Johnsen
Email: elise@perle.no
New API Key: admin_abc123xyz456...
======================================================================
```

### Alternativ 3: Manuelt via Databasespørring (Avansert)

Hvis du har direkte databasetilgang kan du også opprette nøkler manuelt:

```python
from app.core.auth import generate_api_key, hash_api_key
from app.models.admin_user import AdminUser

# Generer ny nøkkel
api_key = generate_api_key(prefix="admin")
api_key_hash = hash_api_key(api_key)

# Finn bruker og oppdater
admin = db.query(AdminUser).filter(AdminUser.email == "elise@perle.no").first()
admin.api_key_hash = api_key_hash
db.commit()

print(f"New API key: {api_key}")
```

## ⚠️ Sikkerhetshensyn

### Nøkkeloppbevaring
- **Aldri commit API-nøkler til Git**
- Lagre nøkler i password manager (f.eks. 1Password, Bitwarden)
- Del nøkler over sikker kanal (f.eks. kryptert e-post eller direktemelding)

### Nøkkelrotasjon
Regenerer API-nøkkel hvis:
- Nøkkelen har blitt delt utilsiktet
- Bruker med tilgang ikke lenger skal ha tilgang
- Som rutinemessig sikkerhetstiltak (f.eks. hvert 6. måned)

### Nøkkelformat
API-nøkler har formatet: `admin_{random_43_characters}`

Eksempel:
```
admin_WdIZ9vQpoebHi_-YJK0uGe4_BgIAEJZ5NbB4wb7ntwQ
```

## 📊 Administrere Admin-brukere

### Se Alle Admin-brukere (SQL)

```sql
SELECT id, name, email, is_active, created_at, last_login
FROM admin_users
ORDER BY created_at DESC;
```

### Deaktivere Admin-bruker (SQL)

```sql
UPDATE admin_users
SET is_active = false
WHERE email = 'john@perle.no';
```

### Slette Admin-bruker (SQL)

```sql
DELETE FROM admin_users
WHERE email = 'john@perle.no';
```

## 🔍 Feilsøking

### "Invalid API key" ved innlogging

**Årsaker:**
- Nøkkelen er skrevet inn feil (sjekk mellomrom før/etter)
- Nøkkelen har blitt regenerert
- Admin-brukeren er deaktivert (`is_active = false`)

**Løsning:**
Regenerer nøkkelen med `regenerate_api_key.py`

### "Admin account is inactive"

**Årsak:**
Brukeren er deaktivert i databasen.

**Løsning:**
```sql
UPDATE admin_users
SET is_active = true
WHERE email = 'elise@perle.no';
```

### Script fungerer ikke på Windows

**Årsak:**
Python encoding-problemer med emoji i output.

**Løsning:**
Bruk `regenerate_api_key.py` som ikke bruker emojis i stedet for `create_admin.py`.

## 📁 Kode-referanser

Relevante filer for admin-autentisering:
- [backend/app/models/admin_user.py](backend/app/models/admin_user.py) - AdminUser database model
- [backend/app/core/auth.py](backend/app/core/auth.py) - API key generation og hashing
- [backend/app/api/auth.py](backend/app/api/auth.py) - Login endpoint
- [backend/app/core/dependencies.py](backend/app/core/dependencies.py) - Auth dependencies
- [backend/scripts/create_admin.py](backend/scripts/create_admin.py) - Create new admin
- [backend/scripts/regenerate_api_key.py](backend/scripts/regenerate_api_key.py) - Regenerate API key

## 🚀 Best Practices

1. **Én nøkkel per bruker**: Ikke del samme nøkkel mellom flere personer
2. **Dokumenter hvem som har tilgang**: Hold oversikt over aktive admin-brukere
3. **Roter nøkler regelmessig**: Spesielt etter at noen slutter
4. **Bruk beskrivende navn**: Sett fornavn + etternavn på admin-brukere
5. **Sjekk last_login**: Se når hver admin sist logget inn for å identifisere inaktive kontoer
