import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { computed } from "@preact/signals-react";

export default memo(({ data, isConnectable }) => {
    var test = data.label;

    if (data.entity) {
        test = computed(() => String(data.entity.onUpdated.value.getPrimaryInputState().value) + String(data.entity.onUpdated.value.getPrimaryInputState().unit))
    }

    return (
        <>

            <Handle
                id="IO_Left_Top"
                position={Position.Left}
                style={{ top: 28, left: 3, border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Left_Center"
                position={Position.Left}
                style={{ left: 1, border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Left_Bottom"
                position={Position.Left}
                style={{ bottom: 21, left: 3, top: 'auto', border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />

            <Handle
                id="IO_Bottom_Left"
                position={Position.Bottom}
                style={{ left: 28, bottom: 3, border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Bottom_Center"
                position={Position.Bottom}
                style={{ bottom: 1, border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Bottom_Right"
                position={Position.Bottom}
                style={{ right: 21, bottom: 3, left: 'auto', border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />

            <Handle
                id="IO_Top_Left"
                position={Position.Top}
                style={{ left: 28, top: 3, border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Top_Center"
                position={Position.Top}
                style={{ top: 1, border: 5 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Top_Right"
                position={Position.Top}
                style={{ right: 21, top: 3, left: 'auto', border: 0 }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle

                id="IO_Right_Top"
                position={Position.Right}
                style={{ top: 28, right: 3, border: 0 }}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Right_Center"
                position={Position.Right}
                style={{ right: 1, border: 0 }}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Right_Bottom"
                position={Position.Right}
                style={{ bottom: 21, right: 2, top: 'auto', border: 0 }}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />

            <div>
                2kwh
            </div>
            <div>
                {test}
            </div>
            <div>
                22kwh
            </div>

            <svg viewBox='0 0 100 100'>
                <circle cx='50' cy='50' r='45' id='green' />
                <circle cx='50' cy='50' r='45' id='blue' />
                <circle cx='50' cy='50' r='45' id='orange' />
            </svg>
        </>
    );
});
