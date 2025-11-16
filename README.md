# Bingo Studio

Een lichte webapp om snel een eigen bingo te maken. Kies tussen klassieke tekst, afbeeldingen of muziek en vul de kaart met eigen items.

## Gebruik
1. Open `index.html` in je browser.
2. Kies het type bingo (klassiek, afbeeldingen of muziek).
3. Stel het formaat (3x3 tot 7x7), de achtergrondkleur en optioneel een vrije center in.
4. Voeg items toe. Per modus kun je tekst invoeren, een URL plakken of een bestand uploaden (afbeelding of audio).
5. Bekijk direct het voorbeeld. Gebruik "Exporteer kaart" om de bingo als los HTML-bestand te downloaden.
6. "Opnieuw beginnen" reset alle velden en start met twee lege items.

## Kenmerken
- Dynamische preview met kleur en titel.
- Ondersteuning voor tekst, afbeeldingen (URL/upload) en audio (URL/upload).
- Random ingevulde kaart op basis van ingevoerde items; gratis vak in het midden is optioneel.
- Responsief ontwerp met moderne UI-styling.

## Windows .exe maken
1. Zorg dat Python is geïnstalleerd en installeer PyInstaller: `pip install pyinstaller`.
2. Draai het build-commando vanuit de projectmap:
   ```bash
   pyinstaller --noconsole --onefile --add-data "index.html;." --add-data "style.css;." --add-data "script.js;." bingo_desktop.py
   ```
3. Het uitvoerbare bestand staat daarna in `dist/bingo_desktop.exe`. Dubbelklik om de bingo-app in je browser te starten.
