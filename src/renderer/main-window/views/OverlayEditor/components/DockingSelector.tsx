import React from 'react';
import { Edge } from '@overwolf/odk-ts/window/enums/edge';

interface Props {
  value: Edge;
  onChange: (edge: Edge) => void;
}

const EDGES: { value: Edge; label: string; gridArea: string }[] = [
  { value: Edge.TopLeft, label: 'TL', gridArea: '1 / 1' },
  { value: Edge.Top, label: 'T', gridArea: '1 / 2' },
  { value: Edge.TopRight, label: 'TR', gridArea: '1 / 3' },
  { value: Edge.Left, label: 'L', gridArea: '2 / 1' },
  { value: Edge.None, label: '·', gridArea: '2 / 2' },
  { value: Edge.Right, label: 'R', gridArea: '2 / 3' },
  { value: Edge.BottomLeft, label: 'BL', gridArea: '3 / 1' },
  { value: Edge.Bottom, label: 'B', gridArea: '3 / 2' },
  { value: Edge.BottomRight, label: 'BR', gridArea: '3 / 3' },
];

const DockingSelector: React.FC<Props> = ({ value, onChange }) => {
  return (
    <div className="docking-grid">
      {EDGES.map((edge) => (
        <button
          key={edge.value}
          className={`docking-cell ${value === edge.value ? 'docking-cell--active' : ''} ${edge.value === Edge.None ? 'docking-cell--center' : ''}`}
          style={{ gridArea: edge.gridArea }}
          onClick={() => {
            if (edge.value !== Edge.None) onChange(edge.value);
          }}
          disabled={edge.value === Edge.None}
          title={edge.value}
        >
          {edge.label}
        </button>
      ))}
    </div>
  );
};

export default DockingSelector;
