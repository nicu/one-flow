export type ComponentType =
  | "text"
  | "image"
  | "button"
  | "input"
  | "dropdown"
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
  gridColumns?: number;
  gridRows?: number;
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
