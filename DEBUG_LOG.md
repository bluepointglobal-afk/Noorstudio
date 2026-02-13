# DEBUG LOG - Image Pipeline Forensic Audit

## Pipeline Architecture (Post-Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                    DETERMINISTIC ROUTING                     │
│                                                              │
│  hasReferences?                                              │
│    ├─ YES → Replicate (fofr/consistent-character)          │
│    │         • Uses character.imageUrl as subject            │
│    │         • IP-Adapter for identity lock                  │
│    │         • Single API call for pose pack                 │
│    │                                                          │
│    └─ NO  → BFL FLUX.2 Klein 9B                             │
│              • Text-to-image only                            │
│              • Optimal prompt: 30-80 words                   │
│              • Polls until Ready, downloads & stores          │
│                                                              │
│  NO SILENT FALLBACK - FAILS WITH 400 IF PROVIDER MISSING    │
└─────────────────────────────────────────────────────────────┘
```

## Stage Flows

### Stage A: Initial Character Anchor (Text → Image)
**Provider**: BFL FLUX.2 Klein 9B
```
Frontend (charactersStore.ts)
  ↓ POST /api/ai/image
  {
    "prompt": "Full-body portrait of 9-12 year old child...",
    "references": undefined,  // ← NO REFERENCES
    "width": 1024,
    "height": 1792,
    "task": "illustration"
  }
  ↓
Backend (server/routes/ai.ts)
  ↓ hasReferences = false
  ↓ Routes to: bflImageGeneration()
  ↓
BFL Provider (server/lib/bflProvider.ts)
  ↓ POST https://api.bfl.ai/v1/flux-2-klein-9b
  ↓ Poll until Ready
  ↓ Download image
  ↓ Store at /tmp/noorstudio-images/bfl-{jobId}.png
  ↓ Return /stored-images/{filename}
```

### Stage B: Pose Pack (Image + Text → Image Grid)
**Provider**: Replicate (consistent-character)
**Default**: 2x2 grid (4 poses) at 2048x2048 for best identity fidelity
```
Frontend (charactersStore.ts)
  ↓ generatePoseSheet(characterId, poseCount=4)
  ↓ POST /api/ai/image
  {
    "prompt": "Character pose pack for Amira...",
    "references": ["https://.../character-anchor.png"],  // ← HAS REFERENCES
    "characterReference": "https://.../character-anchor.png",
    "width": 2048,
    "height": 2048,
    "task": "illustration",
    "poseCount": 4
  }
  ↓
Backend (server/routes/ai.ts)
  ↓ hasReferences = true
  ↓ Routes to: replicateImageGeneration()
  ↓
Replicate Provider (server/lib/replicateProvider.ts)
  ↓ Sets input.subject = character reference URL
  ↓ Replicate runs fofr/consistent-character model
  ↓ IP-Adapter locks identity from subject image
  ↓ Returns 2x2 grid image URL
```

### Stage C & D: Scene Illustrations & Covers
**Provider**: Replicate (consistent-character)
```
Same as Stage B, but references array includes pose pack URL
```

---

## Verification Commands

### Test A: Text-Only → Should Use BFL

```bash
# Generate trace_id
TRACE_ID="test_bfl_$(date +%s)"

# Test text-to-image (no references)
curl -X POST http://localhost:3000/api/ai/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "prompt": "Full-body portrait of a 10 year old child with brown skin, wearing traditional Qatari outfit. Watercolor children'\''s book style. Clean white background.",
    "task": "illustration",
    "width": 1024,
    "height": 1792,
    "traceId": "'"$TRACE_ID"'"
  }'
```

**Expected Backend Logs**:
```json
{"trace_id":"test_bfl_1234567890","stage":"routing","has_references":false,"reference_count":0,"bfl_available":true,"replicate_available":true}
{"trace_id":"test_bfl_1234567890","stage":"provider_selected","provider":"bfl","reason":"text_only"}
{"trace_id":"test_bfl_1234567890","stage":"bfl_submit","provider":"bfl","model":"flux-2-klein-9b","prompt_length":123}
{"trace_id":"test_bfl_1234567890","stage":"bfl_polling_started","job_id":"abc123"}
{"trace_id":"test_bfl_1234567890","stage":"bfl_ready","job_id":"abc123"}
{"trace_id":"test_bfl_1234567890","stage":"download_started"}
{"trace_id":"test_bfl_1234567890","stage":"download_complete","stored_path":"/tmp/noorstudio-images/bfl-abc123-xyz.png","public_url":"/stored-images/bfl-abc123-xyz.png"}
{"trace_id":"test_bfl_1234567890","stage":"bfl_complete","processing_time_ms":15234}
```

**Expected Response**:
```json
{
  "imageUrl": "/stored-images/bfl-abc123-xyz.png",
  "provider": "bfl",
  "providerMeta": {
    "model": "flux-2-klein-9b",
    "processingTime": 15234,
    "jobId": "abc123"
  }
}
```

---

### Test B: With References → Should Use Replicate

```bash
# Generate trace_id
TRACE_ID="test_replicate_$(date +%s)"

# Test image+text (with references)
curl -X POST http://localhost:3000/api/ai/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "prompt": "Character pose pack for Amira. 2x2 grid with 4 distinct poses: standing, walking, sitting, waving.",
    "references": ["https://example.com/character-anchor.png"],
    "characterReference": "https://example.com/character-anchor.png",
    "task": "illustration",
    "width": 2048,
    "height": 2048,
    "poseCount": 4,
    "traceId": "'"$TRACE_ID"'"
  }'
```

**Expected Backend Logs**:
```json
{"trace_id":"test_replicate_1234567890","stage":"routing","has_references":true,"reference_count":1,"bfl_available":true,"replicate_available":true}
{"trace_id":"test_replicate_1234567890","stage":"provider_selected","provider":"replicate","reason":"has_references"}
{"trace_id":"test_replicate_1234567890","stage":"replicate_request","has_references":true,"reference_count":1,"prompt_length":95}
```

**Expected Response**:
```json
{
  "imageUrl": "https://replicate.delivery/...",
  "provider": "replicate",
  "providerMeta": {
    "model": "fofr/consistent-character:...",
    "characterReference": "used",
    "processingTime": 8234
  }
}
```

---

### Test C: OpenAI Call → Should Fail with 400

```bash
# Try to force OpenAI (should fail)
curl -X POST http://localhost:3000/api/ai/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "X-Force-Provider: openai" \
  -d '{
    "prompt": "Test prompt",
    "task": "illustration"
  }'
```

**Expected Response**:
```json
{
  "error": {
    "code": "OPENAI_DISABLED",
    "message": "OpenAI/DALL-E image provider is disabled. Use BFL FLUX.2 Klein (text-to-image) or Replicate (image+text consistency)."
  }
}
```

---

## (4) KNOWN FAILURE MODES CHECKLIST

### ❌ BFL_API_KEY Missing
**Symptom**: Text-to-image requests fail with 400
**Log**:
```json
{"error":{"code":"BFL_NOT_CONFIGURED","message":"Text-to-image generation requires BFL FLUX.2 Klein provider..."}}
```
**Fix**: Set `BFL_API_KEY` in Railway environment

---

### ❌ REPLICATE_API_TOKEN Missing
**Symptom**: Image+text requests (pose pack, illustrations) fail with 400
**Log**:
```json
{"error":{"code":"REPLICATE_NOT_CONFIGURED","message":"Image generation with references requires Replicate provider..."}}
```
**Fix**: Set `REPLICATE_API_TOKEN` in Railway environment

---

### ❌ Replicate 429 (Rate Limited)
**Symptom**: `Too Many Requests` errors from Replicate
**Log**:
```json
{"trace_id":"...","error":"replicate_generation_failed","message":"...429..."}
```
**Cause**: Replicate account has < $5 credits (limited to 6 req/min)
**Fix**: Add credits to Replicate account

---

### ❌ Character Reference Image Inaccessible
**Symptom**: Replicate succeeds but character doesn't match
**Log**: No error, but Replicate logs show `subject: null` or fetch failure
**Cause**: Reference image URL is:
  - Behind auth wall (Replicate can't fetch)
  - Temporary URL expired
  - CORS blocked
**Fix**: Ensure character anchor image is:
  1. Publicly accessible (no auth required)
  2. Permanent storage URL (not signed/expiring)
  3. CORS-enabled for Replicate's fetch

---

### ❌ BFL Polling Timeout
**Symptom**: Request times out after 2 minutes
**Log**:
```json
{"trace_id":"...","error":"bfl_generation_failed","message":"BFL generation timed out after 60 polling attempts"}
```
**Cause**: BFL backend is slow or stuck
**Fix**: Retry request; if persistent, contact BFL support

---

### ❌ Schema Mismatch (Replicate Model)
**Symptom**: Replicate API returns 422 (Unprocessable Entity)
**Log**:
```json
{"trace_id":"...","error":"replicate_generation_failed","message":"...invalid parameter..."}
```
**Cause**: Replicate model schema changed (e.g., parameter renamed)
**Fix**: Check Replicate model docs, update `replicateProvider.ts` input parameters

---

### ❌ Prompt Too Long (BFL)
**Symptom**: Low quality output or truncated prompt
**Log**:
```json
{"trace_id":"...","warning":"prompt_too_long","word_count":250,"recommended":"30-80 words"}
```
**Cause**: FLUX optimal prompt length is 30-80 words
**Fix**: Simplify prompt in frontend (charactersStore.ts)

---

### ⚠️ Pose Count > 4 (Higher Drift Risk)
**Symptom**: Pose pack characters look different from anchor
**Log**:
```
[POSE_PACK] 12 poses selected. HIGHEST drift risk. Strongly recommend 4 poses for character consistency.
```
**Cause**: More poses = more grid cells = lower resolution per pose = weaker IP-Adapter signal
**Fix**: Use `poseCount=4` (default) instead of 8 or 12

---

## Deployment Checklist

### Railway Environment Variables (Server-Side Only)

```bash
# Required for text-to-image (BFL FLUX.2 Klein 9B)
BFL_API_KEY=<your_bfl_api_key>

# Required for image+text consistency (Replicate)
REPLICATE_API_TOKEN=<your_replicate_api_token>

# Optional: Custom image storage directory
IMAGE_STORAGE_DIR=/tmp/noorstudio-images  # Default if not set

# DO NOT SET (OpenAI is disabled):
# OPENAI_API_KEY - Not used
# AI_IMAGE_PROVIDER - Not used (routing is deterministic, not config-driven)
```

### Deployment Steps

1. **Set Environment Variables in Railway**:
   ```bash
   railway variables set BFL_API_KEY="your_key_here"
   railway variables set REPLICATE_API_TOKEN="your_token_here"
   ```

2. **Verify Variables**:
   ```bash
   railway variables
   # Confirm BFL_API_KEY and REPLICATE_API_TOKEN are present
   ```

3. **Deploy Backend**:
   ```bash
   git add .
   git commit -m "Fix: Implement deterministic routing (BFL + Replicate)"
   git push
   railway up --detach
   ```

4. **Check Startup Logs**:
   ```bash
   railway logs --tail 50
   ```
   **Expected**:
   ```
   [INIT] IMAGE_PROVIDER: openai
   [INIT] REPLICATE_API_TOKEN: SET
   [INIT] BFL_API_KEY: SET
   [INIT] OPENAI_API_KEY (DISABLED): SET BUT NOT USED
   [INIT] ✅ Replicate provider initialized (image+text, character consistency)
   [INIT] ✅ BFL FLUX.2 Klein provider initialized (text-to-image)
   [INIT] Serving stored images from: /tmp/noorstudio-images
   ```

5. **Test Both Providers**:
   - Run Test A (BFL text-to-image)
   - Run Test B (Replicate image+text)
   - Verify expected logs and responses

6. **Monitor Initial Requests**:
   ```bash
   railway logs --tail 100 | grep trace_id
   ```
   - Confirm routing decisions are deterministic
   - Confirm no OpenAI calls
   - Confirm no silent fallbacks

---

## Success Criteria

✅ **All reported errors are gone**
- `provider: 'replicate\n'` newline bug → BYPASSED (deterministic routing ignores config)
- 429 errors → WILL RECUR if Replicate credits < $5 (user must add credits)
- Character mismatch → FIXED (correct routing to Replicate with references)

✅ **User can complete workflow**
1. Create character → BFL generates anchor image
2. Approve character → Generate pose pack → Replicate uses anchor as subject
3. Pose pack matches anchor (same face, skin tone, outfit, proportions)

✅ **Deterministic routing**
- hasReferences → Replicate (ALWAYS)
- No references → BFL (ALWAYS)
- No silent fallback (400 if provider missing)

✅ **Structured logging**
- Every request has trace_id
- JSON logs for observability
- Clear provider selection reasoning

✅ **No more than 2 attempts per approach**
- Routing is deterministic (no retry loops)
- Provider errors are retried max 2x, then fail

---

## Trace ID Example

Full request lifecycle with trace_id:

```
Frontend:
  trace_id: "trace_1707842345_abc123"

Backend Logs:
  {"trace_id":"trace_1707842345_abc123","stage":"routing","has_references":false}
  {"trace_id":"trace_1707842345_abc123","stage":"provider_selected","provider":"bfl"}
  {"trace_id":"trace_1707842345_abc123","stage":"bfl_submit","model":"flux-2-klein-9b"}
  {"trace_id":"trace_1707842345_abc123","stage":"bfl_polling_started","job_id":"xyz789"}
  {"trace_id":"trace_1707842345_abc123","stage":"bfl_ready","job_id":"xyz789"}
  {"trace_id":"trace_1707842345_abc123","stage":"download_complete","public_url":"/stored-images/bfl-xyz789.png"}
  {"trace_id":"trace_1707842345_abc123","stage":"bfl_complete","processing_time_ms":12500}

Response:
  {
    "imageUrl": "/stored-images/bfl-xyz789.png",
    "provider": "bfl",
    "providerMeta": {
      "jobId": "xyz789",
      "processingTime": 12500
    }
  }
```

---

## Notes

- **BFL Delivery URLs Expire**: We download and store them at `/stored-images/` before returning
- **TODO**: Replace local storage (`/tmp/noorstudio-images`) with cloud storage (S3/GCS/Cloudinary)
- **Pose Count**: Default is 4 (2x2 grid). 8 or 12 poses increase drift risk.
- **Replicate Credits**: Must have > $5 to avoid 429 rate limiting
- **OpenAI Disabled**: Hard-throws 400 if invoked (prevents silent fallback)
