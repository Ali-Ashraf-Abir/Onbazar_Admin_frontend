# Magazine Admin UI

A complete, responsive admin dashboard for managing magazine templates and instances using your existing design system and API structure.

## 📁 Files Created

### Pages
- **`/app/admin/magazines/page.tsx`** — List all magazines with filtering, sorting, and pagination
- **`/app/admin/magazines/create/page.tsx`** — Create new magazine templates
- **`/app/admin/magazines/[id]/page.tsx`** — Edit magazine templates and configure assigned templates
- **`/app/admin/templates/page.tsx`** — List all templates with filtering and management

## 🎨 Design System

All components use your existing CSS variable design system:
- **Colors**: `--bw-bg`, `--bw-surface`, `--bw-ink`, `--bw-border`, etc.
- **Typography**: `--bw-font-display`, `--bw-font-body`, `--bw-font-mono`
- **Spacing & Radius**: `--bw-radius-md`, `--bw-shadow-sm`, etc.
- **Responsive**: Mobile-first, tablet and desktop optimized

## ✨ Features

### Magazines Management
- **List View** — Browse all magazines with status badges
- **Advanced Filtering** — Search by name, filter by status, sort by newest/oldest/name
- **Create** — Define new magazine templates with:
  - Basic info (name, description)
  - Page range constraints (min/max pages)
  - Template selection and configuration
  - Required/optional template settings
  - Min/max usage per template
- **Edit** — Modify existing magazines and template assignments
- **Delete** — Remove magazines with confirmation dialog
- **Pagination** — Navigate large datasets efficiently

### Templates Management
- **List View** — Browse available templates
- **Status Management** — Mark templates as active/inactive
- **Filtering & Sorting** — Find templates quickly
- **Quick Actions** — Edit or delete templates

### UI/UX
- **Responsive Design** — Works perfectly on mobile, tablet, and desktop
- **Skeleton Loading** — Smooth loading states with shimmer animation
- **Confirmation Modals** — Prevent accidental deletions
- **Error Handling** — Clear error messages for validation failures
- **Status Badges** — Visual indicators for active/inactive status
- **Sticky Summary** — Configuration summary stays in view while scrolling
- **Empty States** — Helpful messages when no data exists
- **Mobile Optimizations** — Collapsible filters, touch-friendly controls

## 🔄 API Integration

The UI connects to your existing API endpoints:

```
GET    /admin/magazines              — List magazines
POST   /admin/magazines              — Create magazine
GET    /admin/magazines/:id          — Get magazine details
PUT    /admin/magazines/:id          — Update magazine
DELETE /admin/magazines/:id          — Delete magazine

GET    /admin/templates              — List templates
GET    /admin/templates/:id          — Get template details
```

Query parameters supported:
- `page` — Pagination (default: 1)
- `limit` — Items per page (default: 10)
- `q` — Search query
- `isActive` — Filter by status (true/false)
- `sort` — Sort order (newest, oldest, name_asc, name_desc)

## 🎯 Key Components

### Magazines List (`/magazines/page.tsx`)
- Data table with responsive layout
- Search and filtering controls
- Status indicators
- Quick edit/delete actions
- Smart pagination with ellipsis

### Create Magazine (`/magazines/create/page.tsx`)
- Multi-step form with visual feedback
- Template selection with drag-like configuration
- Real-time validation
- Sticky configuration summary
- Success/error notifications

### Edit Magazine (`/magazines/[id]/page.tsx`)
- Populate form from existing data
- Update templates and settings
- Template-specific configuration
- Summary sidebar with statistics

### Templates List (`/templates/page.tsx`)
- Similar to magazines list
- Shows field count and version
- Same filtering/sorting capabilities

## 📱 Responsive Breakpoints

- **Mobile** (`< 640px`) — Stacked layout, collapsible filters
- **Tablet** (`640px - 1024px`) — Two-column layout where applicable
- **Desktop** (`> 1024px`) — Full three-column layout with sidebar

## 🎬 Getting Started

### 1. Update Navigation
Add links to the admin sidebar/navigation:
```jsx
<a href="/admin/magazines">Magazines</a>
<a href="/admin/templates">Templates</a>
```

### 2. Verify API Endpoints
Ensure your backend API matches the expected routes and response format:
```json
{
  "success": true,
  "data": [ /* items */ ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

### 3. Test in Browser
```bash
npm run dev
```

Navigate to:
- `/admin/magazines` — Magazine management
- `/admin/templates` — Template management

## 🛠️ Customization

### Adjust Table Columns
Edit the grid column spans in the table header (e.g., `sm:col-span-3` for a wider column)

### Modify Filter Options
Add new filter fields by extending the filter grid and state in the page component

### Change Validation Rules
Update validation logic in `handleCreate()` and `handleSave()` functions

### Customize Empty States
Modify the empty state emoji and message in the respective components

## 📊 Form Validation

The UI includes client-side validation for:
- Required fields (name, templates)
- Page range constraints (maxPages ≥ minPages)
- Template selection (at least one required)
- Template usage limits (minUses ≤ maxUses)

Backend validation handles additional business logic via API responses.

## 🎨 Styling Classes

All styling uses Tailwind CSS with your design system variables. Key patterns:

```tsx
// Input styling
const inputBase = "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] ...";

// Label styling
const labelCls = "block text-[10px] font-bold uppercase tracking-widest ...";

// Status badges
style={
  isActive
    ? { background: "rgba(22,163,74,0.15)", color: "rgb(22,163,74)" }
    : { background: "rgba(100,100,100,0.15)", color: "rgb(100,100,100)" }
}
```

## 🔐 Security Considerations

- All requests go through your authenticated API client
- Delete operations require confirmation
- Form validation prevents invalid states
- Error messages don't expose sensitive data

## 📝 Next Steps

1. **Create Magazine Form** (optional) — Build a dedicated form for create/edit if needed
2. **Bulk Actions** — Add checkboxes for bulk delete/status changes
3. **Export Data** — Add CSV export functionality
4. **Analytics** — Add usage statistics and charts
5. **Advanced Search** — Implement faceted search for complex filtering
6. **Audit Log** — Track changes to magazines and templates

## 🤝 Integration Notes

The UI is designed to work with your existing:
- `api` client from `lib/api` for all requests
- Design system CSS variables for consistent styling
- Next.js 16 with TypeScript
- Tailwind CSS for responsive utilities

All components are client-side (`"use client"`) to support interactive features like filtering, forms, and modals.
