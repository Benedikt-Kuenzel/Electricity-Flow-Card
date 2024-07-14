import React from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    EdgeProps,
    getBezierPath,
    useReactFlow,
} from 'reactflow';

import './FlowEdge.css';

export default function CustomEdge({
    id,
    data = { animationSpeed: "2s" },
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}) {
    const { setEdges } = useReactFlow();
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });

    const onEdgeClick = () => {
        setEdges((edges) => edges.filter((edge) => edge.id !== id));
    };

    return (
        <>
            <path id={id} style={style} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd}>
            </path>

            <circle r="1" fill="ivory" stroke="orange">
                <animateMotion calcMode="spline" keyTimes="0;1" keySplines="0.37 0 0.63 1" path={edgePath} begin="0s" dur={data.animationSpeed} fill="freeze" repeatCount="indefinite" />
            </circle>

        </>
    );
}