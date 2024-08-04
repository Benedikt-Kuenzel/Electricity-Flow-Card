import React, { useEffect, useRef, useState } from "react";
import { ReactFlow, useNodesState } from 'reactflow';
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

function App({ cardName, hass, config, cardSize, energySelection, entities, nodes, edges, subNodes, subEdges, height }: ReactCardProps) {
  const renderRef = useRef(0);
  renderRef.current++;

  const tag = useRef();



  var maxX = nodes && nodes[0] ? nodes[0].data.x : 0;

  nodes.forEach(node => {
    if (node.data.x > maxX) {
      maxX = node.data.x;
    }
  });

  subNodes.forEach(node => {
    if (node.data.x > maxX) {
      maxX = node.data.x;
    }
  });

  var nodeWidth = maxX + 100;

  nodes.forEach(node => {
    node.position.x = (node.data.x / nodeWidth) * (tag?.current?.clientWidth ?? 400);
  });
  subNodes.forEach(node => {
    node.position.x = (node.data.x / nodeWidth) * (tag?.current?.clientWidth ?? 400);
  });


  var ReactFlowEdges = [];

  edges.forEach(edge => {
    ReactFlowEdges.push(edge.getEdgeDescription());
  })

  subEdges.forEach(subEdge => {
    ReactFlowEdges.push(subEdge.getEdgeDescription());
  })

  const ReactFlowNodes = [];

  nodes.forEach(node => {
    ReactFlowNodes.push(node);
  })

  subNodes.forEach(subNodes => {
    ReactFlowNodes.push(subNodes);
  })

  //hiding attribution as this is project itself is public domain
  //TODO: If you are using this project in a commercial setting, please follow
  //the reactflow license guidelines!
  const proOptions = { hideAttribution: true };

  const [usedNodes, setNodes, onNodesChange] = useNodesState(ReactFlowNodes);

  const onResize = React.useCallback(() => {
    if (tag.current) {
      setNodes((nds) =>
        nds.map((node) => {
          return {
            ...node,
            position: {
              ...node.position,
              x: (node.data.x / nodeWidth) * (tag?.current?.clientWidth ?? 400)
            }
          };
        }),
      );

    }
  }, [tag?.current?.clientWidth]);


  React.useEffect(() => {
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <ha-card style={{ padding: "1rem" }}>
      <div ref={tag} style={{ height: height }}>
        <ReactFlow proOptions={proOptions} zoomOnDoubleClick={false} nodesDraggable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable={false} zoomOnPinch={false} autoPanOnNodeDrag={false} panOnDrag={false} panOnScroll={false} zoomOnScroll={false} nodes={usedNodes} edges={ReactFlowEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} connectionMode='loose' />
      </div>
    </ha-card>
  );
}
export default App;