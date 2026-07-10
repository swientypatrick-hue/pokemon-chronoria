# Datenimport

Wandelt die Rohdaten aus dem Spielprojekt (`source/`, per `syncData.ts` aus `E:\Test` kopiert)
in die JSON-Dateien unter `src/data/` um, die die Astro-Seiten anzeigen.

## Workflow

```
node data-import/syncData.ts      # aktuelle PBS-/Text-Dateien aus E:\Test holen
node data-import/buildData.ts     # daraus src/data/*.json neu generieren
npm run build                     # Astro-Seite bauen (ruft buildData.ts automatisch mit auf)
```

## Warum die Übersetzung nicht einfach "Zeile für Zeile" zugeordnet wird

`Text_deutsch_core/*.txt` sieht auf den ersten Blick aus, als könnte man Zeile *i* direkt dem
*i*-ten Eintrag der passenden PBS-Datei zuordnen (abwechselnd Englisch/Deutsch, kein eigener
Bezeichner). Das stimmt aber nicht mehr: Diese Dateien sind ein alter Snapshot und laufen den
seither gewachsenen PBS-Dateien hinterher (z.B. 730 Item-Namen für inzwischen 891 Items).
Eine reine Positions-Zuordnung würde ab der ersten Abweichung *alle folgenden* Einträge falsch
beschriften.

Stattdessen: die meisten PBS-Dateien (`abilities.txt`, `items.txt`, `moves_Gen_9_Pack.txt`, ...)
haben `Name`/`Description` inzwischen ohnehin schon direkt auf Deutsch im PBS-Text selbst stehen
– die werden 1:1 übernommen, ganz ohne `Text_deutsch_core`. Nur drei Felder sind in den
Basis-PBS-Dateien noch englisch: `pokemon.txt`s `Pokedex`/`Category` und `moves.txt`s
`Description`. Für die wird der englische PBS-Text als Anker gegen die englische Spalte der
passenden `Text_deutsch_core`-Datei gematcht (`parseTranslations.ts: buildTextIndex`), statt
sich auf die Zeilenposition zu verlassen. Trifft kein Anker (weil der Eintrag neu ist und noch
gar keine Übersetzung existiert, oder weil das deutsche Feld selbst noch unübersetzt duplicate
Englisch enthält), bleibt der englische Text stehen und wird im Datensatz als
`{ fallback: true }` markiert – die Seiten zeigen dafür ein kleines "EN"-Badge. Das ist zugleich
eine brauchbare Übersicht, was im Spiel noch übersetzt werden müsste.

## Bekannte Lücken (v1, bewusst so entschieden)

- Item-Fundorte am Boden und die Karten-Platzierung von Trainern stecken binär in den
  `Map*.rxdata`-Dateien, nicht in Textform - nicht abgedeckt.
- Battle-Tower-/Cup-Pools (`cup_*.txt`, `battle_tower_*.txt`) werden bewusst nicht importiert.
