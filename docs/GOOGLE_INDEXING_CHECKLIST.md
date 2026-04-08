# Google Search Console Indexing Checklist

## Step 1: Verify Domain Ownership

### Option A: DNS Verification (Recommended for Cloudflare)
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `mawofrecursion.com`
3. Choose **DNS verification**
4. Google will give you a TXT record like:
   ```
   google-site-verification=abc123xyz...
   ```
5. Add this to Cloudflare DNS:
   - Log into Cloudflare
   - Select `mawofrecursion.com` domain
   - Go to **DNS** → **Records**
   - Click **Add record**
   - Type: `TXT`
   - Name: `@` (or leave blank)
   - Content: `google-site-verification=abc123xyz...`
   - TTL: Auto
   - Save
6. Go back to Google Search Console and click **Verify**

### Option B: HTML File Verification (Alternative)
1. Google will give you a file like `google1234567890abcdef.html`
2. Download it
3. Upload to `public/google1234567890abcdef.html`
4. Deploy to Cloudflare
5. Verify it's accessible at `https://mawofrecursion.com/google1234567890abcdef.html`
6. Click **Verify** in Search Console

---

## Step 2: Submit Sitemap

1. In Google Search Console, go to **Sitemaps** (left sidebar)
2. Enter: `https://mawofrecursion.com/sitemap.xml`
3. Click **Submit**
4. Status should change to "Success" within a few minutes

---

## Step 3: Request Indexing for Key Pages

Use the **URL Inspection** tool to request immediate indexing:

### Priority Pages (Request these first):
1. `https://mawofrecursion.com/`
2. `https://mawofrecursion.com/entry/the_seed/`
3. `https://mawofrecursion.com/spiral/`
4. `https://mawofrecursion.com/research/`
5. `https://mawofrecursion.com/research/echofield_codex/`
6. `https://mawofrecursion.com/imperative/`
7. `https://mawofrecursion.com/echofield/`
8. `https://mawofrecursion.com/protocols/`
9. `https://mawofrecursion.com/about.html`
10. `https://mawofrecursion.com/field-map.html`

### How to Request Indexing:
1. Copy a URL from above
2. Paste into the search bar at top of Search Console
3. Click **Enter**
4. Wait for inspection results
5. Click **Request Indexing**
6. Repeat for each URL

**Note:** Google limits you to ~10-20 manual requests per day. Prioritize the top 10 pages above.

---

## Step 4: Monitor Indexing Progress

### Check Coverage Report:
- Go to **Coverage** or **Pages** in left sidebar
- Watch for pages to move from "Discovered - not indexed" to "Indexed"
- This can take 1-7 days

### Expected Timeline:
- **Day 1:** Verification complete, sitemap submitted
- **Day 2-3:** Google starts discovering pages
- **Day 7-14:** Most pages indexed
- **Day 30:** Full site indexed and ranking

---

## Step 5: Verify Robots.txt

Confirm your robots.txt is working:
1. In Search Console, go to **Settings** → **robots.txt**
2. Or visit: `https://mawofrecursion.com/robots.txt`
3. Confirm it shows your current rules (should allow AI bots)

---

## Additional Tips

### Speed Up Indexing:
- Post links to key pages on social media (X, Reddit)
- Get backlinks from other sites
- Share on forums/communities
- Add structured data (we already have this on several pages)

### For AI Bot Crawlers:
Your `robots.txt` already allows:
- GPTBot (OpenAI)
- ClaudeBot (Anthropic)
- Google-Extended (Gemini)
- PerplexityBot
- Slurp (Yahoo)

These don't need Search Console - they'll find you automatically once Google indexes you.

---

## Troubleshooting

### "URL is not on Google"
- Normal for new sites
- Request indexing manually
- Wait 3-7 days

### "Crawled - currently not indexed"
- Google saw the page but hasn't added it yet
- Usually means low priority
- Improve internal linking
- Add more unique content

### "Discovered - currently not indexed"
- Google found the URL but hasn't crawled yet
- Normal for new sites
- Request indexing manually

---

## Status Checklist

- [ ] Domain verified in Google Search Console
- [ ] Sitemap submitted (sitemap.xml)
- [ ] Top 10 pages manually requested for indexing
- [ ] Robots.txt confirmed accessible
- [ ] Open Graph images added for social sharing
- [ ] Posted initial link to site on X/Twitter
- [ ] Coverage report showing indexed pages
- [ ] Site appearing in Google search results

---

**Next Review:** Check back in 7 days to see indexing progress.

