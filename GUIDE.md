# Handleiding: aanbod en boekingen beheren

Alles hieronder doe je zelf, zonder hulp van een ontwikkelaar.

## 1. Hoe werken de knoppen op de website?

- **"Eerste intake 60 minuten"** (menu, home, contact) gaat naar de individuele intake in Cal.com.
- **"Bekijk alle sessies" / "Alle andere sessies"** gaat naar je centrale Cal.com-pagina https://cal.com/talk2. Cliënten kiezen daar zelf hun sessietype (duo, koppel, natuur, vervolg). Hier hoef je nooit iets aan te passen, ook niet bij nieuwe diensten.
- Zet in Cal.com duidelijke namen op je afspraaktypes, zodat niemand twijfelt:
  - **Duo-begeleiding (ouder + kind)** – overdag, ook in de natuur
  - **Koppelbegeleiding** – 's avonds
- **Knop bij een concreet aanbod** (bv. een wandelsessie of workshop): die stel je in via het dashboard (zie punt 2).

## 2. Een nieuw aanbod toevoegen (dashboard → Aanbod)

1. Klik op **+ Nieuw aanbod**.
2. Vul titel, doelgroep, intro, beschrijving, datum, locatie en prijs in.
3. Kies bij **"Hoe schrijft men zich in?"**:
   - **Via e-mail naar Veerle (standaard)** – gebruik dit als er nog geen datum of Cal.com-afspraaktype is. De knop "Stuur een e-mail" opent een mail aan veerle@talk2.be, met de titel van het aanbod al in het onderwerp.
   - **Online boeken via Cal.com** – plak de link van het afspraaktype (zie punt 3), of gebruik https://cal.com/talk2 voor al je sessies. De knop wordt "Boek deze sessie".
4. Zet **Gepubliceerd** aan en klik op **Opslaan**.

Wisselen tussen e-mail en Cal.com kan altijd: kies de andere optie en sla op.

## 3. Een Cal.com-link maken en koppelen

1. Log in op Cal.com → **Event Types** → **New**.
2. Geef een duidelijke titel (bv. "Wandelsessie ZEE – duobegeleiding"), kies de duur en zet je beschikbaarheid.
3. Open het afspraaktype en klik op **Copy link**. Die ziet er zo uit: `https://cal.com/talk2/naam-van-sessie`.
4. Plak die link in het dashboard bij het aanbod (keuze "Online boeken via Cal.com") en sla op.

## 4. Updates verschijnen niet op de website (Vercel)

Wijzigingen via het dashboard staan meteen online. Een nieuwe versie van de website kan soms even duren. Zie je na enkele minuten nog niets?

1. Ververs de pagina met Ctrl+F5.
2. Log uit op het Vercel-dashboard en log opnieuw in.
3. Controleer of de laatste deployment op "Ready" staat.

## 5. Contactformulier

Berichten komen toe in je mailbox en staan ook in het dashboard. Controleer bij problemen in Vercel of `RESEND_API_KEY` is ingesteld.
