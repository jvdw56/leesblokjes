# leesblokjes

## Leesmodi

Kies in het persoonlijk leesprofiel tussen **Lettergrepen** (standaard) en
**Klanken (beta)**. De keuze wordt samen met het leesprofiel in localStorage
opgeslagen. Wisselen past bestaande leesblokjes direct aan. De opties voor het
tonen en kleuren van lettergrepen blijven behouden voor de lettergreepmodus.

Klankmodus gebruikt de bestaande bouwsteenvorm met de classificatie van de leeskaart:

| Kleur | Geschreven klankgroepen | Markering |
| --- | --- | --- |
| Groen | a, e, i, o, u | Geen |
| Geel | aa, ee, oo, uu | Geen |
| Oranje | ij, ei, ou, au, ie, oe, eu, ui | Geen |
| Wit | aai, ooi, oei | Twee lijnen onder de groep |
| Wit | eeuw, ieuw, uw | Een punt onder elke letter |
| Blauw | Alle medeklinkers (ook c, q, x, y) en aaneengesloten medeklinkerclusters, zoals ng, nk, ch, sch, schr | Geen |

De langste klankgroep krijgt voorrang. Hoofdletters, spaties, leestekens en de
originele tekst voor kopiëren en voorlezen blijven behouden. Klankkleuren blijven
gelijk in alle achtergrondthema's.

Dit is herkenning van geschreven groepen, geen volledige fonetische analyse:
lettergreep- en samenstellingsgrenzen, leenwoorden en uitspraakuitzonderingen
worden niet geïnterpreteerd. Letters buiten de classificatie (zoals letters met
accenten) blijven ongewijzigd en krijgen geen klankkleur. De extra patronen
e/ig/lijk op de kaart zijn niet toegevoegd aan de expliciet gevraagde classificatie.

### Tests

Open [de leesmodustests](tests/reading-modes.html) via dezelfde lokale HTTP-server
als de app. De browsertests controleren alle groepen en kleuren, markeringen,
tekstbehoud, wisselen van modus, profielherstel en localStorage (inclusief oude
profielen). De opgeslagen leesprofielinstellingen worden na afloop teruggezet.
