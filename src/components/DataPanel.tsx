import { useCallback } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { DataModel, DataRelationship } from '../store/dataStore';

interface DataPanelProps {
  models: DataModel[];
  relationships: DataRelationship[];
}

export const DataPanel: React.FC<DataPanelProps> = ({ models, relationships }) => {
  // Convert models to React Flow nodes
  const initialNodes: Node[] = models.map((model, index) => ({
    id: model.id,
    type: 'default',
    position: { x: 250 * index, y: 100 },
    data: {
      label: (
        <div style={{ padding: '10px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
            {model.name}
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            {model.fields.map((field) => (
              <div key={field.id} style={{ marginBottom: '2px' }}>
                {field.name}: <span style={{ fontStyle: 'italic' }}>{field.type}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    style: {
      background: '#fff',
      border: '2px solid #1a192b',
      borderRadius: '8px',
      fontSize: '12px',
      width: 200,
    },
  }));

  // Convert relationships to React Flow edges
  const initialEdges: Edge[] = relationships.map((rel) => ({
    id: rel.id,
    source: rel.fromModelId,
    target: rel.toModelId,
    label: rel.type,
    type: 'smoothstep',
    animated: true,
  }));

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100%', background: '#f5f5f5' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};
