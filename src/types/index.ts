export type ComponentType =
  | "text"
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
  | "column";

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

  // Dropdown properties
  options?: string[];

  // Layout properties
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  gap?: string;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  gridColumns?: number;
  gridRows?: number;
  minColumnWidth?: string; // For responsive grid (auto-fit)

  // Style properties
  borderRadius?: string;
  boxShadow?: string;

  // Validation rules for inputs (optional)
  validations?: Array<any>;

  // Data binding
  dataBinding?: {
    modelId?: string;
    fieldId?: string; // For simple properties (string, number, boolean)
    collectionId?: string; // For arrays/lists (binds to a collection)
    unwrapResults?: boolean; // optional helper for datagrid bindings
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
  type: ComponentType;
  properties: ComponentProperties;
  children?: BuilderComponent[];
}

export interface DragItem {
  type: string;
  componentType: ComponentType;
  id?: string;
}
