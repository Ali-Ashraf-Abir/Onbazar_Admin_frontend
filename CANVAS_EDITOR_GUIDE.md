# Canvas Template Editor - Quick Start Guide

## Overview
The canvas template editor allows admins to create magazine templates by uploading a background image and visually defining where images should be placed.

## Creating a Canvas Template

### Step 1: Start Template Creation
- Navigate to `/admin/templates/create`
- Fill in **Template Name** (required) and optional **Description**
- Select **"Canvas Editor (Canva-like)"** as the template type

### Step 2: Upload Background Image
- Click **"📁 Upload PNG"** button
- Select a PNG/JPEG/WebP image with transparent background
- The image loads into the canvas editor

### Step 3: Add Image Placeholders
- Click **"+ Add Placeholder"** to create zones where images will go
- Each placeholder appears as a blue rectangle on the canvas
- Multiple placeholders can overlap

### Step 4: Edit Placeholder Position & Size
- **Move**: Click and drag a placeholder to reposition
- **Resize**: Drag the blue corner handles (squares) to resize
- **Rotate**: Drag the pink circle handle above the placeholder to rotate (0-360°)
- **Delete**: Click a placeholder to select it, then click the red "🗑️ Delete" button

### Step 5: Configure Placeholder Properties
- Click a placeholder to select it
- Use the **Properties Panel** (right sidebar) to configure:
  - **Key**: Unique identifier (e.g., "hero_image", "product_photo")
  - **Label**: Display name (e.g., "Hero Image", "Product Photo")
  - **Required**: Check if this placeholder must have an image
  - **X, Y**: Exact position in pixels
  - **Width, Height**: Exact size in pixels
  - **Rotation**: 0-360 degrees
  - **Background Fit**: How to fit images into this zone:
    - **Contain**: Entire image visible, may have empty space
    - **Cover**: Image fills zone, may be cropped
    - **Fill**: Image stretches to fill zone exactly

### Step 6: Create Template
- Verify all placeholders have unique keys
- At least one placeholder is required
- Click **"Create Template"** to save

## Viewing Canvas Templates

### Edit Existing Canvas Template
- Navigate to `/admin/templates/[id]` for a canvas template
- See the canvas preview with all placeholders
- Can modify: name, description, active status
- Cannot modify: background image or placeholders (create new version instead)

## Using Canvas Templates in Magazines

### Add Canvas Template to Magazine
1. Go to `/admin/magazines/create` or `/admin/magazines/[id]`
2. Select the canvas template from the list
3. Configure usage rules:
   - **Required**: Mark if this template must be used
   - **Min Uses**: Minimum times this template must be used
   - **Max Uses**: Maximum times this template can be used

### User Experience with Canvas Templates
When a user creates a magazine using a canvas template:
1. They see the background image with empty placeholder zones
2. For each placeholder:
   - They upload an image
   - The image is positioned/sized according to the placeholder config
   - Image is fitted using the specified background-fit mode
3. The final result renders exactly as configured

## Placeholder Configuration Examples

### Hero Image Placeholder
```
Key: hero_image
Label: Hero Image
Required: Yes
X: 0, Y: 0
Width: 600, Height: 400
Rotation: 0
Background Fit: cover
```

### Product Thumbnail
```
Key: product_thumb
Label: Product Thumbnail
Required: No
X: 450, Y: 300
Width: 150, Height: 150
Rotation: 0
Background Fit: contain
```

### Rotated Product Image
```
Key: product_rotated
Label: Angled Product
Required: No
X: 100, Y: 150
Width: 200, Height: 200
Rotation: 45
Background Fit: fill
```

## Tips & Best Practices

### Design Tips
- **Start Simple**: Create templates with 2-3 placeholders first
- **Use Transparent PNGs**: Allows flexible background colors in user's magazine
- **Consistent Aspect Ratios**: Keep placeholders similar sizes for better UX
- **Label Clearly**: Use descriptive labels like "Hero Image", "Team Photo", not "img1"

### Configuration Tips
- **Use Contain for Photos**: Preserves aspect ratio, won't crop important content
- **Use Cover for Backgrounds**: Fills entire zone without stretching
- **Test Rotations**: Rotated placeholders work but may need careful positioning
- **Set Minimums**: Mark important placeholders as required

### Performance Tips
- **Optimize Images**: Compress background PNGs before uploading
- **Reasonable Sizes**: Keep placeholder zones at least 30x30px
- **Limit Placeholders**: 5-8 placeholders per template is optimal

## Common Issues

### "Background image is required"
- Click "Upload PNG" and select an image before saving

### "At least one image placeholder is required"
- Click "+ Add Placeholder" to create at least one zone

### "Duplicate placeholder key"
- Each placeholder's key must be unique (e.g., "hero_image", "product_photo")
- Change the key in the Properties Panel

### Placeholder not visible
- Check position (X, Y) - might be outside the canvas
- Check size - might be too small (minimum 30x30px)
- Check rotation - rotated placeholders might be hard to see

## Keyboard & Mouse Shortcuts

| Action | Control |
|--------|---------|
| Select Placeholder | Click on it |
| Move Placeholder | Drag it |
| Resize Placeholder | Drag corner handles |
| Rotate Placeholder | Drag pink circle handle |
| Delete Selected | Click red Delete button |
| Deselect | Click empty canvas area |
| View Properties | Click a placeholder |

## API Reference (For Backend Integration)

**Canvas Template Structure:**
```typescript
{
  name: string;
  description: string;
  type: "canvas";
  thumbnail?: string;
  isActive: boolean;
  backgroundImage: string;  // Data URL
  imagePlaceholders: [
    {
      id: string;
      key: string;
      label: string;
      required: boolean;
      x: number;
      y: number;
      width: number;
      height: number;
      rotation: number;
      backgroundFit: "contain" | "cover" | "fill";
    }
  ];
}
```

## Support

For issues or questions:
1. Check the tips section above
2. Verify all placeholders have unique keys
3. Ensure background image is loaded
4. Test with a simple template first
