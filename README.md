# leesblokjes

## Importbronnen

De vier knoppen boven de invoer openen elk een eigen paneel: **Tekst plakken**,
**Document uploaden**, **Webpagina importeren** en **LeesBlokjes op websites (BETA)**.
Er is altijd precies een paneel open; opnieuw klikken sluit het niet.
Bij het eerste bezoek staat Tekst plakken open. Daarna wordt de laatst gekozen
bron hersteld uit localStorage. Invoer en importstatus blijven behouden bij wisselen.

Webpagina importeren toont alleen Wikipedia-voorbeelden, die via de Wikimedia-API
worden opgehaald. Sites die directe browsertoegang blokkeren zijn geen voorbeelden
meer; hiervoor blijven tekst plakken en de bookmarklet beschikbaar.

## Leesmodi

De compacte instellingen bieden **Woordafstand** direct onder Regelafstand:
0.8x tot 2.4x (standaard 1.0x), met de herkenbare standen Compact (0.8x),
Normaal (1.0x), Ruim (1.4x), Extra ruim (1.8x) en Zeer ruim (2.4x).
De slider verandert direct de ruimte tussen
woorden in normale tekst, lettergreep- en klankweergave. De afstand binnen
woorden verandert niet. Elk volledig woord heeft een `.word-group`-wrapper;
`--word-gap` regelt de buitenmarge onafhankelijk van de kleine interne afstand.
Leestekens blijven bij hun woord en woorden gaan als geheel naar de volgende regel.
Een uitzonderlijk breed woord kan binnen de leeskaart horizontaal worden gescrold,
zonder de pagina te verbreden. De voorkeur wordt in het leesprofiel opgeslagen;
oudere waarden boven 2.4x worden tot 2.4x begrensd.

Onder Dyslexiemodus kies je daarnaast **Alineablokken** (standaard) of
**Doorlopende tekst**. Deze keuze staat los van Lettergrepen/Klanken en wordt ook
opgeslagen. Wisselen gebruikt de al verwerkte tekst, zonder nieuwe import of
tekstopdeling. De centrale `renderBlocks`-functie verzorgt beide weergaven.
Doorlopende tekst gebruikt precies een brede leeskaart en behoudt de originele alinea's en regeleindes,
zonder genummerde blokkaarten. Alles voorlezen, stoppen en kopieren blijven werken;
kopieren van doorlopende tekst voegt geen bloknummers toe. Terugwisselen herstelt
de oorspronkelijke blokken met hun voorleesknoppen en leeslampje.

Kies in het persoonlijk leesprofiel tussen **Lettergrepen** (standaard) en
**Klanken (beta)**. De keuze wordt samen met het leesprofiel in localStorage
opgeslagen. De segmented control activeert altijd precies een modus. Wisselen bouwt
de actuele invoertekst direct opnieuw op, zonder extra klik op Maak leesvriendelijk.
Als alleen uitvoer aanwezig is, wordt die vanuit de originele tekst opnieuw opgemaakt.
De opties voor het
tonen en kleuren van lettergrepen blijven behouden voor de lettergreepmodus.

### Nederlandse lettergrepen

Lettergreepmodus gebruikt een eigen deterministische verdeler, niet de tokenizer
van Klankmodus. Eerst worden klinkerkernen herkend, daarna worden tussenliggende
medeklinkers verdeeld met regels voor enkele/dubbele medeklinkers en Nederlandse
beginclusters. Hoofdletters en leestekens blijven behouden; een zichtbaar
koppelteken kan een grens vormen. Woorden met apostroffen en onvoldoende zekere
klinker- of medeklinkercombinaties blijven intact.

De algemene regels zijn geen volledig Nederlands woordenboek. De apart gehouden,
hoofdletterongevoelige `DUTCH_SYLLABLE_EXCEPTIONS` in [script.js](script.js) bevat
`robotje`, `robotjes`, `vriendelijk` en `vriendelijke`. Geverifieerde
samenstellingen staan in `DUTCH_COMPOUND_PARTS`: `tandwielen`, `speelgoedwinkel`
en `aardrijkskundeles`. `DUTCH_SUFFIX_STEMS` beperkt speciale achtervoegselregels
tot bekende stammen. Deze lijsten zijn uitbreidbaar zonder de hoofdlogica of
klankkleuren te wijzigen.

### Klanken volgens de leeskaart

Klankmodus gebruikt de bestaande bouwsteenvorm met de classificatie van de leeskaart:

| Kleur | Geschreven klankgroepen | Markering |
| --- | --- | --- |
| Groen | a, e, i, o, u | Geen |
| Geel | aa, ee, oo, uu | Geen |
| Oranje | ij, ei, ou, au, ie, oe, eu, ui | Geen |
| Wit | aai, ooi, oei | Twee lijnen onder de groep |
| Wit | eeuw, ieuw, uw | Een punt onder elke letter |
| Blauw | Alle medeklinkers (ook c, q, x, y) en herkende medeklinkerclusters, zoals ng, nk, ch, sch, schr, br, vr | Geen |

De langste klankgroep krijgt voorrang. Hoofdletters, spaties, leestekens en de
originele tekst voor kopiëren en voorlezen blijven behouden. Klankkleuren blijven
gelijk in alle achtergrondthema's.
De volledige klanklegenda blijft beschikbaar via **Leeskaart en klankkleuren**.

Voorbeelden: `school` wordt `[sch] [oo] [l]`, `schrijf` wordt `[schr] [ij] [f]`
en `nieuws` wordt `[n] [ieuw] [s]`. Langste herkende clusters krijgen voorrang;
onbekende combinaties worden afzonderlijke blauwe medeklinkers, zodat bijvoorbeeld
`schrijfboek` geen gezamenlijke bouwsteen `[fb]` krijgt.

Dit is herkenning van geschreven groepen, geen volledige fonetische analyse:
lettergreep- en samenstellingsgrenzen, leenwoorden en uitspraakuitzonderingen
worden niet geïnterpreteerd. Letters buiten de classificatie (zoals letters met
accenten) blijven ongewijzigd en krijgen geen klankkleur. De extra patronen
e/ig/lijk op de kaart zijn niet toegevoegd aan de expliciet gevraagde classificatie.

### Opgeslagen voorkeuren

- `leesblokjes_leesprofiel`: onder meer `wordSpacing`, `readingLayout`,
  `readingMode`, lettertype, grootte, regelafstand en thema.
- `leesblokjes_instellingen`: migratie van het oude instellingenformaat.
- `leesblokjes_actieve_import_sectie` en `leesblokjes_laatste_geopende_sectie`:
  gekozen importbron en compatibiliteit met de eerdere bronkeuze.
- `leesblokjes_paneel_ingeklapt`: zichtbaarheid van het instellingenpaneel.

### Tests

Open [de leesmodustests](tests/reading-modes.html) via dezelfde lokale HTTP-server
als de app. De browsertests controleren alle groepen en kleuren, markeringen,
tekstbehoud, direct opnieuw opbouwen van de zes controlewoorden, bronkeuze,
wederzijds exclusieve modi, woordafstand, doorlopende tekst, kopieren en voorlezen,
profielherstel en localStorage (inclusief oude profielen). De opgeslagen profiel-
en broninstellingen worden na afloop teruggezet.

De suite legt de tien gevraagde lettergreepverdelingen expliciet vast, inclusief
hoofdletters, leestekens, apostroffen, koppeltekens, korte en onbekende woorden.
Kleine DOCX- en PDF-bestanden worden in de test gegenereerd en via de echte
Mammoth- en PDF.js-extractie en uploadhandler verwerkt. Webimport gebruikt een
gecontroleerd antwoord; live Wikipedia-import kan aanvullend met de voorbeeldknoppen
worden gecontroleerd. Clipboard en spraak worden gecontroleerd met testdubbels;
dit verifieert tekst en aansturing, niet het daadwerkelijk hoorbare geluid.

Voor 1920x1080, 1366x768 en 390x844 worden alle vijf woordafstandstanden gemeten
in normale tekst, lettergrepen en klanken, zowel in blokken als doorlopende tekst.
De suite controleert ook ongewijzigde woordbreedtes, exclusieve DOM-structuren,
tekstbehoud, kleuren en het ontbreken van horizontale pagina-overflow.
