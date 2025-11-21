# Walkthrough - Airbnb Style & Custom Components

I have updated the OneFlow Builder to support advanced styling and custom components, enabling the creation of complex layouts like an Airbnb landing page.

## Changes

### 1. Modular Builder Components
Refactored the monolithic `RenderComponent` into modular, type-specific components in `src/components/builder/`:
- `BuilderText`: Handles text with typography styles.
- `BuilderImage`: Handles images with border radius.
- `BuilderButton`: Handles buttons with custom colors and radius.
- `BuilderInput`: Handles inputs with consistent theming.
- `BuilderDropdown`: Handles dropdowns.
- `utils.ts`: Centralized `buildStyle` logic with theme integration.

### 2. Enhanced Styling Properties
Added support for new CSS properties in the Properties Panel:
- **Border Radius**: Control rounded corners (e.g., "4px", "50%").
- **Box Shadow**: Add depth with shadows (e.g., "0 4px 12px rgba(0,0,0,0.1)").
- **Typography**: Font size and color are now more universally supported.

### 3. Global Theme System
Implemented a global theme (`src/theme/index.ts`) that provides default styles for components:
- Consistent border radius for inputs and buttons.
- Default primary colors.
- Typography defaults.

### 4. Airbnb Example Page
Created a comprehensive example page (`src/examples/airbnbPage.json`) demonstrating:
- **Navbar**: Flex layout with logo, search bar (rounded with shadow), and user menu.
- **Hero/Categories**: Horizontal scrolling categories.
- **Listings Grid**: Grid layout with card-style listings (images, titles, prices).

### 5. UI Updates
- Added "Load Airbnb" button to the header to quickly load the example.
- Updated Properties Panel to include a new "Style" section.

### 6. Figma-Style Selection (New)
Improved the selection and hover experience to be more precise and minimal:
- **Smart Hover**: Only the deepest hovered element is outlined; parents do not light up.
- **Crisp Selection**: Selected elements have a solid blue outline.
- **Component Labels**: Selected elements show a small blue tag with their type (e.g., "FLEX", "IMAGE") at the top-left.
- **No Visual Noise**: Removed the background highlight and bubbling outlines.

## Verification

### Automated Tests
- N/A (Visual builder)

### Manual Verification
1. **Load Airbnb Example**:
   - Click "Load Airbnb" in the header.
   - Verify the layout looks like a simplified Airbnb homepage.
   - Check that images have rounded corners.
   - Check that the search bar has a shadow and rounded shape.

2. **Edit Styles**:
   - Select a component (e.g., a button or image).
   - In the Properties Panel, change "Border Radius" to "0px" or "50%".
   - Change "Box Shadow" to see real-time updates.

3. **Drag & Drop**:
   - Drag new components from the library.
   - Verify they inherit default theme styles (e.g., inputs have rounded corners by default).

4. **Test Selection & Hover**:
   - Hover over nested elements (e.g., the search icon inside the search bar).
   - Verify **only** the icon outlines, not the search bar container.
   - Select an element. Verify a blue tag appears with the component name.
