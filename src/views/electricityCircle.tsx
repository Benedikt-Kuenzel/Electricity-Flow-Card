import React, { memo } from 'react';

export default function electricityCircle(electricityFromGrid: number, electricityFromBattery: number, electricityFromSolar: number, gridColor: any, batteryColor: any, solarColor: any, overrideColor: any = null) {
    if (overrideColor != null) {
        //fill the entire circle in just that color
        var circleStyle = {
            stroke: String(overrideColor),
            /* length of arc, circumference of circle */
            strokeDasharray: '284, 284',

            strokeDashoffset: '-0'
        };

        return (
            <>
                <circle cx='50' cy='50' r='45' style={circleStyle} />
            </>);
    }



    var total = electricityFromBattery + electricityFromGrid + electricityFromSolar;
    var batteryAmount = Math.round(Math.abs((electricityFromBattery / total) * 284));
    var gridAmount = Math.round(Math.abs((electricityFromGrid / total) * 284));


    //this is the 'background' circle so it can fill the entire thing, 
    //while the others just fill the amount calculated from their energy share
    var solarStyle = {
        stroke: String(solarColor),
        /* length of arc, circumference of circle */
        strokeDasharray: '284, 284',

        strokeDashoffset: '-0'
    };

    //this starts after grid, so it has to have it as an offset
    var batteryStyle = {
        stroke: String(batteryColor),
        /* length of arc, circumference of circle */
        strokeDasharray: String(batteryAmount) + ' 284',

        strokeDashoffset: '-' + String(gridAmount)
    };

    //and finally this starts at offset 0 (3 o clock)
    var gridStyle = {
        stroke: String(gridColor),
        /* length of arc, circumference of circle */
        strokeDasharray: String(gridAmount) + ' 284',

        strokeDashoffset: '0'
    };


    return (
        <>
            <circle cx='50' cy='50' r='45' style={solarStyle} />
            <circle cx='50' cy='50' r='45' style={batteryStyle} />
            <circle cx='50' cy='50' r='45' style={gridStyle} />
        </>);
}