# `curator` Edge Function

Powers "Ask the Curator". Embeds the question, retrieves matching archive chunks
(`match_knowledge_chunks_v2`, falling back to `match_knowledge_chunks`), drops flagged
records, and asks Gemini to answer **only** from the numbered excerpts with `[n]` citations.
If nothing relevant is found, the model is not called and `{ answer: null, sources: [], message }` is returned.

## Deploy

```bash
supabase secrets set GEMINI_API_KEY=... ALLOWED_ORIGINS=https://yourdomain,http://localhost:5173
supabase functions deploy curator --no-verify-jwt
```

`--no-verify-jwt` makes this a public endpoint (anonymous visitors can ask). It is protected by
input validation (3–500 chars), an origin allow-list, and a per-IP rate limit.

Optional secrets: `GEMINI_EMBED_MODEL` (default `text-embedding-004`, 768 dims),
`GEMINI_MODEL` (default `gemini-2.5-flash`), `CURATOR_MATCH_THRESHOLD` (default `0.5`),
`CURATOR_MAX_CHUNKS` (default `6`), `CURATOR_RATE_LIMIT_PER_MIN` (default `10`).
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.

## Re-index (required once, and whenever the embedding model changes)

Stored vectors must come from the same model as the query. With `GEMINI_API_KEY`
(and the same `GEMINI_EMBED_MODEL`, if set) in your local `.env`:

```bash
npx tsx scripts/kolex/index-records.ts --provider=gemini --reindex --limit=100000
```

(`--limit` defaults to 10 records.)

## Caveats

- The rate limit is in memory: it resets whenever an instance restarts and is not shared
  across instances. Use a shared store (e.g. Redis/KV) for strict limits.
- Google has been retiring `text-embedding-004`; if it stops working, set
  `GEMINI_EMBED_MODEL=gemini-embedding-001` both as a secret and in `.env`, then re-index.
