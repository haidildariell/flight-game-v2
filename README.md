[![Bounty](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Rank](https://make.fun/badge/best-flight-game-20261126-0057/haidildariell/flight-game-v2/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)
[![Reward](https://make.fun/badge/best-flight-game-20261126-0057/haidildariell/flight-game-v2/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057)

https://make.fun/bounty/best-flight-game-20261126-0057

# Banda Sea Rescue

Pilot pesawat amfibi Cendrawasih di kepulauan Banda. Terbang melewati ring
penyelamat di atas selat, antar bantuan, dan mendarat di landasan Pulau
Landas — semua dalam satu game 2D canvas original, tanpa library, tanpa
network request.

Entry untuk [Make the best flight game](https://make.fun/bounty/best-flight-game-20261126-0057)
di make.fun — 50 tempat berbayar, hadiah $500.

## Cara main

- W / S — throttle naik / turun
- Panah atas / bawah — pitch (naik / menukik)
- Panah kiri / kanan — bank, belok heading
- G — turunkan / naikkan gear
- P — jeda, R — ulang, M — menu, N — misi berikut

Tiga misi: Ring Run (5 ring di selat), Medicine Run (3 ring + landing),
Storm Rescue (5 ring + landing, badai mendorong pesawat ke samping).
Fuel menipis kalau throttle penuh; pendaratan keras merusak pesawat;
mendarat di laut atau menabrak daratan berarti jatuh.

## Main lokal

Buka `game/index.html` di browser desktop, atau sajikan folder `game/`
dengan server statis apa pun. Tidak ada build step dan tidak ada request
jaringan — semua file game ada di bawah `game/`.

## Struktur

- `game/index.html` — canvas + pemuat modul
- `game/src/main.js` — loop game dan state machine
- `game/src/flight.js` — model terbang, fuel, damage, landing
- `game/src/world.js` — kepulauan Banda: terrain, gunung api, mercusuar, runway
- `game/src/missions.js` — tiga misi, ring, skor
- `game/src/render.js` — semua gambar: langit, laut, pesawat, HUD
- `game/src/audio.js` — synth WebAudio (mesin, ring, landing)
- `game/src/input.js` — keyboard dan klik
- `game/src/rng.js` — angka acak deterministik (seed tetap)
- `main.ts` — menyerahkan game + screenshot + dossier.json ke /output
- `vendor/makefun-game.ts` — library kit make.fun, tanpa diubah

## Lisensi

MIT — lihat LICENSE.
