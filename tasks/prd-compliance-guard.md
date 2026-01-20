# PRD: Compliance Guard (Complete Implementation)

**Feature:** #7 Compliance Guard
**Priority:** P2 - Nice to have
**Status:** In Progress (50% → 100%)

## Overview

Complete the Compliance Guard system to provide automated quality assurance for generated images. The pre-generation prompt enhancement already exists - this PRD focuses on post-generation validation, flagging, review queue, and re-generation triggers.

## Current State (50%)

Already implemented in `src/lib/ai/complianceGuard.ts`:
- ✅ ComplianceContext, CoverComplianceRules, IllustrationComplianceRules types
- ✅ buildCoverComplianceRules() - Extracts rules from project/characters
- ✅ enforceComplianceCoverPrompt() - Pre-generation prompt enhancement
- ✅ buildIllustrationComplianceRules() - Character anchors and style locks
- ✅ enforceComplianceIllustrationPrompt() - Pre-generation enhancement
- ✅ buildCharacterIdentityBlock() - Immutable trait blocks for prompts
- ✅ Negative prompt builders for covers and illustrations
- ✅ preflightCoverGeneration() - Pre-generation validation

## What's Missing (50%)

- ❌ Post-generation image analysis/validation
- ❌ Compliance report generation per image
- ❌ Automated flagging system
- ❌ Review queue data model
- ❌ Re-generation trigger functionality
- ❌ Compliance status tracking in artifacts

## Goals

1. Validate generated images against compliance rules
2. Generate actionable compliance reports
3. Flag non-compliant images for review
4. Enable one-click re-generation for failed images
5. Track compliance status throughout the pipeline

## Non-Goals

- AI-based image analysis (use rule-based checks)
- Computer vision for face matching (future)
- Automated approval without human review

## Technical Approach

### Compliance Check Flow
```
Image Generated → Run Compliance Checks → Generate Report → Flag if Failed → Add to Review Queue
```

### Data Model

**ComplianceReport:**
```typescript
interface ComplianceReport {
  imageId: string;
  imageType: "illustration" | "cover";
  generatedAt: string;
  checkedAt: string;
  status: "passed" | "failed" | "warning" | "pending_review";
  checks: ComplianceCheck[];
  overallScore: number; // 0-100
  flaggedReasons: string[];
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}
```

**ComplianceCheck:**
```typescript
interface ComplianceCheck {
  name: string;
  category: "character" | "style" | "content" | "technical";
  passed: boolean;
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}
```

## User Stories

### US-001: Compliance Report Types
Define TypeScript types for compliance reports.

**Acceptance Criteria:**
- Create `src/lib/ai/complianceTypes.ts` with all types
- Define ComplianceReport, ComplianceCheck interfaces
- Define ComplianceStatus enum
- Define ReviewQueueItem type
- Export from complianceGuard.ts
- Typecheck passes

### US-002: Post-Generation Validator
Create validation functions for generated images.

**Acceptance Criteria:**
- Create `src/lib/ai/complianceValidator.ts`
- Implement validateCoverImage() - checks cover-specific rules
- Implement validateIllustrationImage() - checks illustration rules
- Check metadata matches (dimensions, format)
- Check prompt compliance markers
- Return ComplianceReport with all checks
- Typecheck passes

### US-003: Character Consistency Checker
Validate character appearance against stored references.

**Acceptance Criteria:**
- Add validateCharacterConsistency() to validator
- Check character count matches expected
- Verify modesty rules metadata
- Check style consistency flag
- Generate character-specific warnings
- Typecheck passes

### US-004: Compliance Report Generator
Generate detailed compliance reports.

**Acceptance Criteria:**
- Create generateComplianceReport() function
- Calculate overall compliance score (0-100)
- Categorize issues by severity
- Generate actionable suggestions
- Store report in project artifacts
- Typecheck passes

### US-005: Flagging System
Automatically flag non-compliant images.

**Acceptance Criteria:**
- Create `src/lib/ai/complianceFlagging.ts`
- Implement flagImage() - adds to review queue
- Implement unflagImage() - removes from queue
- Implement getReviewQueue() - lists flagged items
- Store flags in project artifacts
- Typecheck passes

### US-006: Re-generation Triggers
Enable re-generation of failed images.

**Acceptance Criteria:**
- Create triggerRegeneration() function
- Accept complianceReport and original params
- Generate enhanced prompt based on failures
- Add re-generation metadata to track attempts
- Limit max regeneration attempts (3)
- Typecheck passes

### US-007: Compliance Status Integration
Integrate compliance tracking into existing pipeline.

**Acceptance Criteria:**
- Update IllustrationArtifact type with complianceReport field
- Update CoverArtifact type with complianceReport field
- Add compliance status to project pipeline state
- Export unified compliance API from index
- Typecheck passes

## Success Metrics

- Every generated image has a compliance report
- Non-compliant images are automatically flagged
- Failed images can be re-generated with one click
- Compliance score visible in project status

## Dependencies

- Existing complianceGuard.ts (pre-generation)
- Project artifacts storage
- Image generation pipeline

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| False positives | Conservative thresholds, human review option |
| Slow validation | Async processing, cache results |
| Re-gen loops | Max attempt limit (3) |
