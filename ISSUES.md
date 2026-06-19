# Known Issues

This document tracks known issues, their status, and workarounds.

## 🔴 Critical

### YouTube Channel Pages Fail with Standard Scrape

**Status:** Fixed in v0.1.1  
**Affected:** `lib/scraper/firecrawlClient.ts` — `scrapeChannelPage()`

**Problem:**  
YouTube channel pages (`https://www.youtube.com/@handle`) are JavaScript-heavy SPAs that don't render properly with Firecrawl's standard scrape endpoint. The scrape returns empty or incomplete data because YouTube requires client-side JavaScript execution to load channel videos, subscriber counts, and other dynamic content.

**Root Cause:**  
YouTube uses client-side rendering (React/Next.js) for its channel pages. The standard `scrape` endpoint only gets the initial HTML before JavaScript executes, missing all the dynamically loaded content.

**Solution:**  
Use Firecrawl's **Interact mode** which launches a real browser session:

1. Scrape the channel URL (gets initial HTML + `scrapeId`)
2. Interact with the page using a prompt to scroll and extract data
3. Stop the session to clean up

**Code Change:**
```typescript
// Before: Standard scrape (fails for YouTube)
const result = await app.scrape(url, { formats: ["markdown", "json"] });

// After: Interact mode (works for YouTube)
const result = await app.scrape(url, { formats: ["markdown"] });
const scrapeId = result.metadata.scrapeId;

const interactResult = await app.interact(scrapeId, {
  prompt: "Extract channel name, subscriber count, and list of videos..."
});

await app.stopInteraction(scrapeId);
```

**Cost Impact:**  
- Standard scrape: 1 credit
- Interact with prompts: 7 credits per minute of session time
- Interact with code only: 2 credits per minute

**Status:** Fixed — channel scraping now uses interact mode.

---

## 🟡 Minor

### Subscriber Count Parsing Inconsistencies

**Status:** Open  
**Affected:** `lib/scraper/parser.ts`

**Problem:**  
YouTube displays subscriber counts in various formats depending on locale and count magnitude:
- "1.2M subscribers"
- "980K subscribers"  
- "1,234,567 subscribers"
- "12,3万" (Japanese)

Some edge cases may not parse correctly.

**Workaround:**  
The parser handles common formats. Edge cases will show as "—" in the UI.

---

### Video Description Not Always Extracted

**Status:** Open  
**Affected:** `lib/scraper/firecrawlClient.ts` — `scrapeVideoPage()`

**Problem:**  
Video pages may not always return full descriptions due to YouTube's "Show more" truncation. The interact mode is not currently used for individual video pages.

**Workaround:**  
Video titles, thumbnails, and view counts are reliably extracted. Descriptions may be partial.

---

## 🟢 Resolved

### API Key Not Persisting in Admin Config

**Status:** Fixed  
**Affected:** `app/api/admin/config/route.ts`

**Problem:**  
The GET endpoint for admin config did not include `llm.apiKey` or `firecrawl.apiKey` in the keys list, so API keys appeared empty on page load even after being saved.

**Fix:**  
Added both keys to the GET endpoint's keys array.

---

### Theme Toggle Not in Header

**Status:** Fixed  
**Affected:** `components/shared/sidebar.tsx`, `components/shared/header.tsx`

**Problem:**  
Theme toggle was located at the bottom of the sidebar instead of the header where users expected it.

**Fix:**  
Created `components/shared/header.tsx` with theme toggle, notifications bell, and page title. Moved toggle from sidebar to header.
