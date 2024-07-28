import React, { useRef } from "react";
import ReactFlow from 'reactflow';
import { ReactCardProps } from "./utilities/createReactCard";
import 'reactflow/dist/style.css';
import EnergyElementNode from './views/EnergyElementNode';
import FlowEdge from './views/FlowEdge';
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
  { id: 'solar-grid', data: { animationSpeed: "2s" }, type: 'flowEdge', animated: true, source: 'solar', target: 'grid', sourceHandle: 'IO_Bottom_Left', targetHandle: 'IO_Right_Top' },
  { id: 'grid-battery', data: { animationSpeed: "3s" }, type: 'flowEdge', source: 'grid', target: 'battery', sourceHandle: 'IO_Right_Center', targetHandle: 'IO_Left_Center' },
  { id: 'solar-battery', data: { animationSpeed: "4s" }, type: 'flowEdge', source: 'solar', target: 'battery', sourceHandle: 'IO_Bottom_Right', targetHandle: 'IO_Left_Top' },
  { id: 'solar-home', data: { animationSpeed: "2s" }, type: 'flowEdge', source: 'solar', target: 'home', sourceHandle: 'IO_Bottom_Center', targetHandle: 'IO_Top_Center' },
  { id: 'grid-home', data: { animationSpeed: "6s" }, type: 'flowEdge', source: 'grid', target: 'home', sourceHandle: 'IO_Right_Bottom', targetHandle: 'IO_Top_Left' },
  { id: 'battery-home', data: { animationSpeed: "1s" }, type: 'flowEdge', source: 'battery', target: 'home', sourceHandle: 'IO_Left_Bottom', targetHandle: 'IO_Top_Right' }
];

function App({ cardName, hass, config, cardSize, energySelection, entities, nodes, edges, subNodes, subEdges }: ReactCardProps) {
  const renderRef = useRef(0);
  renderRef.current++;

  var ReactFlowEdges = [];

  edges.forEach(edge => {
    ReactFlowEdges.push(edge.getEdgeDescription());
  })

  subEdges.forEach(subEdge => {
    ReactFlowEdges.push(subEdge.getEdgeDescription());
  })

  var ReactFlowNodes = [];

  nodes.forEach(node => {
    ReactFlowNodes.push(node);
  })

  subNodes.forEach(subNodes => {
    ReactFlowNodes.push(subNodes);
  })

  return (
    <ha-card style={{ padding: "1rem" }}>
      <div style={{ width: '400px', height: '400px' }}>
        <ReactFlow zoomOnDoubleClick={false} zoomOnPinch={false} panOnDrag={false} zoomOnScroll={false} nodes={ReactFlowNodes} edges={ReactFlowEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} connectionMode='loose' />
      </div>
    </ha-card>
  );
}
export default App;