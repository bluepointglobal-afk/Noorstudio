# Phase 11: Testing & Validation Plan

**Date:** February 15, 2026
**Status:** In Progress
**Goal:** Comprehensive validation of Universe V2 system

---

## 1. End-to-End Testing

### 1.1 Complete Universe Workflow
**Test:** Create universe → Create book → Generate assets → Approve assets → Reuse in second book

**Steps:**
1. Create new universe "Fantasy Series" with visual DNA and book presets
2. Verify universe appears in list with 0 books, 0 characters
3. Create book in universe with preset auto-population
4. Generate 3 illustrations for the book
5. Verify assets created with pending → draft status
6. Approve 1 illustration
7. Create second book in same universe
8. Generate illustrations and verify approved asset is reused
9. Check usage_count incremented to 2

**Expected Results:**
- All presets auto-populate correctly
- Assets link properly via book_assets table
- Usage count triggers fire correctly
- Reuse logic finds and links approved assets
- No duplicate asset generation when reuse enabled

**Success Criteria:**
- ✅ Universe created successfully
- ✅ Book presets applied automatically
- ✅ Assets generated and linked
- ✅ Approval workflow functional
- ✅ Reuse logic working
- ✅ Usage counts accurate

---

### 1.2 Outline Version Control
**Test:** Create outline → Lock sections → Regenerate → Restore previous version

**Steps:**
1. Create book with 5-chapter outline (version 1)
2. Lock chapters 1 and 3
3. Regenerate outline (should create version 2)
4. Verify locked chapters unchanged, others regenerated
5. View version history
6. Restore version 1
7. Verify version 1 is now current

**Expected Results:**
- Version auto-increments (v1 → v2)
- Locked sections persist
- is_current flag updates correctly
- Version restore sets new current version
- Change summaries display correctly

**Success Criteria:**
- ✅ Versions created automatically
- ✅ Section locking prevents changes
- ✅ Version history displays all versions
- ✅ Restore functionality works
- ✅ Only one current version at a time

---

### 1.3 Asset Studio Workflows
**Test:** Illustration Studio complete workflow

**Steps:**
1. Navigate to universe detail page
2. Click Illustrations tab
3. Create new illustration manually
4. Verify status = pending
5. Generate image variants (mock generation)
6. Update to draft status
7. Approve illustration
8. Search for illustration by name
9. Filter by status
10. Use illustration in a book

**Expected Results:**
- All CRUD operations work
- Status transitions: pending → draft → approved
- Search and filter functional
- Usage count increments when used
- Thumbnails display correctly

**Success Criteria:**
- ✅ Create illustration works
- ✅ Status workflow functional
- ✅ Search/filter works
- ✅ Approve/unapprove works
- ✅ Usage tracking accurate

---

### 1.4 Cover Studio Workflows
**Test:** Cover Studio with different types and templates

**Steps:**
1. Navigate to universe detail page
2. Click Covers tab
3. Create front cover with classic template
4. Create full cover with modern template
5. Create back cover with ornate template
6. Filter by type (front, back, full)
7. Approve modern full cover
8. Use approved cover in book
9. Verify usage count = 1

**Expected Results:**
- All cover types supported
- All templates available
- Type filtering works
- Approval workflow functional
- Cover assets link to books correctly

**Success Criteria:**
- ✅ All cover types create successfully
- ✅ Template selection works
- ✅ Type filtering functional
- ✅ Approval workflow works
- ✅ Usage linking correct

---

## 2. Integration Testing

### 2.1 Asset Generation Integration
**Test:** Verify assetGeneration.ts integrates with real API

**Steps:**
1. Create test project with universe_id
2. Call generateIllustrationsAsAssets with test chapters
3. Verify API calls:
   - getUniverse() for context
   - findApprovedIllustration() for reuse check
   - createAsset() for new assets
   - updateAsset() for variants
   - createBookAsset() for linking
4. Check database for created records
5. Verify usage_count trigger fired

**Expected Results:**
- All API calls execute successfully
- Assets created in database
- book_assets records created
- usage_count incremented by trigger
- Progress callbacks fire correctly

**Success Criteria:**
- ✅ Universe context loaded
- ✅ Reuse check executes
- ✅ Asset creation successful
- ✅ Linking successful
- ✅ Triggers fire correctly

---

### 2.2 React Hooks Integration
**Test:** Verify useAssetGeneration hooks work in UI

**Manual Test (requires running dev server):**
1. Open book generation page
2. Select universe with approved illustrations
3. Trigger illustration generation
4. Observe progress updates in UI
5. Verify toast notifications
6. Check generated assets appear in list
7. Verify error handling on API failure

**Expected Results:**
- Progress bar updates in real-time
- Toast notifications appear
- Loading states display correctly
- Error states handled gracefully
- Generated assets appear immediately

**Success Criteria:**
- ✅ Progress tracking works
- ✅ Toast notifications appear
- ✅ Loading states functional
- ✅ Error handling works
- ✅ UI updates on completion

---

## 3. Edge Case Validation

### 3.1 Missing Universe Context
**Test:** Generate assets without universe_id

**Steps:**
1. Create book with universe_id = null
2. Attempt to generate illustrations
3. Verify generation succeeds without universe context
4. Check prompts don't include universe DNA
5. Verify no errors thrown

**Expected Results:**
- Generation completes successfully
- Base prompts used (no enhancement)
- No crashes or errors
- Assets still created and linked

**Success Criteria:**
- ✅ Handles null universe gracefully
- ✅ Falls back to base prompts
- ✅ No errors thrown
- ✅ Assets created successfully

---

### 3.2 No Approved Assets for Reuse
**Test:** Reuse enabled but no approved assets exist

**Steps:**
1. Create new universe (no assets)
2. Create book in universe
3. Enable asset reuse
4. Generate illustrations
5. Verify new assets created (not reused)
6. No errors about missing assets

**Expected Results:**
- findApprovedIllustration returns null
- New asset generation proceeds
- No errors or warnings
- Normal generation flow

**Success Criteria:**
- ✅ Handles empty asset library
- ✅ Falls back to generation
- ✅ No errors thrown
- ✅ New assets created

---

### 3.3 Generation Cancellation
**Test:** Cancel generation mid-process

**Steps:**
1. Start illustration generation (5 chapters)
2. Cancel after 2 chapters complete
3. Verify partial assets created
4. Check database for 2 assets (not 5)
5. Verify book_assets links only 2
6. No orphaned pending assets

**Expected Results:**
- Generation stops immediately
- Only completed assets saved
- No incomplete assets in database
- Clean cancellation, no errors

**Success Criteria:**
- ✅ Cancellation immediate
- ✅ Partial progress saved
- ✅ No orphaned records
- ✅ Clean error handling

---

### 3.4 API Failures
**Test:** Handle backend API errors gracefully

**Scenarios:**
1. getUniverse() fails (404)
2. createAsset() fails (500)
3. createBookAsset() fails (500)
4. Network timeout

**Expected Results:**
- Error caught and reported
- Toast notification shown
- Generation marked as failed
- No partial data corruption
- User can retry

**Success Criteria:**
- ✅ Errors caught
- ✅ User notified
- ✅ No data corruption
- ✅ Retry possible

---

### 3.5 Large Datasets
**Test:** Performance with many assets

**Steps:**
1. Create universe with 50 illustrations
2. Create universe with 20 covers
3. Navigate to asset studios
4. Test search performance
5. Test filter performance
6. Test pagination (if implemented)

**Expected Results:**
- Page loads in < 2 seconds
- Search responds in < 500ms
- Filter responds immediately
- No UI freezing
- Smooth scrolling

**Success Criteria:**
- ✅ Acceptable load times
- ✅ Responsive search
- ✅ Responsive filtering
- ✅ No performance degradation

---

## 4. Database Integrity Testing

### 4.1 Trigger Validation
**Test:** All database triggers fire correctly

**SQL Tests:**
```sql
-- Test 1: book_count trigger
INSERT INTO projects (universe_id, ...) VALUES ('uuid', ...);
SELECT book_count FROM universes WHERE id = 'uuid';
-- Expected: book_count incremented

-- Test 2: usage_count trigger
INSERT INTO book_assets (book_id, asset_id, ...) VALUES (...);
SELECT usage_count FROM assets WHERE id = 'asset_id';
-- Expected: usage_count incremented

-- Test 3: version_number trigger
INSERT INTO outline_versions (book_id, ...) VALUES (...);
SELECT version_number FROM outline_versions WHERE book_id = '...';
-- Expected: auto-incremented from previous

-- Test 4: is_current constraint
UPDATE outline_versions SET is_current = true WHERE id = 'v2';
SELECT COUNT(*) FROM outline_versions WHERE book_id = '...' AND is_current = true;
-- Expected: exactly 1
```

**Success Criteria:**
- ✅ book_count trigger fires
- ✅ usage_count trigger fires
- ✅ version_number trigger fires
- ✅ is_current constraint enforced

---

### 4.2 Soft Delete Validation
**Test:** Soft delete functionality

**Steps:**
1. Create universe
2. Soft delete universe (deleted_at = now)
3. Verify universe not in list
4. Check database: deleted_at IS NOT NULL
5. Verify books still accessible
6. Verify assets still accessible

**Expected Results:**
- Universe hidden from lists
- Data not physically deleted
- Related data preserved
- Can be restored if needed

**Success Criteria:**
- ✅ Soft delete works
- ✅ Data preserved
- ✅ Hidden from UI
- ✅ Relations intact

---

## 5. TypeScript Type Safety

### 5.1 Compile-Time Validation
**Test:** TypeScript catches type errors

**Build Test:**
```bash
npm run build
```

**Expected Results:**
- Zero TypeScript errors
- All types resolve correctly
- No `any` type warnings (where avoidable)
- Strict mode compliance

**Success Criteria:**
- ✅ Build succeeds
- ✅ No type errors
- ✅ Proper type inference
- ✅ No unsafe casts

---

### 5.2 API Contract Validation
**Test:** Frontend-backend type alignment

**Check:**
1. Compare API response types in server models
2. Compare API request types in frontend API clients
3. Verify matching field names
4. Verify matching data types
5. Check JSONB field structures

**Expected Results:**
- Perfect alignment between frontend/backend
- No field name mismatches
- No type mismatches
- JSONB fields properly typed

**Success Criteria:**
- ✅ Types aligned
- ✅ No mismatches
- ✅ Safe type assertions
- ✅ Proper interfaces

---

## 6. UI/UX Testing

### 6.1 Loading States
**Test:** All loading states display correctly

**Check:**
1. UniverseDetailPage loading
2. IllustrationStudio loading
3. CoverStudio loading
4. Asset generation in progress
5. Outline version fetching

**Expected Results:**
- Spinners appear immediately
- Loading message clear
- No content flash
- Smooth transitions

**Success Criteria:**
- ✅ Loading indicators present
- ✅ Clear messaging
- ✅ No UI jumps
- ✅ Smooth UX

---

### 6.2 Error States
**Test:** Error states display helpful messages

**Check:**
1. API failure messages
2. Network error messages
3. Validation error messages
4. Empty state messages
5. 404 error pages

**Expected Results:**
- Clear error descriptions
- Actionable error messages
- No technical jargon
- Retry options available

**Success Criteria:**
- ✅ Clear errors
- ✅ User-friendly language
- ✅ Retry available
- ✅ No crashes

---

### 6.3 Empty States
**Test:** Empty states guide users

**Check:**
1. No universes created yet
2. No assets in studio
3. No outline versions
4. No books in universe

**Expected Results:**
- Helpful empty state messages
- CTA buttons to create content
- Icons/illustrations for clarity
- No confusing blank screens

**Success Criteria:**
- ✅ Helpful messages
- ✅ Clear CTAs
- ✅ Good UX
- ✅ No blank screens

---

## 7. Test Execution Plan

### Phase 11A: Core Functionality (Day 1)
- [ ] Section 1: End-to-End Testing (1.1 - 1.4)
- [ ] Section 4: Database Integrity (4.1 - 4.2)
- [ ] Section 5: TypeScript Safety (5.1 - 5.2)

### Phase 11B: Integration & Edge Cases (Day 2)
- [ ] Section 2: Integration Testing (2.1 - 2.2)
- [ ] Section 3: Edge Cases (3.1 - 3.5)
- [ ] Section 6: UI/UX Testing (6.1 - 6.3)

### Phase 11C: Bug Fixes & Polish (Day 3)
- [ ] Fix all bugs found in 11A and 11B
- [ ] Regression testing
- [ ] Final build verification
- [ ] Documentation updates

---

## 8. Test Data Requirements

### Universes
- Universe with full presets
- Universe with partial presets
- Universe with no presets
- Universe with 50+ assets
- Universe with 0 assets

### Books
- Book with universe_id
- Book without universe_id (null)
- Book with 3 chapters
- Book with 10 chapters
- Book with outline versions

### Assets
- Pending illustrations
- Draft illustrations
- Approved illustrations
- Illustrations with 0 usage
- Illustrations with 5+ usage
- All cover types (front, back, full, spine)
- All cover templates

---

## 9. Bug Tracking Template

```markdown
### Bug #[N]: [Title]
**Severity:** Critical | High | Medium | Low
**Found In:** [Section number]
**Steps to Reproduce:**
1. ...
2. ...

**Expected:** ...
**Actual:** ...
**Fix Applied:** ...
**Verified:** [ ] Yes / [ ] No
```

---

## 10. Success Metrics

**Definition of Done for Phase 11:**
- [ ] All E2E tests pass
- [ ] All integration tests pass
- [ ] All edge cases handled gracefully
- [ ] All database triggers verified
- [ ] Zero TypeScript errors
- [ ] All UI states tested
- [ ] All bugs fixed
- [ ] Build succeeds
- [ ] Documentation updated

**Target Completion:** 2-3 days
**Start Date:** February 15, 2026

---

**Next Phase:** Phase 12 - Deployment & Cutover
