# Character Consistency Implementation

## Overview

This document describes the character consistency implementation for NoorStudio using Replicate's IP-Adapter based `consistent-character` model. This solution enables AI-generated children's book illustrations where characters maintain consistent appearance across multiple pages.

## Architecture

### Provider Hierarchy

```
AI_IMAGE_PROVIDER=replicate
    ↓
ReplicateProvider (server/lib/replicateProvider.ts)
    ↓
fofr/consistent-character:latest
    (IP-Adapter based character consistency)
```

### Key Components

1. **ReplicateProvider** - Server-side wrapper for Replicate API
2. **Character References** - Passed via `references` array in image generation requests
3. **Reference Strength** - Controls consistency vs. creative freedom (0.0-1.0)

## Configuration

### Environment Variables

Add to `server/.env`:

```bash
# Set Replicate as the image provider
AI_IMAGE_PROVIDER=replicate

# Your Replicate API token
# Get from: https://replicate.com/account/api-tokens
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxx
```

### Provider Selection

The system supports multiple image providers:

| Provider | Use Case | Character Consistency |
|----------|----------|----------------------|
| `replicate` | Production - Character consistency | ✅ IP-Adapter based |
| `nanobanana` | Alternative image generation | ⚠️ Basic reference support |
| `openai` | DALL-E 3 integration | ❌ No consistency |
| `google` | Google AI integration | ❌ No consistency |
| `mock` | Development/testing | ❌ Demo images |

## Usage

### 1. Generating a Character Reference

First, generate a base character image that will be used as reference:

```bash
curl -X POST http://localhost:3001/api/ai/image \
  -H "Content-Type: application/json" \
  -d '{
    "task": "illustration",
    "prompt": "A young Muslim girl named Amira, 8 years old, warm brown skin, bright eyes, wearing a pink hijab and modest dress, neutral expression, full body, white background",
    "size": { "width": 1024, "height": 1024 }
  }'
```

Save the returned `imageUrl` - this is your character reference.

### 2. Generating Consistent Scenes

Use the character reference for all scene illustrations:

```bash
curl -X POST http://localhost:3001/api/ai/image \
  -H "Content-Type: application/json" \
  -d '{
    "task": "illustration",
    "prompt": "Amira playing in a garden with butterflies, happy expression",
    "references": ["https://replicate.delivery/.../character.png"],
    "referenceStrength": 0.85,
    "seed": 12345,
    "size": { "width": 1024, "height": 768 }
  }'
```

### 3. Frontend Integration

Update the image generation call in your frontend:

```typescript
import { generateImage } from '@/lib/ai/providers/imageProvider';

// Get character reference from your character store
const characterRef = characters[0].imageUrl;

// Generate scene with consistency
const result = await generateImage({
  prompt: sceneDescription,
  stage: 'illustrations',
  references: [characterRef], // Character consistency
  seed: sceneSeed, // For reproducibility
});
```

## API Reference

### Image Generation Request

```typescript
interface ImageRequest {
  task: "illustration" | "cover";
  prompt: string;
  references?: string[];      // Character reference URLs
  style?: string;
  size?: { width: number; height: number };
  count?: number;
  seed?: number;              // For reproducibility
  referenceStrength?: number; // 0.0-1.0, default 0.8
}
```

### Response

```typescript
interface ImageResponse {
  imageUrl: string;
  providerMeta?: {
    seed?: number;
    model?: string;
    processingTime?: number;
    characterReference?: string;
  };
  provider: string;
}
```

## Testing

### Run Character Consistency Test

```bash
# Ensure server is running
cd server && npm run dev

# In another terminal, run the test
cd /path/to/Noorstudio
node test_character_consistency.mjs
```

The test will:
1. Generate a base character reference
2. Create 4 different scenes with the same character
3. Generate 3 variations of one scene
4. Create an HTML report for visual comparison

Output is saved to `test_illustrations/consistency_test/`.

### Expected Results

- **Consistency Score**: 80-85% (based on research)
- **Facial Features**: Should be similar across scenes
- **Skin Tone**: Consistent warm brown
- **Clothing**: Pink hijab in all scenes
- **Expression**: Can vary naturally per scene

## Cost Estimates

| Metric | Value |
|--------|-------|
| Per Image | ~$0.049-0.05 |
| 32-Page Book | ~$1.60-5.00 |
| Consistency Improvement | 80-85% |

## Troubleshooting

### Issue: Character looks different in each scene

**Solution**: Ensure `referenceStrength` is set to 0.8-0.9

### Issue: Character not appearing

**Solution**: Verify the reference URL is accessible and correctly formatted

### Issue: API errors

**Check**: 
1. `REPLICATE_API_TOKEN` is set correctly
2. Token has billing enabled at replicate.com
3. Server was restarted after env changes

### Issue: Low consistency

**Tips**:
- Use higher `referenceStrength` (0.85-0.95)
- Add more detailed character descriptions
- Use consistent style prompts
- Keep character reference high quality

## Future Enhancements

### Phase 2: LoRA Training

For even higher consistency (90-95%), consider LoRA training:

1. User uploads 15-30 character images
2. Train LoRA model (30-60 min, ~$5-20)
3. Use trained model for all generations
4. Consistency score: 90-95%

### Phase 3: Hybrid Control

Combine multiple techniques:
- LoRA for base character
- IP-Adapter for face locking
- ControlNet for pose control
- Consistency score: 95-98%

## File Reference

| File | Purpose |
|------|---------|
| `server/lib/replicateProvider.ts` | Replicate API wrapper |
| `server/routes/ai.ts` | Image generation endpoint |
| `server/env.ts` | Environment configuration |
| `test_character_consistency.mjs` | E2E test script |
| `CHARACTER_CONSISTENCY.md` | This documentation |

## Resources

- [Replicate Consistent Character Model](https://replicate.com/fofr/consistent-character)
- [IP-Adapter Paper](https://github.com/tencent-ailab/IP-Adapter)
- [Research Report](../05_RESEARCH/noorstudio-character-consistency.md)

## Support

For issues or questions:
1. Check this documentation
2. Review the research report
3. Check server logs for detailed error messages
4. Verify Replicate billing at replicate.com/account/billing
