export type ComponentType =
  | "text"
  | "box"
  | "image"
  | "button"
  | "input"
  | "dropdown"
  | "form"
  | "datagrid"
  | "breadcrumbs"
  | "tabs"
  | "chip"
  | "flex"
  | "grid"
  | "row"
  | "column"
  | "image-grid"
  | "lazy-user-list";

// Added LT-prefixed component types for the new themed component set
export type LTComponentType =
  | "lt-box"
  | "lt-typography"
  | "lt-button"
  | "lt-input"
  | "lt-card"
  | "lt-image"
  | "lt-link"
  | "lt-nav"
  | "lt-menu"
  | "lt-menu-item"
  | "lt-list"
  | "lt-list-item"
  | "lt-data-provider";

export type AllComponentType = ComponentType | LTComponentType;

export type AlignmentType = "left" | "center" | "right" | "stretch";

export interface ComponentProperties {
  // Common properties
  width?: string;
  height?: string;
  minHeight?: string;
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  alignment?: AlignmentType;

  // Text properties
  text?: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;

  // Image properties
  src?: string;
  alt?: string;
  objectFit?: "cover" | "contain" | "fill";

  // Button properties
  buttonText?: string;
  buttonColor?: string;
  buttonTextColor?: string;

  // Input properties
  placeholder?: string;
  inputType?: string;
  label?: string;

  // Dropdown properties
  options?: string[];

  // Layout properties
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  // Grid-specific alignment helpers
  justifyItems?: string;
  alignContent?: string;
  gap?: string;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  gridColumns?: number | { mobile?: number; tablet?: number; desktop?: number };
  gridRows?: number | { mobile?: number; tablet?: number; desktop?: number };
  minColumnWidth?: string; // For responsive grid (auto-fit)
  // When true, prefer `gridColumns` (fixed columns) even if
  // `minColumnWidth` is set. Useful when author wants deterministic
  // column counts instead of responsive auto-fit behavior.
  useFixedColumns?: boolean;
  // Additional layout helpers
  minWidth?: string;
  maxWidth?: string;
  aspectRatio?: string;
  flex?: string;
  alignSelf?: AlignmentType | "auto";
  order?: number;

  // Positioning helpers (for overlays / hero backgrounds)
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  zIndex?: number;
  backgroundImage?: string;
  // Style properties
  borderRadius?: string;
  boxShadow?: string;

  // Visibility: when false the component will not be rendered. Can be
  // bound to dynamic expressions later. Defaults to `true` when absent.
  visible?: boolean;

  // Optional reference to a saved expression name (in the expression editor)
  // that will be evaluated to determine the property's value at runtime.
  visibilityExpression?: string;

  // Validation rules for inputs (optional)
  validations?: Array<any>;

  // Data binding
  dataBinding?: {
    modelId?: string;
    fieldId?: string; // For simple properties (string, number, boolean)
    collectionId?: string; // For arrays/lists (binds to a collection)
    unwrapResults?: boolean; // optional helper for datagrid bindings
    // Optionally pick a specific item from a bound model's items
    itemIndex?: number;
    itemId?: string;
  };

  // DataGrid specific
  columns?: Array<{
    field: string;
    headerName?: string;
    width?: number;
    render?: string; // optional cell renderer identifier, e.g. 'chip', 'image'
  }>;
  pageSize?: number;

  // Breadcrumbs
  breadcrumbs?: string[];

  // Tabs
  tabField?: string; // field to build tabs from

  // Chip
  chipField?: string; // field to build chips from
  // Button variants
  buttonVariant?: "contained" | "outlined";
}

export interface BuilderComponent {
  id: string;
  type: AllComponentType;
  properties: ComponentProperties;
  children?: BuilderComponent[];
}

export interface DragItem {
  type: string;
  componentType: AllComponentType;
  id?: string;
  ids?: string[];
}
