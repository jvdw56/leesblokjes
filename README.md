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

Kies in het persoonlijk leesprofiel tussen **Lettergrepen** (standaard) en
**Klanken (beta)**. De keuze wordt samen met het leesprofiel in localStorage
opgeslagen. De segmented control activeert altijd precies een modus. Wisselen bouwt
de actuele invoertekst direct opnieuw op, zonder extra klik op Maak leesvriendelijk.
Als alleen uitvoer aanwezig is, wordt die vanuit de originele tekst opnieuw opgemaakt.
De opties voor het
tonen en kleuren van lettergrepen blijven behouden voor de lettergreepmodus.

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

Voorbeelden: `school` wordt `[sch] [oo] [l]`, `schrijf` wordt `[schr] [ij] [f]`
en `nieuws` wordt `[n] [ieuw] [s]`. Langste herkende clusters krijgen voorrang;
onbekende combinaties worden afzonderlijke blauwe medeklinkers, zodat bijvoorbeeld
`schrijfboek` geen gezamenlijke bouwsteen `[fb]` krijgt.

Dit is herkenning van geschreven groepen, geen volledige fonetische analyse:
lettergreep- en samenstellingsgrenzen, leenwoorden en uitspraakuitzonderingen
worden niet geïnterpreteerd. Letters buiten de classificatie (zoals letters met
accenten) blijven ongewijzigd en krijgen geen klankkleur. De extra patronen
e/ig/lijk op de kaart zijn niet toegevoegd aan de expliciet gevraagde classificatie.

### Tests

Open [de leesmodustests](tests/reading-modes.html) via dezelfde lokale HTTP-server
als de app. De browsertests controleren alle groepen en kleuren, markeringen,
tekstbehoud, direct opnieuw opbouwen van de zes controlewoorden, bronkeuze,
wederzijds exclusieve modi, profielherstel en localStorage (inclusief oude
profielen). De opgeslagen profiel- en broninstellingen worden na afloop teruggezet.
