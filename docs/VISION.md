# Bramble & Pip — Vision

> A quiet, top-down woodland adventure for children aged **3–6**, built around
> *looking at real nature*, *listening to real sounds*, and *doing real things
> offline*. It is designed to be finished, put down, and forgotten until the
> next day.

## 1. One-paragraph concept

You are a Junior Ranger. Your companion **Pip** (a pinecone-and-flying-squirrel
hybrid) follows you through the **Whispering Woods** across one calendar year:
five chapters each of Spring, Summer, Autumn and Winter, followed by a gentle
reunion at the **Ranger's Lodge**. Every chapter has one small, unhurried
activity (counting lily pads, meshing wooden gears, tracing a bird's flight,
finding a sleeping badger with a flashlight). Every chapter also hands the
parent a **printable "bridge sheet"** that moves the idea out into the garden,
the park, or the kitchen table. The game is the doorway; the real world is the
room.

It is inspired by the top-down exploration and the following companion of
*Pokémon Yellow*, but deliberately has **no battles, no collecting-to-completion,
no rarity, no scores**. Where Pokémon has a Pokédex, we have a three-slot
*Ranger's Sketchbook*. Where it has moves, we have sensory tools: *Look*
(magnifier), *Listen*, *Hum*, *Sketch*, *Flashlight*.

## 2. Target audience

| Group | Needs | How the design answers |
|---|---|---|
| Children 3–4 | Cannot read; imprecise fingers; short attention | Tap-to-move, voice + pictogram dialogue, 80 px magnetic snapping, no fail states |
| Children 5–6 | Early counting, sorting, letter recognition | Subitizing (1–5), 1-to-1 counting, size ordering, 3 sight words max per bubble |
| Parents / carers | Trust, control, low guilt | Hard 15-minute ceiling, curfew, no accounts, no network, rule-based "conversation starters" |
| Educators | Offline continuation | 20 printable vector bridge sheets, generated locally |

## 3. The Anti-Addictive Charter (immutable)

These rules are *product requirements*, enforced by code, tests, and review.
Any change that violates one is a bug even if it "improves engagement".

1. **Finite sessions.** A monotonic **15-minute** daily exploration ceiling.
   At minute **12** a **180-second sunset** begins (warm colour grading, a
   low-pass audio sweep 18 kHz → 2.2 kHz, Pip yawns). At minute **15** the
   characters go to bed and the app enters a static **Resting** state until the
   next local day.
2. **No extrinsic dopamine.** No streaks, no daily-login bonuses, no random
   loot, no confetti or particle bursts, no competitive or numeric scoring, no
   timers that punish absence, no push notifications.
3. **No failure states.** A wrong move is a gentle return to the tray over
   400 ms with a soft wooden *tok*. No buzzers, no red flashes, no lives.
   Tracing accuracy is stored silently and **never shown** to the child.
4. **Zero network egress.** `connect-src 'none'`. No analytics SDK, no ads, no
   remote fonts, no authentication. All progress lives in IndexedDB on the
   device.
5. **No hoarding.** Satchel is three slots; item quantities cap at 3.
6. **Calm sensory envelope.** Acoustic instruments only, no sounds above
   4.5 kHz, no sudden transients (≥ 40 ms attack, ≤ −12 dBFS peaks for SFX),
   24–30 fps, zero screen shake, zero flashing.
7. **Honest parental controls.** A word-math *semantic* gate protects every
   outward-facing action. It is not a game and shows no score.

## 4. Real-world nature bridging

Each chapter ends with a *bridge*: the sketchbook page becomes a printable
(`pdfmake`, 100 % vector, generated in-browser, no fonts or images fetched).
Examples:

* CH-12 *Amber Woods* → **Leaf-Press Guide** (find a jagged, a wavy, and a smooth leaf).
* CH-16 *Pine Ridge Trail* → **Winter Track-Spotter** (rabbit, songbird, badger prints; make your own in snow).
* CH-15 *Hollow Log Rest* → **Sound Catcher Card** (one minute, eyes closed, draw what you heard).

The `ParentInsightService` turns local session events into a *summary*, a
*conversation starter*, and a *suggested walk activity* using deterministic
rules — never a cloud model.

## 5. Look & feel

* **Pixel art, strictly indexed.** One master 16-colour palette, *Whispering
  Woods*, rotated by role per season. No anti-aliasing, no "mixels", no
  gradients. 320 × 288 logical canvas, integer-scaled and letterboxed.
* **Figure–ground clarity.** Silhouette primacy, value separation ΔL ≥ 25 %,
  never colour as the only cue (berries are round and shiny, leaves are lobed).
* **Calm rhythm.** Ranger walk at 6 fps, Pip hop at 8 fps, water at 3 fps.
  Camera is spring-damped, deadzoned, integer-quantised. Feedback is dust
  specks and wooden clicks, never shake.
* **Tactile UI.** The Ranger Satchel is carved-wood and stitched-leather; pressed
  buttons sink two pixels, they do not flash.

## 6. Campaign at a glance

| Season | Chapters | Activities |
|---|---|---|
| Spring | CH-01 – CH-05 | Light the lantern, size-sort logs, count lily pads, colour-match blossoms, trace bird flight |
| Summer | CH-06 – CH-10 | Sliding stones, **Mossy Gearbox**, flashlight bug-spotting, water barrels, leaf shapes |
| Autumn | CH-11 – CH-15 | 1-to-1 acorn counting, trace oak leaves, insulate burrow, trace V-formations, 3-note bird calls |
| Winter | CH-16 – CH-20 | Rabbit-print tracing, ice-gap log matching, balanced feeders, badger mound, **Ranger's Lodge** |

After CH-20 an *Endless Ranger* sandbox lets the child revisit any region with
no progression attached.

## 7. Non-goals

Multiplayer, chat, accounts, cloud save, in-app purchases, advertising, leader
boards, achievements with counters, notifications, procedurally "infinite"
content, any form of voice recording or camera access.

## 8. Definition of done (product)

* A parent can hand the device to a 4-year-old, walk away, and nothing
  surprising, loud, flashing, or sticky can happen.
* The app is playable offline after first load, on a phone, a tablet, and a
  desktop browser.
* All of the above is verified by automated tests, not by promise.
