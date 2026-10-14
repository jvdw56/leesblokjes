# LeesBlokjes

## Importbronnen

De twee knoppen boven de invoer openen elk een eigen paneel: **Tekst plakken**
en **Document uploaden**.
Er is altijd precies een paneel open; opnieuw klikken sluit het niet.
Bij het eerste bezoek staat Tekst plakken open. Daarna wordt de laatst gekozen
bron hersteld uit localStorage. Invoer en importstatus blijven behouden bij wisselen.

Word (.docx) en PDF (.pdf) worden lokaal in de browser verwerkt met de bestaande
Mammoth- en PDF.js-bibliotheken. Tekst kan ook direct worden getypt of geplakt.

Hetzelfde uploadpaneel en dezelfde bestandskiezer accepteren JPG/JPEG, PNG en
WebP. Tesseract.js **6.0.1**, Tesseract.js-core **6.0.0** en het Nederlandse
`nld`-model uit `@tesseract.js-data/nld@1.0.0/4.0.0_best_int` worden pas bij
foto-import geladen. Herkenning gebeurt lokaal in een browser-worker; foto,
document en herkende tekst worden niet naar een verwerkingsdienst verstuurd.
De eerste OCR-start heeft internet nodig voor bibliotheek, WASM en taalmodel.
Een statische host zoals GitHub Pages volstaat; er is geen backend nodig.

Afbeeldingen mogen maximaal **10 MiB** en **12 megapixels** groot zijn;
Word/PDF maximaal **20 MiB**. Het paneel toont een lokale preview, voortgang
en een stopknop. Na herkenning verschijnt het bestaande invoerveld in hetzelfde
uploadpaneel: tekst kan worden gecorrigeerd voordat de bestaande knop
**Maak leesvriendelijk** wordt gebruikt. Wisselen van bron behoudt correcties.
Word en tekst-PDF behouden hun bestaande automatische omzetting.
Workers, bitmaps en tijdelijke object-URL's worden na gebruik opgeruimd.

OCR is geen garantie op foutloze tekst: onscherpte, slechte belichting, gedraaide
foto's, handschrift en tabellen kunnen slechte resultaten geven. Gescande PDF's
worden niet automatisch via OCR verwerkt; exporteer een pagina als afbeelding.
De pagina bevat uitsluitend de naam LeesBlokjes, zonder handelsmerkteken.

## Leesprofiel

Het instellingenpaneel blijft beschikbaar en is niet inklapbaar. De volgorde is
Leesprofiel, Lettertype, Lettergrootte, Regelafstand, Woordafstand,
Achtergrondkleur en Tekstweergave.
Leesprofiel toont permanent twee kaarten naast elkaar; precies een kaart is
actief. De keuze wordt bij verversen hersteld. De compacte kaarten tonen alleen
de profielnaam; de beschrijving blijft beschikbaar voor schermlezers.
Een blauwe rand en een vinkje markeren het actieve profiel. Pijltjestoetsen,
Home en End verplaatsen selectie en focus; Tab verlaat de radiogroep.

- **Klanknavigator** (standaard): kleuren helpen klanken herkennen. Gebruikt
  exact de bestaande klankgroepen, kleuren en markeringen van LeesBlokjes.
- **Lettergrepen**: verdeelt woorden in geschreven Nederlandse lettergrepen,
  bijvoorbeeld `[Ne] [der] [land]`. Ook eenlettergrepige woorden krijgen een leesblok.

Alleen bij Lettergrepen staat onder de profielknoppen **Weergave** met twee
radio-opties: **Gekleurd** (de bestaande pastelkleuren) en **Omrand** (neutrale
blokken met een rand, zonder lettergreepkleuren). De keuze blijft bewaard bij
profielwisselingen en herladen. Er zijn geen losse modus- of kleurschakelaars
meer. Het bestaande leeslampje per alineablok blijft beschikbaar.

Profielwisselingen maken bestaande uitvoer opnieuw op via `renderBlocks`, zonder
tekst opnieuw te importeren of nog niet verwerkte wijzigingen in het invoervak
over de uitvoer te schrijven. Een profielkeuze kan ook aanwezige invoer verwerken
als nog geen uitvoer bestaat. Bij voorlezen blijft het actieve leesdeel gemarkeerd.
Profiel- en weergavewisselingen stoppen lopende audio en negeren oude callbacks.
Een spraakfout geeft een Nederlandse melding en herstelt de voorleesbediening.

### Afstand en tekstweergave

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

In het aparte blok **Tekstweergave**, direct onder Achtergrondkleur, kies je
**Alineablokken** (standaard) of **Doorlopende tekst**. Deze keuze staat los van
het leesprofiel en wordt ook
opgeslagen. Wisselen gebruikt de al verwerkte tekst, zonder nieuwe import of
tekstopdeling. De centrale `renderBlocks`-functie verzorgt beide weergaven.
Doorlopende tekst gebruikt precies een brede leeskaart en behoudt de originele alinea's en regeleindes,
zonder genummerde blokkaarten. Alles voorlezen, stoppen en kopieren blijven werken;
kopieren van doorlopende tekst voegt geen bloknummers toe. Terugwisselen herstelt
de oorspronkelijke blokken met hun voorleesknoppen en leeslampje.

De achtergronden zijn **Crème**, **Warmblauw**, **Warmgroen** en **Donker**.
Zonder opgeslagen achtergrondvoorkeur start de pagina **Donker**. De voorkeur
wordt al voor het laden van de stylesheets gelezen om een lichte flits te vermijden.
Bestaande achtergronden en andere leesinstellingen blijven bewaard. Er zijn geen
nieuwe localStorage-sleutels; thema blijft `theme` in `leesblokjes_leesprofiel`.
Warmblauw en Warmgroen gebruiken gedempte, warme tinten; de klankkleuren blijven
in alle thema's gelijk.

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

### Klanknavigator volgens de leeskaart

Klanknavigator gebruikt de bestaande bouwsteenvorm met de classificatie van de leeskaart:

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
De classificatie hierboven blijft beschikbaar als documentatie, niet als los
onderdeel in de interface.

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
  `readingProfile` (`navigator`, `syllables`),
  `syllableStyle` (`colored`, `outlined`), lettertype, grootte,
  regelafstand en thema. Er zijn geen nieuwe localStorage-sleutels.
- `leesblokjes_instellingen`: migratie van het oude instellingenformaat.
- `leesblokjes_actieve_import_sectie` en `leesblokjes_laatste_geopende_sectie`:
  gekozen importbron en compatibiliteit met de eerdere bronkeuze.
- `leesblokjes_paneel_ingeklapt`: oude sleutel; wordt niet meer gelezen of
  gewijzigd, omdat de profielen niet verborgen mogen worden.

Oud Focuslezen en oude klankprofielen worden Klanknavigator. Een oude actieve
lettergreepkeuze binnen Klanknavigator of het oude persoonlijke profiel wordt
Lettergrepen. Uitgeschakelde lettergreepkleuren worden Omrand, anders Gekleurd.
`readingMode`, `showSyllables` en `colorSyllables` worden uitsluitend voor migratie
gelezen en niet opnieuw opgeslagen. Een oude klankweergave blijft Klanknavigator.
Verwijderde ondersteuningsschakelaars worden niet meer opgeslagen of toegepast.
Een oude gele achtergrond wordt Crème; `blauw` en `groen` behouden hun sleutels en krijgen de
warme tinten. De migratie wordt in het bestaande leesprofiel opgeslagen en
behoudt de andere voorkeuren. Zonder opgeslagen profiel start Klanknavigator.
Verwijderde bronkeuzes worden teruggezet naar Tekst plakken en opnieuw opgeslagen.
Ongeldige profiel-, thema- en weergavewaarden krijgen veilige standaardwaarden.
Lettertypen worden tegen de bestaande lijst gecontroleerd, getallen op
eindigheid en bereik en profiel/weergave op de toegestane waarden. Corrupte opslag
wordt gemeld; geblokkeerde localStorage verhindert niet dat de app start of
tekst verwerkt, maar voorkeuren kunnen dan niet worden bewaard.

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
Mammoth- en PDF.js-extractie en uploadhandler verwerkt.
Clipboard en spraak worden gecontroleerd met testdubbels;
dit verifieert tekst en aansturing, niet het daadwerkelijk hoorbare geluid.

Aanvullende tests bedienen de twee profielknoppen herhaaldelijk zonder
conversieklik en controleren directe DOM-wijzigingen, exclusieve selectie,
tekstbehoud, ongewijzigde nog niet verwerkte invoer en herstel na herladen.

Website-import en LeesBlokjes op websites BETA ontbreken al in het herstelpunt
van deze reparatie. De bestaande tests bewaken die eerdere verwijdering; deze
functies worden niet opnieuw toegevoegd als onderdeel van de gerichte reparatie.

Voor 1920x1080, 1366x768 en 390x844 worden alle vijf woordafstandstanden gemeten
in lettergrepen en klanken, zowel in blokken als doorlopende tekst.
De suite controleert ook ongewijzigde woordbreedtes, exclusieve DOM-structuren,
tekstbehoud, kleuren en het ontbreken van horizontale pagina-overflow.

Aanvullende profieltests controleren de permanente compacte profielrij op alle drie
schermformaten, profielherstel, migraties, de conditionele weergavekeuze,
neutrale randen, beide opgeslagen weergaven en het negeren van oude
spraakcallbacks. De volledige invoerroute test typen/plakken, voorbeeldtekst,
wissen, woordentelling, opnieuw verwerken en direct wisselen zonder extra
verwerkklik. Aanvullend worden gelijke kaartmaten op 320px, de eenkolomsfallback
onder 300px, toetsenbordselectie, corrupte/geblokkeerde opslag, document- en
spraakfouten en tekstcontrast van minimaal 4.5:1 gecontroleerd. Documenttests
controleren ook de bestandskeuze- en drop-events met echte DOCX/PDF-bestanden.
Beide documentformaten worden eveneens in beide leesprofielen
getest, inclusief behoud van de melding bij documenten zonder uitleesbare tekst.
Regressietests controleren tevens dat externe import-API's ontbreken en
queryparameters, hashparameters en externe berichten geen tekst importeren.
Er is geen afzonderlijk build- of lintscript: dit is een statische
HTML/CSS/JavaScript-app; de browsertests laden de echte applicatie en controleren
de bestaande functionaliteit.
