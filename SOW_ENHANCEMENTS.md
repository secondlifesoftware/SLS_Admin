# SOW Generator Enhancements

## Overview
Implemented comprehensive improvements to the Scope of Work (SOW) generator with versioning, modal editors, and individual section regeneration.

## Features Implemented

### 1. ✅ Timestamps
- SOWs already have `created_at` and `updated_at` timestamps
- Displayed in SOW list with each version
- Format: MM/DD/YYYY

### 2. ✅ Version Control
- **Auto-incrementing versions**: When creating multiple SOWs for same client+project
- **Example**: 
  - First SOW for "Grittie - Website Redesign" → v1
  - Second SOW for "Grittie - Website Redesign" → v2
  - Third SOW for "Grittie - Website Redesign" → v3

**Backend Changes:**
- Added `version` column to `scope_of_work` table
- Auto-increment logic in `create_scope()` endpoint
- Versions tracked per client+title combination

**Frontend Changes:**
- SOWs grouped by client+title
- Latest version displayed prominently
- Stacked card visual for multiple versions

### 3. ✅ Stacked Versions UI
- **Visual stacking**: Cards appear layered when multiple versions exist
- **Version selector**: Dropdown to switch between versions
- **Version count**: Shows "(3 versions)" indicator
- **Quick navigation**: Select any version from dropdown

**Design:**
```
┌─────────────────┐
│  ┌──────────────┤  ← Version 3 (latest)
│  │  ┌───────────┤  ← Version 2 shadow
│  │  │           │  ← Version 1 shadow
│  │  │  [v3 ▼]   │  ← Dropdown selector
│  │  │           │
└──┴──┴───────────┘
```

### 4. ✅ Modal Editors

**Project Description Editor (SOW Generator):**
- "Edit" button next to "Project Description (Optional)"
- Opens full-screen modal for easier editing
- Character counter
- Auto-focus on open
- Save/Cancel buttons

**Section Editors (SOW Edit Page):**
- "Expand Editor" button on every section
- Full-screen modal for comfortable editing
- Same UI for all 19 sections
- Works for custom and standard sections

**Modal Features:**
- Large textarea (400px min height)
- Monospace font for formatting
- Character counter
- Keyboard shortcuts (Esc to close)
- Click outside to close

### 5. ✅ Individual Section Regeneration

**After Initial AI Generation:**
- Each customizable section has "🔄 Regenerate Section" button
- Works immediately after AI generation (no save required)
- Calls AI API with section context
- Updates only that specific section
- Shows loading spinner during regeneration

**How It Works:**
1. User clicks "Generate with AI"
2. AI generates all 19 sections
3. User reviews sections
4. User can regenerate ANY section individually
5. No need to save SOW first

**API Integration:**
- Uses `/api/scope-of-work/ai/regenerate-section` endpoint
- Passes section title, client info, project context
- Returns regenerated content for that section only

### 6. ✅ Improved Edit Workflow

**Before:**
- Small textarea (12 rows)
- Difficult to edit long content
- No way to see full context

**After:**
- Small textarea + "Expand Editor" button
- Click to open full-screen modal
- Much easier to edit long sections
- Visual feedback for AI-generated sections

## User Experience Flow

### Creating New SOW:
1. Select client
2. Enter SOW details (with modal editor for description)
3. Click "Generate with AI"
4. AI generates all sections
5. Review sections (use "Expand Editor" for easier viewing)
6. Regenerate specific sections if needed
7. Save when satisfied

### Managing Versions:
1. Create first SOW → automatically v1
2. Create another SOW with same client+title → automatically v2
3. SOWs appear stacked in list view
4. Click version dropdown to switch between versions
5. Each version is independent and editable

### Editing Sections:
1. Click section to expand
2. Small preview shown by default
3. Click "Expand Editor" for full-screen editing
4. Edit comfortably with large modal
5. Save changes
6. Regenerate with AI if needed (for customizable sections)

## Technical Details

### Database Schema:
```sql
ALTER TABLE scope_of_work ADD COLUMN version VARCHAR(50) DEFAULT '1';
ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT 0;
```

### Files Modified:

**Backend:**
- `backend/models.py` - Added version field
- `backend/routers/scope_of_work.py` - Version logic, user_email params
- `backend/utils/rate_limiter.py` - Admin bypass
- `backend/schemas.py` - Version in schemas

**Frontend:**
- `frontend/src/components/admin/TextEditorModal.js` - NEW modal component
- `frontend/src/components/admin/ScopeOfWorkGenerator.js` - Modal editors, section regeneration
- `frontend/src/components/admin/ScopeOfWorkEdit.js` - Modal editors for all sections
- `frontend/src/components/admin/ScopeOfWorkList.js` - Stacked versions UI, grouping logic
- `frontend/src/services/api.js` - User email params

### API Endpoints Updated:
- `POST /api/scope-of-work/` - Auto-increment version
- `POST /api/scope-of-work/ai/generate-sow` - Admin bypass
- `POST /api/scope-of-work/ai/regenerate-section` - Admin bypass, works without scope_id
- `POST /api/scope-of-work/{scope_id}/ai/regenerate-full` - Admin bypass

## Testing Checklist

- [ ] Create first SOW for a client → Should be v1
- [ ] Create second SOW with same title → Should be v2
- [ ] Verify stacked cards appear in list view
- [ ] Switch between versions using dropdown
- [ ] Open modal editor for project description
- [ ] Generate SOW with AI
- [ ] Regenerate individual sections
- [ ] Open modal editor for each section
- [ ] Verify admin bypass works (dks1018@gmail.com)
- [ ] Verify regular users hit rate limit after 3 uses

## Notes

- Version numbers are strings to support future semantic versioning (e.g., "1.0", "1.1")
- Currently using simple integers ("1", "2", "3")
- Versions are scoped to client_id + title combination
- Modal editors use Tailwind for consistent styling
- All features work with existing auth/admin system
