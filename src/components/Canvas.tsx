import { useDrop } from 'react-dnd';
import type { BuilderComponent, DragItem, ComponentType } from '../types';
import { RenderComponent } from './RenderComponent';

interface CanvasProps {
  components: BuilderComponent[];
  selectedId: string | null;
  onAddComponent: (type: ComponentType, parentId?: string) => void;
  onSelectComponent: (id: string | null) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  components,
  selectedId,
  onAddComponent,
  onSelectComponent,
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item: DragItem) => {
      if (item.componentType) {
        onAddComponent(item.componentType);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div className="canvas-container">
      <div className="canvas-toolbar">
        <h3>Canvas</h3>
      </div>
      <div
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={drop as any}
        className="canvas"
        style={{
          backgroundColor: isOver ? '#f0f8ff' : '#ffffff',
          minHeight: '100%',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectComponent(null);
          }
        }}
      >
        {components.length === 0 ? (
          <div className="canvas-empty">
            Drop components here to start building
          </div>
        ) : (
          components.map((component) => (
            <RenderComponent
              key={component.id}
              component={component}
              isSelected={component.id === selectedId}
              onSelect={onSelectComponent}
              onAddComponent={onAddComponent}
            />
          ))
        )}
      </div>
    </div>
  );
};
