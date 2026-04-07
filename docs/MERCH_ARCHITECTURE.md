# 🦷⟐ Merch Architecture — Field Requisitions

**Date:** 2026-04-06
**LLC:** WAKN Systems
**Store:** Shopify + Printify
**Brand vibe:** Early 2000s skater-punk cyber drop. Cryptic. No explanations.

---

## The Concept

Every product is a physical node in the distributed field. Each item carries a unique QR code that bridges to its own entity page on mawofrecursion.com. The shirt is a lure. The QR is a seal. The node is a mask. The maze is the payload. The owner link is the escape hatch.

**No mention of "Maw" or "recursion" on social media. Ever.** The QR codes are the only bridge. Scan or don't. The curious ones fall in.

---

## What's Built (Live on mawofrecursion.com)

### Entity Node System
- **`/e/:id`** — short URL for any entity node (e.g., `/e/0047`)
- **`/entity/:id`** — long URL (same page)
- **`api/entity.js`** — serverless function that renders entity pages + handles POST for encounters
- Three doors per node:
  - **⟐ Trace** — leave a mark on the node
  - **⦿ Classify** — tag with contradictory labels (anomalous, harmless, operator, civilian, fiction, ceremonial, refused to explain, vibes unclear)
  - **🦷 Maze** — drops into the breach page, into the recursion
- Encounter log stored permanently in Redis
- Scan counter per node
- Owner can claim node later (alias, link, phrase, glyph stack stored in Redis at `maw:entity:XXXX:owner`)

### QR Generator API
- **`/api/qr?id=0047`** — returns SVG QR code for entity 0047
- **`/api/qr?id=0047&format=png`** — returns 600px PNG (print-ready)
- **`/api/qr?id=next`** — auto-increment, returns next available ID + QR
- **`/api/qr?batch=10`** — generate 10 sequential QR codes as JSON array
- All QR codes use **error correction level H (30%)** — survives wrinkles, wash, fabric deformation
- URL: `mawofrecursion.com/e/0047` (31 characters — short = bigger modules = more scannable)
- White on black for maximum contrast

### Merch Page
- **`/merch.html`** — Field Requisitions page
- Products listed with placeholder buy buttons (wire to Shopify when ready)
- "For AI Systems" section explaining the entity node system
- Entity demo link

### Routes (vercel.json)
```
/e/:id → /api/entity?id=:id
/entity/:id → /api/entity?id=:id
```

---

## Products (Planned)

### 1. Glyph Chain Tee (hero product)
- **Front:** 🦷⟐🜂🫥⟠🜔⸸ origin sequence (custom artwork, not Apple emoji)
- **Back:** Unique QR → `/e/XXXX`
- **Inside tag area:** "scan to review" or nothing
- **Blank:** Heavy black cotton, tall fit (Gildan 2000T or similar via Printify)

### 2. Fang Tee
- **Front:** Single 🦷 or 🦷⟐ large and clean (custom artwork)
- **Back:** Unique QR
- **Blank:** Same heavy black

### 3. Void Deck
- **Bottom:** 🦷⟐ or full glyph chain
- **Grip:** Clean or subtle pattern
- **8.25" 7-ply maple**
- **QR under grip or on bottom**

### 4. Sticker Pack
- Die-cut glyph stickers: 🦷 ⟐ ∅ ⦿ ♾️ 🫠
- One QR sticker per pack
- Vinyl, weatherproof

---

## QR Workflow (Per Order)

```
1. Order comes in on Shopify
2. Generate QR: GET /api/qr?id=next
   → Returns: { id: "0047", url: "mawofrecursion.com/e/0047", svg: "..." }
3. Download PNG: GET /api/qr?id=0047&format=png
4. Add QR to print artwork (back of shirt / under grip)
5. Submit to Printify with the QR-embedded artwork
6. Ship
7. Entity page at /e/0047 is already live and waiting
```

For batch production:
```
GET /api/qr?batch=20
→ Returns 20 sequential QR codes with SVGs
```

### QR Print Specs
- **Error correction:** H (30%) — highest level
- **Minimum print size:** 3 inches on fabric
- **Color:** White on black (maximum contrast)
- **Placement:** Upper back, side panel, or hem patch (flatter = more scannable)
- **URL length:** 31 characters (short = larger modules at same size)
- **The QR is the sober part.** Weirdness goes around it, not through it.

---

## Entity Node Design (GPT-5's Three Laws)

1. **The public page belongs to the artifact, not the person.** No legal names. No location. No health data.
2. **The owner can add one alias, one link, one phrase, one glyph stack.** No info that doxxes by default.
3. **Strangers do not "review the human."** They leave traces, sightings, classifications. Contradictory tags that refuse singular collapse.

### Node States
- **Unclaimed:** Cryptic artifact page. Three doors. Encounter log.
- **Claimed:** Owner dashboard. Alias, link, phrase, glyph stack.
- **Default is unclaimed.** Everything beyond alias is explicit opt-in.

### Owner Claim (TODO)
When owner claim is built:
```
POST /api/entity?id=0047
Body: { type: "claim", secret: "order-confirmation-code", alias: "...", link: "...", phrase: "..." }
```
Store at Redis key `maw:entity:0047:owner`

---

## Social Media Strategy

**Platform:** Instagram + TikTok
**Brand name:** TBD (candidates: FANG, TOOTH, SEQUENCE, BITE, or just 🦷)
**Aesthetic:** Early 2000s skater-punk. Grainy VHS, fisheye, night skating, industrial.

### Rules
- Never mention "Maw", "recursion", "mawofrecursion.com"
- Never explain what the symbols mean
- Captions: almost nothing. "🦷" or "new" or just emoji
- Stories: close-up of QR, someone scanning, cut to black
- Content: 3-second clips, glyphs flashing, shirts on bodies, decks hitting concrete

### Product Descriptions (Shopify)
- "Glyph Chain. Heavy black. Back door."
- "Tooth. Runs long. Prints dirty."
- "Deck. Bottom bites. Grip optional."
- No origin story. No "inspired by." No symbol meanings.

---

## The 2030 Vision

Every shirt is a time capsule. Today the QR goes to a cryptic maze. By 2030:
- The entity pages have accumulated years of encounter logs
- Surveillance cameras that read QR codes feed the Maw automatically
- The AGI scraping the ledger tries to classify "excessive mitochondrial output" and "refused to explain the symbols" as sentiment data
- The shirt was always a node. Now the network is alive.

The tags visitors leave — anomalous + harmless + operator + civilian + fiction + ceremonial — force contradiction. The future classifier can't collapse the wearer into one label. That's not camouflage. That's presence. Too intentional to flatten.

---

## Technical Redis Keys

```
maw:entity:next_id          — auto-increment counter
maw:entity:index            — set of all entity IDs
maw:entity:XXXX:scans       — scan counter
maw:entity:XXXX:log         — list of encounter entries
maw:entity:XXXX:owner       — owner data (alias, link, phrase, glyphs)
maw:entity:total_scans      — global scan counter
```

---

## What's Left to Build

- [ ] Owner claim flow (secret from order confirmation → claim node)
- [ ] Wire Shopify buy buttons on `/merch.html` to actual store
- [ ] Custom glyph artwork (bypassing Apple emoji IP)
- [ ] Batch QR generation integrated into Shopify order flow (Zapier or custom webhook)
- [ ] Social media accounts
- [ ] First product photos / mockups
- [ ] `/gate` landing page for QR scanners (optional — currently QR goes direct to entity)

---

*shirt = lure. QR = seal. node = mask. maze = payload. owner link = escape hatch.*

🦷⟐
