# Phase 5: Book Creation Refactor - Test Plan

## Changes Made

1. **Replaced MOCK_UNIVERSES with Real API**
   - Removed `MOCK_UNIVERSES` import from projectsStore
   - Added `useUniverses()` hook to fetch real universes
   - Updated all references to use `universes` from API

2. **Auto-populate Book Presets**
   - Modified `handleUniverseSelect()` to load universe.book_presets
   - Auto-fills: defaultAgeRange, defaultTemplate, defaultLayoutStyle, defaultTrimSize
   - Shows toast notification when presets are loaded

3. **Enhanced Universe Selection UI**
   - Added loading state for universes
   - Added error state for failed universe fetch
   - Added empty state with "Create Universe" CTA
   - Added "Create Universe" link next to label

## Manual Test Plan

### Test 1: Create Universe with Presets

1. Navigate to http://localhost:3007/app/universes/new
2. Create a new universe with:
   - Name: "Test Adventure World"
   - Description: "A magical world for testing"
   - (Note: Currently no UI for book_presets, will need database insert)
3. Verify universe is created and appears in list

### Test 2: Universe Selection in Book Builder

1. Navigate to http://localhost:3007/app/books/new
2. Verify Step 1 shows:
   - Loading state while fetching universes
   - List of available universes (including "Test Adventure World")
   - "Create Universe" link
3. Click on a universe card
4. Verify:
   - Universe is selected (highlighted border)
   - Form data updated with universeId and universeName
   - If presets exist, toast shows "Universe Settings Loaded"

### Test 3: Book Presets Auto-population

**Setup**: Insert universe with presets via SQL:
```sql
UPDATE universes
SET book_presets = '{
  "defaultAgeRange": "8-12",
  "defaultTemplate": "adventure",
  "defaultLayoutStyle": "split-page",
  "defaultTrimSize": "8x10"
}'::jsonb
WHERE name = 'Test Adventure World';
```

1. Navigate to http://localhost:3007/app/books/new
2. Select "Test Adventure World"
3. Click "Next" to Step 2
4. Verify:
   - Age Range pre-selected: "8-12"
   - Template Type pre-selected: "Middle-Grade Adventure"
5. Click "Next" twice to Step 4
6. Verify:
   - Layout Style pre-selected: "Split Page"
   - Trim Size pre-selected: "8\" × 10\""

### Test 4: Empty State

1. Clear all universes from database:
   ```sql
   UPDATE universes SET deleted_at = NOW();
   ```
2. Navigate to http://localhost:3007/app/books/new
3. Verify:
   - Empty state shows globe icon
   - Message: "No story worlds found"
   - "Create Your First Universe" button displayed
   - Clicking button navigates to /app/universes/new

### Test 5: Error Handling

1. Stop the backend server
2. Navigate to http://localhost:3007/app/books/new
3. Verify error message is displayed
4. Restart backend
5. Refresh page
6. Verify universes load correctly

### Test 6: End-to-End Book Creation

1. Ensure at least one universe exists with presets
2. Navigate to http://localhost:3007/app/books/new
3. Complete all 5 steps:
   - Step 1: Select universe + knowledge base
   - Step 2: Fill in title, synopsis (verify presets applied)
   - Step 3: Select at least one character
   - Step 4: Verify layout/trim presets, select export format
   - Step 5: Review and create
4. Verify:
   - Project created successfully
   - Redirected to /app/projects/{id}
   - Project contains correct universe_id

## Automated Test Commands

### Build Test
```bash
npm run build
```
Expected: Build succeeds without TypeScript errors

### Dev Server Test
```bash
npm run dev
```
Expected:
- Frontend runs on http://localhost:3007
- Backend runs on http://localhost:3002
- No console errors on page load

### API Health Check
```bash
curl http://localhost:3002/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`

## Success Criteria

- ✅ Build compiles without errors
- ✅ Dev servers start successfully
- ⏳ Universe selection loads from API (manual test required)
- ⏳ Book presets auto-populate form fields (manual test required)
- ⏳ Empty/loading/error states render correctly (manual test required)
- ⏳ End-to-end book creation works with universe (manual test required)

## Next Steps

After successful testing:
1. Move to Phase 6: Outline System with version control
2. Implement outline_versions integration
3. Add section-level locking UI
4. Test outline history and restore functionality
