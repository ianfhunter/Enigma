# Crossword Mobile Responsiveness Fix

## Issue
The Crossword grid did not fit on mobile screens. The 20×20 grid was using fixed cell sizes that caused horizontal overflow on smaller devices.

## Root Cause
- Grid was using fixed cell sizes defined by CSS variable `--cell-size`
- No constraint on maximum grid width
- Cell size at 500px: 26px × 20 cols = 520px (exceeds viewport)
- Cell size at 380px: 22px × 20 cols = 440px (exceeds narrow screens)

## Solution
Applied the following CSS changes to `Crossword.module.css`:

### 1. Added Grid Container Constraints
```css
.grid {
  /* ... existing styles ... */
  max-width: 100%;
  max-height: 80vh;
  width: fit-content;
  margin: 0 auto;
}
```

### 2. Dynamic Cell Sizing for Mobile
Used `min()` CSS function to make cell size responsive:

**Tablet (768px and below):**
```css
@media (max-width: 768px) {
  .container {
    --cell-size: min(30px, calc((100vw - 3rem) / 20));
  }
}
```

**Mobile (500px and below):**
```css
@media (max-width: 500px) {
  .container {
    --cell-size: min(26px, calc((100vw - 3rem) / 20));
    padding: 0 0.5rem;
  }
}
```

**Small Mobile (380px and below):**
```css
@media (max-width: 380px) {
  .container {
    --cell-size: min(22px, calc((100vw - 2rem) / 20));
    padding: 0 0.25rem;
  }

  .grid {
    gap: 0px; /* Remove gap for very small screens */
  }
}
```

### 3. Additional Mobile Improvements
- Reduced padding on small screens to maximize grid space
- Made tool buttons smaller on mobile
- Reduced gap between grid cells on very small screens
- Ensured grid section takes full width on mobile

## How It Works
The `calc((100vw - 3rem) / 20)` formula:
- Takes the full viewport width (`100vw`)
- Subtracts padding space (`3rem` accounts for container padding)
- Divides by 20 (number of columns)
- The `min()` function ensures cells never exceed the maximum comfortable size

This ensures the grid always fits within the viewport while maintaining playability.

## Testing
To test this fix:
1. Open Crossword game on mobile device or resize browser to mobile width (375px, 414px, etc.)
2. Verify the entire grid is visible without horizontal scroll
3. Test on various screen sizes (320px, 375px, 414px, 768px)
4. Ensure cells remain interactive and readable

## Files Modified
- `src/pages/Crossword/Crossword.module.css` - Updated responsive breakpoints and grid constraints
