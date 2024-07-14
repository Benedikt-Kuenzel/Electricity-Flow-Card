import React, { useRef } from "react";
import ReactFlow from 'reactflow';
import { ReactCardProps } from "./utilities/createReactCard";
import 'reactflow/dist/style.css';
import EnergyElementNode from './EnergyElementNode';
import FlowEdge from './FlowEdge';
import { ElectricityEntity, ElectricityState } from "./models/ElectricityEntity";
import './index.css';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "ha-card": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

const nodeTypes = {
  energyElementNode: EnergyElementNode,
};

const edgeTypes = {
  flowEdge: FlowEdge,
};






const initialEdges = [
  { id: 'e2-1', data: { animationSpeed: "2s" }, type: 'flowEdge', animated: true, source: '2', target: '1', sourceHandle: 'IO_Bottom_Left', targetHandle: 'IO_Right_Top' },
  { id: 'e1-3', data: { animationSpeed: "3s" }, type: 'flowEdge', source: '1', target: '3', sourceHandle: 'IO_Right_Center', targetHandle: 'IO_Left_Center' },
  { id: 'e2-3', data: { animationSpeed: "4s" }, type: 'flowEdge', source: '2', target: '3', sourceHandle: 'IO_Bottom_Right', targetHandle: 'IO_Left_Top' },

  { id: 'e2-4', data: { animationSpeed: "2s" }, type: 'flowEdge', source: '2', target: '4', sourceHandle: 'IO_Bottom_Center', targetHandle: 'IO_Top_Center' },
  { id: 'e1-4', data: { animationSpeed: "6s" }, type: 'flowEdge', source: '1', target: '4', sourceHandle: 'IO_Right_Bottom', targetHandle: 'IO_Top_Left' },
  { id: 'e3-4', data: { animationSpeed: "1s" }, type: 'flowEdge', source: '3', target: '4', sourceHandle: 'IO_Left_Bottom', targetHandle: 'IO_Top_Right' }
];

function App({ cardName, hass, config, cardSize }: ReactCardProps) {
  const renderRef = useRef(0);
  renderRef.current++;

  var SolarEntity = new ElectricityEntity(config, hass, "Solar");

  var GridNode = { id: '1', type: 'energyElementNode', position: { x: 0, y: 100 }, data: { label: 'Grid' } };
  var SolarNode = { id: '2', type: 'energyElementNode', position: { x: 100, y: 0 }, data: { label: 'Solar', entity: SolarEntity } };
  var BatteryNode = { id: '3', type: 'energyElementNode', position: { x: 200, y: 100 }, data: { label: 'Battery' } };
  var HomeNode = { id: '4', type: 'energyElementNode', position: { x: 100, y: 200 }, data: { label: 'Home' } };

  var initialNodes = [GridNode, SolarNode, BatteryNode, HomeNode];

  return (
    <ha-card style={{ padding: "1rem" }}>
      <div style={{ width: '400px', height: '400px' }}>
        <ReactFlow zoomOnDoubleClick={false} zoomOnPinch={false} panOnDrag={false} zoomOnScroll={false} nodes={initialNodes} edges={initialEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} connectionMode='loose' />
      </div>
    </ha-card>
  );
}
export default App;