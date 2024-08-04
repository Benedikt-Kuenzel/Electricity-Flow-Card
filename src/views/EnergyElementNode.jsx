import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import electricityCircle from './electricityCircle';



export default function EnergyElementNode({ data, isConnectable }) {
    var test = data.label;

    var secondary = null;
    var primaryInput = null;
    var primaryOutput = null;
    var icon = null;

    var textColor = "white";
    var iconColor = "white";

    var colorOverride = null;
    var solarColor = null;
    var gridColor = null;
    var batteryColor = null;
    var typeDescription = null;

    var primaryTopString = "";
    var primaryBottomString = "";
    var primaryTotalString = null;
    var circle = null;

    if (data.entity) {
        test = String(data.entity.getPrimaryInputState().value) + String(data.entity.getPrimaryInputState().unit);

        primaryInput = data.entity.getPrimaryInputState();
        primaryOutput = data.entity.getPrimaryOutputState();
        secondary = data.entity.getSecondaryState();

        colorOverride = data.entity.getColorOverride();
        solarColor = data.entity.getSolarColor();
        gridColor = data.entity.getGridColor();
        batteryColor = data.entity.getBatteryColor();
        textColor = data.entity.getTextColor();
        iconColor = data.entity.getIconColor();

        icon = data.entity.getIcon();

        typeDescription = data.entity.getNodeTypeDescription();

        if (typeDescription.isGrid) {
            primaryTopString = "← " + String(primaryInput.value) + " " + String(primaryInput.unit);
            primaryBottomString = "→ " + String(primaryOutput.value) + " " + String(primaryOutput.unit);
        }
        else if (typeDescription.isBattery) {
            primaryTopString = "← " + String(primaryOutput.value) + " " + String(primaryOutput.unit);
            primaryBottomString = "→ " + String(primaryInput.value) + " " + String(primaryInput.unit);
        }
        else if (typeDescription.isSolar) {
            primaryTotalString = primaryOutput.available ? String(primaryOutput.value) + " " + String(primaryOutput.unit) : "-";
        }
        else if (typeDescription.isHome || typeDescription.isSubHome) {
            primaryTotalString = primaryInput.available ? String(primaryInput.value) + " " + String(primaryInput.unit) : "-";
        }

        if (typeDescription.isHome) {
            var fromOtherEntities = data.entity.getElectricityInSystemFromSolarGridAndBattery();
            circle = electricityCircle(fromOtherEntities.fromGrid, fromOtherEntities.fromBattery, fromOtherEntities.fromSolar, gridColor, batteryColor, solarColor, colorOverride);
        }
        else if (typeDescription.isBattery) {
            circle = electricityCircle(0, 0, 0, null, null, null, batteryColor);
        }
        else if (typeDescription.isGrid) {
            circle = electricityCircle(0, 0, 0, null, null, null, gridColor);
        }
        else if (typeDescription.isSolar) {
            circle = electricityCircle(0, 0, 0, null, null, null, solarColor);
        }
        else {
            circle = electricityCircle(0, 0, 0, null, null, null, colorOverride ? colorOverride : 'pink');
        }
    }

    return (
        <>

            <Handle
                id="IO_Left_Top"
                position={Position.Left}
                style={{ top: 28, left: 3, border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Left_Center"
                position={Position.Left}
                style={{ left: 1, border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Left_Bottom"
                position={Position.Left}
                style={{ bottom: 21, left: 3, top: 'auto', border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />

            <Handle
                id="IO_Bottom_Left"
                position={Position.Bottom}
                style={{ left: 28, bottom: 3, border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Bottom_Center"
                position={Position.Bottom}
                style={{ bottom: 1, border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Bottom_Right"
                position={Position.Bottom}
                style={{ right: 21, bottom: 3, left: 'auto', border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />

            <Handle
                id="IO_Top_Left"
                position={Position.Top}
                style={{ left: 28, top: 3, border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Top_Center"
                position={Position.Top}
                style={{ top: 1, border: 5, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Top_Right"
                position={Position.Top}
                style={{ right: 21, top: 3, left: 'auto', border: 0, visibility: 'hidden' }}
                onConnect={(params) => console.log('handle onConnect', params)}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle

                id="IO_Right_Top"
                position={Position.Right}
                style={{ top: 28, right: 3, border: 0, visibility: 'hidden' }}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Right_Center"
                position={Position.Right}
                style={{ right: 1, border: 0, visibility: 'hidden' }}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />
            <Handle
                id="IO_Right_Bottom"
                position={Position.Right}
                style={{ bottom: 21, right: 2, top: 'auto', border: 0, visibility: 'hidden' }}
                isConnectable={true}
                isConnectableStart={true}
                isConnectableEnd={true}
            />

            {secondary != null &&
                <div style={{ lineHeight: '12px', fontSize: '11px', color: textColor }}>
                    {secondary.available ? String(secondary.value) + String(secondary.unit) : "-"}
                </div>}
            <div style={{ color: iconColor }}>
                <ha-icon icon={icon}></ha-icon>
            </div>
            <div style={{ lineHeight: '12px', fontSize: '11px', color: textColor }}>
                {primaryTotalString != null && primaryTotalString}
                {primaryTotalString == null && <>{primaryTopString}  <br /> {primaryBottomString}</>}
            </div>

            <svg viewBox='0 0 100 100'>
                {circle}
            </svg>
        </>
    );
};
