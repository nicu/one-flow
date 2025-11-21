import { useDrop } from 'react-dnd';
import type { BuilderComponent, ComponentType, DragItem, ComponentProperties } from '../types';

interface RenderComponentProps {
  component: BuilderComponent;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onAddComponent: (type: ComponentType, parentId?: string) => void;
}

export const RenderComponent: React.FC<RenderComponentProps> = ({
  component,
  isSelected,
  onSelect,
  onAddComponent,
}) => {
  const isLayout = ['flex', 'grid', 'row', 'column'].includes(component.type);

  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item: DragItem, monitor) => {
      if (monitor.didDrop()) return;
      if (isLayout && item.componentType) {
        onAddComponent(item.componentType, component.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
    }),
    canDrop: () => isLayout,
  }));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(component.id);
  };

  const renderContent = () => {
    const props = component.properties;
    const style = buildStyle(props, component.type);

    switch (component.type) {
      case 'text':
        return <div style={style}>{props.text || 'Text'}</div>;

      case 'image':
        return <img src={props.src || ''} alt={props.alt || ''} style={style} />;

      case 'button':
        return <button style={style}>{props.buttonText || 'Button'}</button>;

      case 'input':
        return (
          <input
            type={props.inputType || 'text'}
            placeholder={props.placeholder || ''}
            style={style}
          />
        );

      case 'dropdown':
        return (
          <select style={style}>
            {(props.options || []).map((opt, idx) => (
              <option key={idx}>{opt}</option>
            ))}
          </select>
        );

      case 'flex':
      case 'row':
      case 'column':
      case 'grid': {
        const children = component.children || [];
        return (
          <div style={style}>
            {children.length === 0 ? (
              <div className="drop-zone-empty">Drop components here</div>
            ) : (
              children.map((child) => (
                <RenderComponent
                  key={child.id}
                  component={child}
                  isSelected={isSelected}
                  onSelect={onSelect}
                  onAddComponent={onAddComponent}
                />
              ))
            )}
          </div>
        );
      }

      default:
        return <div style={style}>Unknown Component</div>;
    }
  };

  return (
    <div
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={isLayout ? (drop as any) : null}
      className={`rendered-component ${isSelected ? 'selected' : ''} ${isOver ? 'drop-over' : ''}`}
      onClick={handleClick}
    >
      {renderContent()}
    </div>
  );
};

const buildStyle = (props: ComponentProperties, type: ComponentType): React.CSSProperties => {
  const style: React.CSSProperties = {};

  if (props.width) style.width = props.width;
  if (props.height) style.height = props.height;
  if (props.minHeight) style.minHeight = props.minHeight;
  if (props.padding) style.padding = props.padding;
  if (props.margin) style.margin = props.margin;
  if (props.backgroundColor) style.backgroundColor = props.backgroundColor;
  if (props.fontSize) style.fontSize = props.fontSize;
  if (props.fontWeight) style.fontWeight = props.fontWeight;
  if (props.color) style.color = props.color;

  if (type === 'button') {
    if (props.buttonColor) style.backgroundColor = props.buttonColor;
    if (props.buttonTextColor) style.color = props.buttonTextColor;
    style.border = 'none';
    style.borderRadius = '4px';
    style.cursor = 'pointer';
  }

  if (props.alignment) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style.textAlign = props.alignment as any;
  }

  // Layout styles
  if (type === 'flex' || type === 'row' || type === 'column') {
    style.display = 'flex';
    style.flexDirection = props.flexDirection || (type === 'column' ? 'column' : 'row');
    if (props.gap) style.gap = props.gap;
    if (props.justifyContent) style.justifyContent = props.justifyContent;
    if (props.alignItems) style.alignItems = props.alignItems;
  }

  if (type === 'grid') {
    style.display = 'grid';
    if (props.gridColumns) {
      style.gridTemplateColumns = `repeat(${props.gridColumns}, 1fr)`;
    }
    if (props.gridRows) {
      style.gridTemplateRows = `repeat(${props.gridRows}, 1fr)`;
    }
    if (props.gap) style.gap = props.gap;
  }

  return style;
};
