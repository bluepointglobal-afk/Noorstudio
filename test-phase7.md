# Phase 7: Illustration Studio - Test Plan

## Changes Made

1. **Created IllustrationStudio Component**
   - `src/components/illustration/IllustrationStudio.tsx`
   - Manages illustration assets for a universe
   - Create/approve/reject workflow
   - Search and filter illustrations
   - Usage count tracking

## Features

### Illustration Management
- Grid display of all illustrations in universe
- Thumbnail preview with status badge
- Usage count indicator (shows how many books use this illustration)
- Search by name or description

### Creation Workflow
- "New Illustration" dialog
- Form fields: name, description, scene context, prompt
- Creates illustration asset in "pending" status
- Ready for generation integration

### Approval Workflow
- **Pending**: Illustration is being generated
- **Draft**: Generated, awaiting approval
- **Approved**: Ready for use in books
- Actions:
  - Approve: Moves draft → approved
  - Unapprove: Moves approved → draft
  - Use: Links approved illustration to a book

### Visual Feedback
- Status badges with color coding:
  - Pending: Yellow
  - Draft: Blue
  - Approved: Green
- Usage count badge (shows link icon + count)
- Empty state with CTA
- Loading/error states

## Component API

```typescript
interface IllustrationStudioProps {
  universeId: string;
  onSelectIllustration?: (illustrationId: string) => void;
}
```

## Manual Test Plan

### Test 1: Display Illustration Gallery

**Setup**: Run test-phase7-setup.sql to create sample illustrations

**Test Steps**:
1. Add `<IllustrationStudio universeId="<universe_id>" />` to a test page
2. Verify:
   - All illustrations display in grid
   - Thumbnails load correctly
   - Status badges show correct colors
   - Usage counts display accurately
   - Empty state when no illustrations exist

### Test 2: Search Illustrations

1. Enter "desert" in search box
2. Verify:
   - Only matching illustrations display
   - Search works for name and description
3. Clear search
4. Verify all illustrations return

### Test 3: Create New Illustration

1. Click "New Illustration" button
2. Verify dialog opens with form fields
3. Fill in:
   - Name: "Magical Forest Scene"
   - Description: "Enchanted forest with glowing trees"
   - Scene: "Chapter 5 - The Enchanted Woods"
   - Prompt: "Magical forest landscape with bioluminescent trees..."
4. Click "Create & Generate"
5. Verify:
   - API call made to /api/assets (POST)
   - Toast shows "Illustration Created"
   - Dialog closes
   - New illustration appears in grid with "pending" status

### Test 4: Approve Illustration

**Setup**: Have a draft illustration

1. Find illustration with "draft" status
2. Click "Approve" button
3. Verify:
   - API call made to /api/assets/:id (PATCH)
   - Status badge changes to green "approved"
   - Toast shows "Illustration Approved"
   - "Use" button appears (if callback provided)

### Test 5: Unapprove Illustration

1. Find illustration with "approved" status
2. Click "Unapprove" button
3. Verify:
   - Status badge changes to blue "draft"
   - Toast shows "Illustration Rejected"
   - "Approve" button reappears

### Test 6: Usage Count Display

**Setup**: Link illustration to book via book_assets table

1. Verify illustration shows usage count badge
2. Badge should show link icon + number
3. Link to another book
4. Verify count increments (via trigger)

### Test 7: Use Illustration Callback

**Setup**: Provide onSelectIllustration callback

1. Find approved illustration
2. Click "Use" button
3. Verify callback fires with illustration ID

### Test 8: Loading State

1. Render component with slow network
2. Verify spinning loader displays

### Test 9: Error Handling

1. Stop backend server
2. Render component
3. Verify error message displays with retry button

## Integration Testing

### Test 10: Integration with Universe Detail Page

1. Add IllustrationStudio to UniverseDetailPage
2. Verify illustrations load for selected universe
3. Create new illustration
4. Verify it appears in universe's illustration collection

## Database Queries for Testing

### View All Illustrations for Universe
```sql
SELECT
  id,
  name,
  description,
  data->>'status' as status,
  usage_count,
  array_length(file_urls, 1) as file_count,
  created_at
FROM assets
WHERE universe_id = '<universe_id>'
  AND type = 'illustration'
  AND deleted_at IS NULL
ORDER BY created_at DESC;
```

### Link Illustration to Book
```sql
INSERT INTO book_assets (book_id, asset_id, role, usage_context)
VALUES (
  '<book_id>',
  '<illustration_id>',
  'illustration',
  '{"chapter": 3, "scene": "Desert journey"}'::jsonb
);
-- Trigger will auto-increment usage_count
```

### Check Usage Count
```sql
SELECT
  a.name,
  a.usage_count,
  COUNT(ba.id) as actual_links
FROM assets a
LEFT JOIN book_assets ba ON ba.asset_id = a.id
WHERE a.id = '<illustration_id>'
GROUP BY a.id, a.name, a.usage_count;
```

## Automated Tests

### Build Test
```bash
npm run build
```
Expected: ✅ Build succeeds without TypeScript errors

### Component API Test
```typescript
// Test that component accepts required props
<IllustrationStudio universeId="test-id" />

// Test with optional callback
<IllustrationStudio
  universeId="test-id"
  onSelectIllustration={(id) => console.log(id)}
/>
```

## Success Criteria

- ✅ Component builds without TypeScript errors
- ⏳ Displays illustration gallery correctly
- ⏳ Search functionality works
- ⏳ Create illustration dialog works
- ⏳ Approve/unapprove workflow works
- ⏳ Status badges display correctly
- ⏳ Usage count tracking works
- ⏳ Loading/error states render
- ⏳ onSelectIllustration callback fires

## Next Steps

After Phase 7 testing:
1. Integrate into UniverseDetailPage
2. Hook up actual illustration generation
3. Implement variant selection UI
4. Add illustration preview/lightbox
5. Move to Phase 8: Cover Studio
