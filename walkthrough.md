# Walkthrough - Responsive Design & Viewport Controls

I have updated the OneFlow Builder to support responsive design workflows, including a viewport switcher and responsive layout properties.

## Changes

### 1. Viewport Controls
Added a new control group in the header to switch between device sizes:
- **Desktop**: 100% width.
- **Tablet**: 768px width.
- **Mobile**: 375px width.

The canvas now resides in a centered, isolated frame that resizes smoothly when the viewport is changed, simulating real device constraints.

### 2. Responsive Layout Properties
Added new properties to enable fluid, responsive layouts without complex media queries:
- **Flex Wrap**: Added to Flex/Row/Column components. Options: `No Wrap`, `Wrap`, `Wrap Reverse`. This allows items to stack on smaller screens.
- **Min Column Width**: Added to Grid components. This enables `auto-fit` behavior (e.g., `repeat(auto-fit, minmax(250px, 1fr))`), allowing grids to automatically adjust the number of columns based on available width.
- **Object Fit**: Added to Image components. Options: `Fill`, `Contain`, `Cover`. This prevents images from stretching when resized.

### 3. Updated Examples
Refactored the example pages to be fully responsive:

**Airbnb Example (`src/examples/airbnbPage.json`)**:
- **Navbar**: Uses `flexWrap: wrap` so the search bar and user menu stack gracefully on mobile.
- **Categories**: Uses `flexWrap: wrap` to allow categories to flow to multiple lines.
- **Listings Grid**: Uses `minColumnWidth: 250px` instead of fixed columns. This means it shows 4 columns on desktop, 2 on tablet, and 1 on mobile automatically.
- **Images**: All listing images now use `objectFit: cover` to maintain aspect ratio.
- **Mobile Optimization**: Reduced horizontal padding to `24px` (was 40px) to maximize screen real estate on smaller devices.

**Default Example (`src/examples/complexPage.json`)**:
- **Header**: Navigation items now wrap on smaller screens.
- **Hero Section**: Text and image stack vertically on mobile.
- **Features Grid**: Automatically adjusts columns based on width (3 on desktop, 1 on mobile).
- **Contact Form**: Width is now fluid (`100%` with `maxWidth`), fitting perfectly on mobile.

### 4. UI Updates
- **Canvas Isolation**: The canvas is now visually distinct with a shadow and centered alignment.
- **Independent Scrolling**: The gray workspace area scrolls independently, allowing the white canvas to grow naturally with content.
- **Clean Interface**: Removed the "Canvas" header from the viewport for a more realistic preview.
- **Properties Panel**: Added "Wrap" dropdown for Flex components, "Min Column Width" input for Grid components, and "Object Fit" for Images.

## Verification

### Manual Verification
1. **Load Examples**:
   - Click "Load Example" (Default) or "Load Airbnb".
   - Verify layouts on **Desktop** (full width).

2. **Test Tablet Mode**:
   - Click "📱 Tablet" in the header.
   - Verify the canvas shrinks to 768px.
   - Verify grids switch to 2 or 3 columns.

3. **Test Mobile Mode**:
   - Click "📱 Mobile" in the header.
   - Verify the canvas shrinks to 375px.
   - Verify grids become 1 column.
   - Verify Flex containers (Navbar, Hero) stack vertically.
   - **Verify Scrolling**: Ensure you can scroll the gray area to see the bottom of the page.
   - **Verify Padding**: Check that the side padding is comfortable.

4. **Verify Images**:
   - Resize the viewport and check that images do not stretch.

5. **Edit Responsive Properties**:
   - Select a Grid component.
   - Change "Min Column Width" and see columns adjust automatically.
