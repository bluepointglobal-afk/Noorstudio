# Character Consistency Quick Reference

## 🚀 Quick Start (3 steps)

### 1. Configure Environment

```bash
# Add to server/.env
AI_IMAGE_PROVIDER=replicate
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxxxxxx
```

Get token: https://replicate.com/account/api-tokens

### 2. Generate Base Character

```typescript
const baseCharacter = await generateImage({
  prompt: "Amira, 8yo Muslim girl, warm brown skin, pink hijab, full body",
  stage: 'illustrations',
  size: { width: 1024, height: 1024 },
});
// Save baseCharacter.imageUrl
```

### 3. Generate Consistent Scenes

```typescript
const scene = await generateImage({
  prompt: "Amira playing in the garden with butterflies",
  stage: 'illustrations',
  characterReference: baseCharacter.imageUrl, // Key for consistency
  referenceStrength: 0.85, // 0.8-0.9 recommended
  seed: 12345, // For reproducibility
});
```

---

## 📊 Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `characterReference` | `string` | - | URL to base character image |
| `referenceStrength` | `number` | 0.8 | 0.0-1.0, higher = more consistent |
| `seed` | `number` | random | For reproducible results |
| `references` | `string[]` | [] | Additional pose/reference images |

---

## 🔧 API Endpoints

### Check Status
```bash
GET /api/ai/status
```

### Generate Image
```bash
POST /api/ai/image
Content-Type: application/json

{
  "task": "illustration",
  "prompt": "Amira playing in garden",
  "references": ["https://.../character.png"],
  "referenceStrength": 0.85,
  "seed": 12345,
  "size": { "width": 1024, "height": 768 }
}
```

---

## 🧪 Testing

```bash
# Run character consistency test
node test_character_consistency.mjs

# Output: test_illustrations/consistency_test/consistency_report.html
```

---

## 💰 Cost Estimates

| Item | Cost |
|------|------|
| Per image | ~$0.049 |
| 32-page book | ~$1.60-5.00 |
| Character ref | Included |

---

## 📈 Consistency Levels

| Approach | Consistency | Cost |
|----------|-------------|------|
| IP-Adapter (Current) | 80-85% | Low |
| LoRA (Phase 2) | 90-95% | Medium |
| Hybrid (Phase 3) | 95-98% | High |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Character varies | Increase `referenceStrength` to 0.85-0.95 |
| API errors | Check `REPLICATE_API_TOKEN` is set |
| No reference | Ensure `characterReference` is valid URL |
| Low quality | Check model loaded correctly |

---

## 📚 Resources

- Full Docs: `CHARACTER_CONSISTENCY.md`
- Research: `05_RESEARCH/noorstudio-character-consistency.md`
- Model: https://replicate.com/fofr/consistent-character

---

## ✨ Example: Multi-Page Book

```typescript
const characterRef = "https://.../amira-base.png";

const pages = [
  { scene: "Amira waking up", seed: 1001 },
  { scene: "Amira eating breakfast", seed: 1002 },
  { scene: "Amira walking to school", seed: 1003 },
  { scene: "Amira in classroom", seed: 1004 },
];

for (const page of pages) {
  const result = await generateImage({
    prompt: page.scene,
    stage: 'illustrations',
    characterReference: characterRef,
    referenceStrength: 0.85,
    seed: page.seed,
  });
  // Save result.imageUrl
}
```

---

*Updated: February 2026 | Phase 1 Implementation*
