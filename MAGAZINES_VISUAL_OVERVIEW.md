# 📊 Magazine Admin UI - Visual Overview

## Navigation Flow

```
Admin Dashboard
├── Magazines (NEW)
│   ├── List View
│   │   ├── Search & Filter
│   │   ├── Pagination
│   │   └── Edit/Delete Actions
│   ├── Create Page
│   │   ├── Basic Info Form
│   │   ├── Template Selection
│   │   └── Config Summary
│   └── Edit Page
│       ├── Update Settings
│       ├── Manage Templates
│       └── View Summary
│
└── Templates (NEW)
    ├── List View
    │   ├── Search & Filter
    │   ├── Pagination
    │   └── Edit/Delete Actions
    ├── Create Page
    │   ├── Basic Info
    │   ├── HTML/CSS Editor
    │   ├── Dynamic Fields Editor
    │   └── Field Summary
    └── Edit Page
        ├── Update Metadata
        ├── View Code (Read-only)
        └── Template Info
```

## Component Architecture

### Magazines List (`/magazines`)
```
┌─────────────────────────────────────────┐
│ Header (Title + Create Button)          │
├─────────────────────────────────────────┤
│ Filters Panel (Search, Status, Sort)    │
├─────────────────────────────────────────┤
│ Magazine Table                          │
│ ┌─────────────────────────────────────┐ │
│ │ Name | Templates | Pages | Status   │ │
│ ├─────────────────────────────────────┤ │
│ │ Mag1 │     3     │ 5-20  │ Active  │ │
│ │ Mag2 │     2     │ 3-10  │ Inactive│ │
│ │ ...                                  │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Pagination                              │
└─────────────────────────────────────────┘
```

### Create Magazine (`/magazines/create`)
```
┌──────────────────────────────────────────────────────┐
│ Left (2/3)              │ Right (1/3) Sidebar        │
├─────────────────────────┼────────────────────────────┤
│                         │                            │
│ Basic Information Card  │ Configuration Summary      │
│ ┌──────────────────┐   │ ┌────────────────────────┐ │
│ │ Name: [field]    │   │ │ Status: Active         │ │
│ │ Desc: [field]    │   │ │ Pages: 5-20            │ │
│ │ Min: [field]     │   │ │ Templates: 3           │ │
│ │ Max: [field]     │   │ │                        │ │
│ │ Active: [toggle] │   │ │ Assigned:              │ │
│ └──────────────────┘   │ │ • Cover (Req, 1-1)    │ │
│                         │ │ • Article (2-5)       │ │
│ Template Selection      │ │ • Closing (1-1)       │ │
│ ┌──────────────────┐   │ │                        │ │
│ │ □ Template 1     │   │ │ [CREATE BUTTON]        │ │
│ │   Required [x]   │   │ └────────────────────────┘ │
│ │   Min: [1] Max:[5]   │                            │
│ │                      │                            │
│ │ ✓ Template 2     │   │                            │
│ │   Config...      │   │                            │
│ │                      │                            │
│ │ □ Template 3     │   │                            │
│ └──────────────────┘   │                            │
└──────────────────────────────────────────────────────┘
```

### Create Template (`/templates/create`)
```
┌──────────────────────────────────────────────────────┐
│ Left (2/3)              │ Right (1/3) Sidebar        │
├─────────────────────────┼────────────────────────────┤
│                         │                            │
│ Basic Information       │ Summary                    │
│ ┌──────────────────┐   │ ┌────────────────────────┐ │
│ │ Name: [field]    │   │ │ Status: Active         │ │
│ │ Desc: [field]    │   │ │ Version: v1            │ │
│ │ Version: [field] │   │ │ Fields: 3              │ │
│ │ Thumbnail: [url] │   │ │                        │ │
│ │ Active: [toggle] │   │ │ Field Keys:            │ │
│ └──────────────────┘   │ │ • title (text)         │ │
│                         │ │ • image (image)        │ │
│ Template Code          │ │ • content (textarea)   │ │
│ ┌──────────────────┐   │ │                        │ │
│ │ HTML:            │   │ │ [CREATE BUTTON]        │ │
│ │ [code area]      │   │ │                        │ │
│ │                  │   │ └────────────────────────┘ │
│ │ CSS:             │   │                            │
│ │ [code area]      │   │                            │
│ └──────────────────┘   │                            │
│                         │                            │
│ Dynamic Fields          │                            │
│ ┌──────────────────┐   │                            │
│ │ Field 1          │   │                            │
│ │ Key: title       │   │                            │
│ │ Label: Title     │   │                            │
│ │ Type: text       │   │                            │
│ │ Required: [x]    │   │                            │
│ │ [Remove]         │   │                            │
│ │                  │   │                            │
│ │ Field 2          │   │                            │
│ │ ...              │   │                            │
│ │ [+ Add Field]    │   │                            │
│ └──────────────────┘   │                            │
└──────────────────────────────────────────────────────┘
```

## Mobile Responsive Behavior

### Mobile List View (< 640px)
```
┌─────────────────────┐
│ Magazines           │
│ [⚙ Filters] [+]     │
├─────────────────────┤
│ Magazine Name       │
│ Description...      │
│ ID: abc123          │
│                     │
│ TEMPLATES  2        │
│ PAGES     5-20      │
│ STATUS   Active     │
│                     │
│ [Edit] [Delete]     │
├─────────────────────┤
│ Magazine Name 2     │
│ ...                 │
└─────────────────────┘
```

### Mobile Create View (< 640px)
```
┌─────────────────────┐
│ Create Magazine ← ← │
├─────────────────────┤
│                     │
│ Basic Information   │
│ [Name field]        │
│ [Desc field]        │
│ [Min/Max fields]    │
│ [Status toggle]     │
│                     │
│ Template Selection  │
│ [Search]            │
│ □ Template 1        │
│   [Show config]     │
│ □ Template 2        │
│ ...                 │
│                     │
│ [CREATE BUTTON]     │
│                     │
│ Summary:            │
│ Status: Active      │
│ Pages: 5-20         │
│ Templates: 2        │
│                     │
└─────────────────────┘
```

## State Flows

### Magazine Creation Flow
```
Start
  ↓
[Fill Basic Info]
  ↓
[Select Templates] → Template not available?
  ↓                    ↓
[Configure Each]   [Show Error]
  ↓                    ↓
[Review Summary] ← ← ← 
  ↓
[Click Create]
  ↓
Validating...
  ↓
Success? → No → [Show Error]
  ↓ Yes             ↓
Redirect to Edit  [Keep on Page]
  ↓
Done
```

### Template Creation Flow
```
Start
  ↓
[Fill Basic Info]
  ↓
[Paste HTML]
  ↓
[Add CSS] (optional)
  ↓
[Add Fields] → Duplicate key?
  ↓            ↓
[Review]   [Show Error]
  ↓            ↓
[Click Create] ← ← 
  ↓
Validating...
  ↓
Success? → No → [Show Error]
  ↓ Yes         ↓
Redirect      [Keep on Page]
  ↓
Done
```

## Data Flow

### Create Magazine Request
```
User fills form
  ↓
Frontend validation
  ↓
POST /admin/magazines
{
  "name": "Fashion Magazine",
  "description": "Monthly fashion trends",
  "minPages": 5,
  "maxPages": 20,
  "isActive": true,
  "templates": [
    {
      "templateId": "abc123",
      "required": true,
      "minUses": 1,
      "maxUses": 1
    },
    {
      "templateId": "def456",
      "required": false,
      "minUses": 0,
      "maxUses": 5
    }
  ]
}
  ↓
Server validation
  ↓
Create in DB
  ↓
Return created magazine
  ↓
Frontend: redirect to edit page
```

### Create Template Request
```
User fills form
  ↓
Frontend validation
  ↓
POST /admin/templates
{
  "name": "Cover Page",
  "description": "Magazine cover",
  "version": 1,
  "html": "<div>{{title}}</div>",
  "css": "div { padding: 20px; }",
  "thumbnail": "https://...",
  "isActive": true,
  "fields": [
    {
      "key": "title",
      "label": "Title",
      "type": "text",
      "placeholder": "Enter title",
      "required": true,
      "defaultValue": ""
    }
  ]
}
  ↓
Server validation
  ↓
Check field keys unique
  ↓
Create in DB
  ↓
Return created template
  ↓
Frontend: redirect to edit page
```

## UI Components Reused

These components appear consistently across all pages:

```
┌─ Header Section
│  ├─ Page Title
│  ├─ Subtitle/Count
│  └─ Create Button

├─ Filter/Search Section
│  ├─ Search Input
│  ├─ Status Dropdown
│  ├─ Sort Dropdown
│  └─ Reset/Apply Buttons

├─ Content Table/Grid
│  ├─ Loading Skeleton
│  ├─ Data Rows
│  ├─ Empty State
│  └─ Action Buttons (Edit/Delete)

├─ Pagination
│  ├─ Previous/Next
│  ├─ Page Numbers
│  └─ Ellipsis

├─ Forms
│  ├─ Text Input
│  ├─ Textarea
│  ├─ Dropdown Select
│  ├─ Checkbox Toggle
│  └─ Validation Errors

├─ Modals
│  ├─ Delete Confirmation
│  └─ Success/Error Alerts

└─ Sidebars
   ├─ Summary Card
   ├─ Status Badge
   ├─ Stats
   └─ Action Button
```

## Color Palette Used

```
Primary (Ink):        var(--bw-ink)          Used for text, active states
Background:           var(--bw-bg)           Page background
Surface:              var(--bw-surface)      Cards, inputs
Border:               var(--bw-border)       Lines, separators
Ghost:                var(--bw-ghost)        Labels, hints
Muted:                var(--bw-muted)        Secondary text
Red:                  var(--bw-red)          Delete, errors
Green:                var(--bw-green)        Active status, success
```

## Typography Hierarchy

```
Page Title:           Display font, 24-32px, bold
Section Title:        Display font, 18px, bold
Labels:               Body font, 10px, uppercase, bold
Input Text:           Body font, 14px, regular
Help Text:            Body font, 10px, regular, muted
Code/Keys:            Mono font, 12px, regular
```

## Responsive Grid System

All content uses a 12-column grid:

```
Desktop (> 1024px):   3 columns (main 8 / sidebar 4)
Tablet (640-1024px):  2 columns (equal or main 7 / sidebar 5)
Mobile (< 640px):     1 column (full width)
```

---

This visual guide helps understand the layout, flow, and component structure of the entire magazine admin system.
