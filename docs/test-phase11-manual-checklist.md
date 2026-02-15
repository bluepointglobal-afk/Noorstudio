# Phase 11: Manual UI Testing Checklist

**Prerequisites:**
- ✅ E2E test data loaded (`run-database-tests.sh`)
- ✅ Dev server running (`npm run dev`)
- ✅ Browser open to `http://localhost:5173`

---

## 1. Universe Creation Workflow

### Test 1.1: Create Universe with Full Presets
**Steps:**
- [ ] Navigate to /app/universes
- [ ] Click "Create Universe" button
- [ ] Fill in form:
  - Name: "Test Universe Full"
  - Description: "Testing full presets"
  - Book Presets: Set all fields (age range, template, layout, trim size)
  - Visual DNA: Add style description
  - Writing DNA: Add tone description
  - Tags: Add 2-3 tags
- [ ] Click "Create"
- [ ] Verify redirect to universe detail page
- [ ] Verify all data displayed correctly
- [ ] Verify book_count = 0

**Pass Criteria:**
- [ ] Form validation works
- [ ] Toast notification appears
- [ ] Redirect successful
- [ ] All data persisted
- [ ] Stats cards display correctly

---

### Test 1.2: Create Universe with Partial Presets
**Steps:**
- [ ] Create new universe with only some preset fields filled
- [ ] Verify creation successful
- [ ] Check that missing presets don't cause errors

**Pass Criteria:**
- [ ] Partial presets accepted
- [ ] No errors for missing fields
- [ ] Default values used where appropriate

---

### Test 1.3: Create Universe with No Presets
**Steps:**
- [ ] Create new universe with empty presets object
- [ ] Verify creation successful

**Pass Criteria:**
- [ ] Empty presets accepted
- [ ] No crashes or errors

---

## 2. Book Creation with Preset Auto-Population

### Test 2.1: Book Creation with Universe
**Steps:**
- [ ] Navigate to /app/new-book (BookBuilderPage)
- [ ] Select "Fantasy Quest Series" from universe dropdown
- [ ] Verify form fields auto-populate:
  - Age Range: "8-12"
  - Template: "adventure"
  - Layout Style: "split-page"
  - Trim Size: "8x10"
- [ ] Verify toast notification: "Presets loaded"
- [ ] Fill in title: "Auto-Preset Test Book"
- [ ] Click "Create Book"
- [ ] Verify book created with correct presets

**Pass Criteria:**
- [ ] Universe dropdown loads from API
- [ ] Presets auto-fill correctly
- [ ] Toast appears on preset load
- [ ] Book creation successful
- [ ] book_count incremented in universe

---

### Test 2.2: Book Creation Without Universe
**Steps:**
- [ ] Select "No Universe" option
- [ ] Verify form fields remain empty
- [ ] Manually fill all fields
- [ ] Create book successfully

**Pass Criteria:**
- [ ] No presets applied
- [ ] Manual input works
- [ ] Book created without universe_id

---

## 3. Illustration Studio

### Test 3.1: View Illustrations
**Steps:**
- [ ] Navigate to universe detail page (Fantasy Quest Series)
- [ ] Click "Illustrations" tab
- [ ] Verify illustrations load:
  - Hero in Forest (pending)
  - Castle Approach (draft, 2 variants)
  - Magic Battle (approved, usage_count = 1)

**Pass Criteria:**
- [ ] All illustrations displayed
- [ ] Status badges show correct colors
- [ ] Usage counts accurate
- [ ] Thumbnails display correctly

---

### Test 3.2: Create New Illustration
**Steps:**
- [ ] Click "Create Illustration" button
- [ ] Fill in form:
  - Name: "Test Illustration"
  - Description: "Manual test creation"
  - Prompt: "A test scene"
- [ ] Click "Create"
- [ ] Verify illustration appears with status = "pending"
- [ ] Verify no thumbnail (not generated yet)

**Pass Criteria:**
- [ ] Create dialog works
- [ ] Form validation functional
- [ ] Toast notification appears
- [ ] New illustration in list
- [ ] Status = pending

---

### Test 3.3: Search Illustrations
**Steps:**
- [ ] Type "Castle" in search box
- [ ] Verify "Castle Approach" appears
- [ ] Verify other illustrations hidden
- [ ] Clear search
- [ ] Verify all illustrations return

**Pass Criteria:**
- [ ] Search filters correctly
- [ ] Real-time filtering works
- [ ] Clear search works

---

### Test 3.4: Approve Illustration
**Steps:**
- [ ] Find "Castle Approach" (draft status)
- [ ] Click "Approve" button
- [ ] Verify status badge changes to "approved"
- [ ] Verify data persisted (refresh page)

**Pass Criteria:**
- [ ] Approve action works
- [ ] Status updates immediately
- [ ] Toast notification appears
- [ ] Change persisted to database

---

### Test 3.5: Unapprove Illustration
**Steps:**
- [ ] Find "Magic Battle" (approved status)
- [ ] Click "Unapprove" button
- [ ] Verify status changes to "draft"

**Pass Criteria:**
- [ ] Unapprove action works
- [ ] Status updates correctly
- [ ] Persisted to database

---

## 4. Cover Studio

### Test 4.1: View Covers
**Steps:**
- [ ] Navigate to universe detail page
- [ ] Click "Covers" tab
- [ ] Verify covers load:
  - Front cover (draft)
  - Full cover (approved, usage_count = 1)

**Pass Criteria:**
- [ ] All covers displayed
- [ ] Type badges show correctly
- [ ] Template labels accurate
- [ ] Usage counts correct

---

### Test 4.2: Filter by Cover Type
**Steps:**
- [ ] Click cover type filter dropdown
- [ ] Select "front"
- [ ] Verify only front covers show
- [ ] Select "full"
- [ ] Verify only full covers show
- [ ] Select "all"
- [ ] Verify all covers show

**Pass Criteria:**
- [ ] Filter dropdown works
- [ ] Filtering accurate
- [ ] All types supported

---

### Test 4.3: Create New Cover
**Steps:**
- [ ] Click "Create Cover" button
- [ ] Fill in form:
  - Cover Type: "back"
  - Template: "modern"
  - Title: "Test Cover"
  - Author: "Test Author"
- [ ] Click "Create"
- [ ] Verify cover created with status = "pending"

**Pass Criteria:**
- [ ] Create dialog works
- [ ] All cover types available
- [ ] All templates available
- [ ] Cover created successfully

---

## 5. Outline Version History

### Test 5.1: View Version History
**Steps:**
- [ ] Navigate to a book detail page (The Crystal of Light)
- [ ] Find OutlineVersionHistory component
- [ ] Verify 3 versions displayed:
  - v1: 5 chapters, 0 locked
  - v2: 6 chapters, 2 locked
  - v3: 6 chapters, 3 locked (current)
- [ ] Verify "Current" badge on v3

**Pass Criteria:**
- [ ] All versions listed
- [ ] Version numbers correct
- [ ] Locked counts accurate
- [ ] Current badge on latest version

---

### Test 5.2: Expand Version Details
**Steps:**
- [ ] Click on version 2 to expand
- [ ] Verify chapter list displays
- [ ] Verify locked chapters highlighted
- [ ] Verify chapter titles shown
- [ ] Collapse version
- [ ] Verify content hidden

**Pass Criteria:**
- [ ] Expand/collapse works
- [ ] Chapter details shown
- [ ] Locked sections highlighted
- [ ] UI smooth and responsive

---

### Test 5.3: Lock/Unlock Sections
**Steps:**
- [ ] Expand version 3 (current)
- [ ] Click checkbox next to an unlocked chapter
- [ ] Verify checkbox checked
- [ ] Click "Save Locks" button
- [ ] Verify toast notification
- [ ] Refresh page
- [ ] Verify lock persisted

**Pass Criteria:**
- [ ] Checkbox interaction works
- [ ] Save locks functional
- [ ] Toast appears
- [ ] Changes persisted

---

### Test 5.4: Restore Previous Version
**Steps:**
- [ ] Find version 1 (not current)
- [ ] Click "Restore" button
- [ ] Verify confirmation (if any)
- [ ] Verify "Current" badge moves to version 1
- [ ] Verify version 3 no longer current
- [ ] Refresh page
- [ ] Verify change persisted

**Pass Criteria:**
- [ ] Restore button works
- [ ] Current version updates
- [ ] UI updates immediately
- [ ] Toast notification appears
- [ ] Change persisted

---

## 6. Loading States

### Test 6.1: Universe List Loading
**Steps:**
- [ ] Navigate to /app/universes
- [ ] Observe loading state while data fetches
- [ ] Verify spinner displays
- [ ] Verify loading message shown

**Pass Criteria:**
- [ ] Loading indicator appears
- [ ] No flash of content
- [ ] Smooth transition to loaded state

---

### Test 6.2: Asset Studio Loading
**Steps:**
- [ ] Navigate to universe detail page
- [ ] Switch between tabs (Illustrations/Covers)
- [ ] Observe loading states
- [ ] Verify smooth transitions

**Pass Criteria:**
- [ ] Loading states appear
- [ ] No UI jumps
- [ ] Smooth tab switching

---

## 7. Error States

### Test 7.1: Network Error
**Steps:**
- [ ] Open browser dev tools
- [ ] Throttle network to "Offline"
- [ ] Try to load universes page
- [ ] Verify error message displays
- [ ] Verify error message is user-friendly
- [ ] Restore network
- [ ] Verify retry works

**Pass Criteria:**
- [ ] Error message clear
- [ ] No technical jargon
- [ ] Retry option available
- [ ] No app crash

---

### Test 7.2: 404 Universe
**Steps:**
- [ ] Navigate to /app/universes/invalid-uuid
- [ ] Verify 404 error message
- [ ] Verify "Back to Universes" button
- [ ] Click button
- [ ] Verify redirect works

**Pass Criteria:**
- [ ] 404 handled gracefully
- [ ] Clear error message
- [ ] Navigation option provided

---

## 8. Empty States

### Test 8.1: No Universes
**Steps:**
- [ ] Delete all test universes (or use fresh database)
- [ ] Navigate to /app/universes
- [ ] Verify empty state message
- [ ] Verify "Create Universe" CTA
- [ ] Click CTA
- [ ] Verify redirect to creation form

**Pass Criteria:**
- [ ] Helpful empty state message
- [ ] Clear CTA button
- [ ] Good UX, no confusion
- [ ] CTA redirects correctly

---

### Test 8.2: No Assets in Studio
**Steps:**
- [ ] Create new universe with no assets
- [ ] Navigate to detail page
- [ ] Click Illustrations tab
- [ ] Verify empty state message
- [ ] Verify "Create Illustration" CTA

**Pass Criteria:**
- [ ] Empty state helpful
- [ ] CTA present
- [ ] No blank screens

---

## 9. Performance Testing

### Test 9.1: Large Asset List
**Steps:**
- [ ] Navigate to "Animal Kingdom Chronicles" universe
- [ ] Click Illustrations tab
- [ ] Verify 30+ illustrations load
- [ ] Measure load time (should be < 2 seconds)
- [ ] Test search performance
- [ ] Test filter performance
- [ ] Test scrolling smoothness

**Pass Criteria:**
- [ ] Load time acceptable (< 2s)
- [ ] Search responsive (< 500ms)
- [ ] Filter instant
- [ ] No UI lag
- [ ] Smooth scrolling

---

## 10. Edge Cases

### Test 10.1: Long Universe Name
**Steps:**
- [ ] Create universe with very long name (100+ characters)
- [ ] Verify UI doesn't break
- [ ] Verify text truncation or wrapping
- [ ] Verify readable in list and detail views

**Pass Criteria:**
- [ ] Long names handled
- [ ] UI remains intact
- [ ] Text readable

---

### Test 10.2: Special Characters
**Steps:**
- [ ] Create universe with special characters in name: "Test & <Script>"
- [ ] Verify HTML escaping works
- [ ] Verify no XSS vulnerability
- [ ] Verify display correct

**Pass Criteria:**
- [ ] Special chars handled
- [ ] No XSS issues
- [ ] Display safe

---

### Test 10.3: Concurrent Updates
**Steps:**
- [ ] Open same universe in two browser tabs
- [ ] Edit in tab 1, save
- [ ] View in tab 2 (refresh)
- [ ] Verify latest data shown
- [ ] Edit in tab 2
- [ ] Verify no conflicts

**Pass Criteria:**
- [ ] No data corruption
- [ ] Latest data wins
- [ ] No errors

---

## Summary Checklist

### Core Functionality
- [ ] Universe CRUD operations
- [ ] Book creation with presets
- [ ] Illustration studio
- [ ] Cover studio
- [ ] Outline version history
- [ ] Search and filter
- [ ] Approve/unapprove workflow

### UI/UX
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive design
- [ ] Navigation flows

### Performance
- [ ] Large datasets
- [ ] Search responsiveness
- [ ] Filter performance
- [ ] Page load times

### Edge Cases
- [ ] Long inputs
- [ ] Special characters
- [ ] Network failures
- [ ] Concurrent edits

---

## Bug Reporting Template

When you find a bug, document it:

```markdown
### Bug #[N]: [Title]
**Severity:** Critical | High | Medium | Low
**Test:** [Test number from checklist]

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected:**
[What should happen]

**Actual:**
[What actually happened]

**Screenshots:**
[Attach if relevant]

**Browser:**
[Browser and version]

**Console Errors:**
[Any errors from browser console]
```

---

**Testing Started:** _____________
**Testing Completed:** _____________
**Total Bugs Found:** _____________
**Critical Bugs:** _____________
**Status:** Pass / Fail / Blocked
