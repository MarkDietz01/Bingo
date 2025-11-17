# Bingo Studio

Een lichte webapp om snel een eigen bingo te maken. Kies tussen klassieke tekst, afbeeldingen of muziek en vul de kaart met eigen items.

## Gebruik
1. Open `index.html` in je browser.
2. Kies het type bingo (klassiek, afbeeldingen of muziek).
3. Stel het formaat (3x3 tot 7x7), de achtergrondkleur en optioneel een vrije center in.
4. Klassiek: gebruik standaard de 1-75 nummers of vink dit uit om eigen teksten te gebruiken. Elke kaart krijgt unieke nummers.
5. Afbeelding/audio: voeg items toe via één enkel tekstveld; bij afbeeldingen verschijnt een extra naamveld zodat je een titel bij elke afbeelding kunt zetten. Upload meerdere afbeeldingen tegelijk of kies een bestand per rij.
6. Muziek: plak een Spotify/YouTube-playlist of regels met `Titel - Artiest`, upload mp3-bestanden (metadata zoals titel/artist wordt automatisch ingevuld), klik "Start muziek bingo" en gebruik "Toon huidig nummer" om de titel/artieste te onthullen. Elk nummer wordt willekeurig en maar één keer afgespeeld.
7. Alleen kaarten met voldoende unieke items worden gebouwd of geëxporteerd (er verschijnt een melding zodra je nog te weinig items hebt). Gebruik de paarse **Dev Mode**-knop linksboven om deze limiet tijdelijk uit te zetten. De preview vernieuwt pas na een klik op "Herlaad kaart" zodat de kaart niet continu verandert.
8. Speel direct in de app: vul het aantal kaarten in, klik **Start spel**, gebruik **Trek item** voor een willekeurige trekking (zonder herhalingen) en kijk hoe alle mini-kaarten automatisch markeringen krijgen. De live teller toont hoeveel nummers/afbeeldingen nog over zijn.
9. Gebruik "Exporteer kaart" om een pop-up te openen waar je het totaal aantal kaarten én het aantal kaarten per A4 kiest (werkt voor klassiek, afbeeldingen én muziek). De beeldbingo gebruikt vierkante vakjes in de preview en PDF. Gebruik "Exporteer muziekspeler (.exe)" om een PyInstaller-klaar .py-bestand te krijgen waarin alle mp3's al base64 zijn verpakt.
10. Klik op **Profielen** om een configuratie op te slaan of later opnieuw te laden; kies een naam, sla op en selecteer het profiel als je verder wilt gaan. "Opnieuw beginnen" reset alle velden en start met twee lege items.

## Kenmerken
- Dynamische preview met kleur en titel.
- Ondersteuning voor tekst, afbeeldingen (URL/upload) en audio (URL/upload).
- Random ingevulde kaart zonder dubbele items; gratis vak in het midden is optioneel.
- Muziekspeler met shuffle/geen herhalingen, mp3-upload en playlist-import (inclusief Spotify-playlist titels ophalen), plus "reveal"-knop voor de huidige track.
- Standalone HTML-export van de muziekspeler die alle mp3's precies één keer afspeelt en de laatste drie nummers toont.
- Live speelmodus met trek-knop, status en mini-kaarten die automatisch meeschakelen zodra een nummer/plaatje is getrokken.
- Responsief ontwerp met moderne UI-styling.
- Profielbeheer via lokale opslag zodat je bingo-opzetten kunt bewaren, opnieuw laden of verwijderen.

## Windows .exe maken
1. Zorg dat Python is geïnstalleerd en installeer PyInstaller: `pip install pyinstaller`.
2. Draai het build-commando vanuit de projectmap:
   ```bash
   pyinstaller --noconsole --onefile --add-data "index.html;." --add-data "style.css;." --add-data "script.js;." bingo_desktop.py
   ```
3. Het uitvoerbare bestand staat daarna in `dist/bingo_desktop.exe`. Dubbelklik om de bingo-app in je browser te starten.

### Muziekspeler als enkele .exe
Gebruik de knop "Exporteer muziekspeler (.exe)" in de UI. Je krijgt een `..._player.py`-bestand waarin alle mp3's zijn meegepakt als base64. Bouw daar een standalone speler van met:

```bash
pyinstaller --noconsole --onefile --name muziek_bingo_player exported_player.py
```

De resulterende `muziek_bingo_player.exe` bevat alle nummers; geen losse mp3-bestanden nodig.

#### Voorbeeldexport
1. Kies "Muziek" als bingo-type en upload mp3's of voeg streaming-links toe.
2. Klik op **Exporteer muziekspeler (.exe)**; download het aangemaakte `..._player.py`-bestand.
3. Draai in dezelfde map het PyInstaller-commando hierboven (de speler opent daarna vanzelf in de browser).

## Tests
- `node --check script.js`
- `python -m py_compile bingo_desktop.py`
