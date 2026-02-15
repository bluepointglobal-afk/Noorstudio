# Phase 6: Outline System with Version Control - Test Plan

## Changes Made

1. **Created OutlineVersionHistory Component**
   - `src/components/outline/OutlineVersionHistory.tsx`
   - Displays version history with expandable details
   - Section-level locking UI
   - Version restore functionality
   - Current version indicator

## Features

### Version History Display
- Shows all outline versions for a book
- Displays version number, timestamp, change summary
- Highlights current version with badge
- Shows chapter count and locked section count
- Expandable/collapsible version details

### Section Locking
- Checkbox interface for each chapter
- Visual feedback (locked chapters highlighted)
- "Save Locks" button appears when changes are made
- Locked indicator shows lock count
- Help text explains locking behavior

### Version Restore
- "Restore" button on non-current versions
- Sets selected version as current
- Updates UI immediately
- Shows success toast notification
- Triggers onVersionChange callback

## Component API

```typescript
interface OutlineVersionHistoryProps {
  bookId: string;
  onVersionChange?: (version: OutlineVersion) => void;
}
```

## Manual Test Plan

### Test 1: Display Version History

**Setup**: Create test outline versions via SQL:
```sql
-- Get a test book
SELECT id FROM projects WHERE title LIKE '%Test%' LIMIT 1;

-- Insert test outline versions
INSERT INTO outline_versions (book_id, data, is_current, change_summary)
VALUES
  ('<book_id>', '{
    "chapters": ["Chapter 1: The Beginning", "Chapter 2: The Journey", "Chapter 3: The End"],
    "synopsis": "A test story"
  }'::jsonb, true, 'Initial outline'),
  ('<book_id>', '{
    "chapters": ["Chapter 1: A New Start", "Chapter 2: The Adventure", "Chapter 3: The Finale"],
    "synopsis": "Updated test story"
  }'::jsonb, false, 'Revised chapter titles');
```

**Test Steps**:
1. Add `<OutlineVersionHistory bookId="<book_id>" />` to a test page
2. Verify:
   - Both versions display
   - Current version shows "Current" badge
   - Timestamps are formatted correctly
   - Change summaries are displayed
   - Chapter counts show (3 chapters)

### Test 2: Expand Version Details

1. Click chevron icon next to a version
2. Verify:
   - Version expands to show chapter list
   - All 3 chapters are listed
   - Lock checkboxes are rendered
   - "Chapter Locks" label displayed
   - Help text shown for current version

### Test 3: Toggle Section Locks

1. Expand current version
2. Click checkbox for "Chapter 1"
3. Verify:
   - Checkbox becomes checked
   - Chapter row highlights (bg-primary/10)
   - Lock icon appears (instead of unlock)
   - "Save Locks" button appears
4. Click "Save Locks"
5. Verify:
   - API call made to /api/outline-versions/:id/lock-sections
   - Toast shows "Locks Saved"
   - Button disappears
   - Locked count updates (shows "1 locked")

### Test 4: Restore Previous Version

1. Find a non-current version
2. Verify "Restore" button is visible
3. Click "Restore"
4. Verify:
   - API call made to /api/outline-versions/:id/set-current
   - Toast shows "Version X is now the current outline"
   - Previous current version loses "Current" badge
   - Restored version gains "Current" badge
   - onVersionChange callback fired (if provided)

### Test 5: Loading State

1. Render component with slow network
2. Verify:
   - Loading state shows with pulsing clock icon
   - "Loading version history..." message displayed

### Test 6: Empty State

1. Render component for book with no versions
2. Verify:
   - Empty state shows history icon
   - Message: "No version history available"
   - Subtext: "Versions will appear here after outline changes"

### Test 7: Error Handling

1. Stop backend server
2. Render component
3. Verify:
   - Toast shows error message
   - Component handles gracefully

## Integration Testing

### Test 8: Integration with ProjectWorkspacePage

**Note**: This will be implemented after current component is tested.

1. Add version history panel to ProjectWorkspacePage
2. Place near outline editor
3. Verify:
   - Versions load when outline exists
   - Creating new outline creates version
   - Editing outline creates new version
   - Locked chapters skip regeneration

## Automated Tests

### Build Test
```bash
npm run build
```
Expected: ✅ Build succeeds without TypeScript errors

### Component Mount Test
```bash
# TODO: Add unit tests with vitest/jest
```

## Database Queries for Testing

### View All Versions for a Book
```sql
SELECT
  id,
  version_number,
  is_current,
  change_summary,
  locked_sections,
  created_at
FROM outline_versions
WHERE book_id = '<book_id>'
ORDER BY version_number DESC;
```

### Set Version as Current
```sql
UPDATE outline_versions
SET is_current = true
WHERE id = '<version_id>';
-- Trigger will automatically unset other versions
```

### Add Locked Sections
```sql
UPDATE outline_versions
SET locked_sections = '["0", "2"]'::jsonb
WHERE id = '<version_id>';
```

## Success Criteria

- ✅ Component builds without TypeScript errors
- ⏳ Displays version history correctly
- ⏳ Section locking UI works
- ⏳ Version restore functionality works
- ⏳ Loading/empty/error states render
- ⏳ Toast notifications appear
- ⏳ API calls succeed with proper auth

## Next Steps

After Phase 6 testing:
1. Integrate OutlineVersionHistory into ProjectWorkspacePage
2. Hook up outline save to create new versions
3. Implement version comparison/diff view
4. Add inline editing of change summaries
5. Move to Phase 7: Illustration Studio
