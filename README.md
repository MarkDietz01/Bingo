# Bingo Studio

Een lichte webapp om snel een eigen bingo te maken. Kies tussen klassieke tekst, afbeeldingen of muziek en vul de kaart met eigen items.

## Gebruik
1. Open `index.html` in je browser.
2. Kies het type bingo (klassiek, afbeeldingen of muziek).
3. Stel het formaat (3x3 tot 7x7), de achtergrondkleur en optioneel een vrije center in.
4. Klassiek: gebruik standaard de 1-75 nummers of vink dit uit om eigen teksten te gebruiken. Elke kaart krijgt unieke nummers.
5. Afbeelding/audio: voeg items toe via tekst + URL of door bestanden te uploaden.
6. Muziek: plak een Spotify/YouTube-playlist of regels met `Titel - Artiest`, upload mp3-bestanden, klik "Start muziek bingo" en gebruik "Toon huidig nummer" om de titel/artieste te onthullen. Elk nummer wordt willekeurig en maar één keer afgespeeld.
7. Bekijk direct het voorbeeld. Gebruik "Exporteer kaart" om de kaart te downloaden (muziek exporteert alleen titel + artiest als tekstbestand).
8. "Opnieuw beginnen" reset alle velden en start met twee lege items.

## Kenmerken
- Dynamische preview met kleur en titel.
- Ondersteuning voor tekst, afbeeldingen (URL/upload) en audio (URL/upload).
- Random ingevulde kaart zonder dubbele items; gratis vak in het midden is optioneel.
- Muziekspeler met shuffle/geen herhalingen, mp3-upload en playlist-import, plus "reveal"-knop voor de huidige track.
- Responsief ontwerp met moderne UI-styling.

## Windows .exe maken
1. Zorg dat Python is geïnstalleerd en installeer PyInstaller: `pip install pyinstaller`.
2. Draai het build-commando vanuit de projectmap:
   ```bash
   pyinstaller --noconsole --onefile --add-data "index.html;." --add-data "style.css;." --add-data "script.js;." bingo_desktop.py
   ```
3. Het uitvoerbare bestand staat daarna in `dist/bingo_desktop.exe`. Dubbelklik om de bingo-app in je browser te starten.
