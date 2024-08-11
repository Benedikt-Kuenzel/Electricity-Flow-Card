# Electricity-Flow-Card

## Introduction

This project expands on HomeAssistant's energy card. It adds support for both power and energy data (it simply uses the units provided by you or the selected entities),
custom nodes and integrates with custom date pickers. 
You can add a completely customizable subtree of nodes to your home consumption node. If you are missing a power/energy meter for one of these sub nodes, the card will even calculate
the missing value for you. All nodes are fully customizable, you can change their icons, colours, secondary entities (for example a battery charge indicator) and more.

![Preview Gif of the Electricity-Flow-Card](/images/preview.gif)


## How to install in HomeAssistant

### Manual installation
To install the Electricity-Flow-Card manually, first download the latest release electricity-flow-card.js file in the releases section of this repository.
Then, upload this file to your assistants /www folder. Finally, head to Settings->Dashboards->Resources and add a new javascript module there.
The URL should be /local/electricity-flow-card.js?v=1 . If you want to update the Electricity-Flow-Card, simply change the existing electricity-flow-card.js file to that of a later release.
Then, increase the ?v=1 parameter in the resource URL and hit control+F5 to clean your cache. 

### Installation using HACS

The Electricity-Flow-Card is not currently distributed via HACS. This section will be updated once this changes.

## How to use and description of parameters

The Electricity-Flow-Card offers some general configuration that effects all displayed nodes. We detail these first.
Therafter we discuss the configuration of individual nodes.

### Overall parameters

| Parameter | Description | Example | Mandatory Parameter? |
| ------------- | ------------- | ------------- |
| primaryUsesDatePicker  | If the displayed primary data (energy/power consumption/production) is influenced by a date picker on the dashboard  | true or false | No |
| kiloThreshold  | The threshold at which kW or kWh is displayed instead of WH/WH  | 1000 | No |
| megaThreshold | The threshold at which MW or MWh is displayed instead of WH/WH | 1000000 | No |
| gigaThreshold | The threshold at which GW or GWh is displayed instead of WH/WH | 1000000000 | No |
| usesDarkmode | If the card should respond to dark mode of the dashboard | true or false | No |
| darkIconColor | The color of icons in dark mode | Any valid CSS color string, or leave unset to use defaults | No |
| darkTextColor | The color of text in dark mode | Any valid CSS color string, or leave unset to use defaults | No |
| lightIconColor | The color of icons in light mode | Any valid CSS color string, or leave unset to use defaults | No |
| lightTextColor | The color of text in light mode | Any valid CSS color string, or leave unset to use defaults | No |
| solarColor | Color of the solar node | Any valid CSS color string, or leave unset to use defaults | No |
| gridColor | Color of the grid node | Any valid CSS color string, or leave unset to use defaults | No |
| batteryColor | Color of the battery node | Any valid CSS color string, or leave unset to use defaults | No |
| solar | Description of the solar node | See the following on node configuration | Yes |
| grid | Description of the grid node | See the following on node configuration | Yes |
| battery | Description of the battery node | See the following on node configuration | Yes |
| home | Description of the home node | See the following on node configuration | Yes |


### Node specific parameters


| Parameter | Description | Example | Mandatory Parameter? |
| ------------- | ------------- | ------------- |
| primaryOutputEntity  | The entity that measures the displayed output value of the node |  | Mandatory for solar, grid and battery nodes |
| primaryInputEntity  |  The entity that measures the displayed input value of the node | 1000 | Mandatory for grid and battery nodes |
| secondaryEntity | A secondary value shown in the top of the node | For example, a % charge value of the battery | No |
| icon | An icon that should be displayed in the center of the node | Any mdi icon, for example mdi:home | No |
| secondaryUsesDatePicker | If the secondary value should show momentary values or be influenced by a date picker on the dashboard | true or false | No |
| colorOverride | Overrides the default color of the node | Any valid CSS color string, or leave unset to use defaults | No |
| label | A label for the node | For example 'First floor' | No |
| x | The horizontal position of the node in the card | For example 100 | Not mandatory for solar, grid, battery and home, but mandatory for sub-nodes (discussed later) |
| y | The vertical position of the node in the card | For example 100 | Not mandatory for solar, grid, battery and home, but mandatory for sub-nodes (discussed later) |
| parentId | Name of the parent node | For example 'home' | Not mandatory for solar, grid, battery and home, but mandatory for sub-nodes (discussed later) |


As you can see, primary entities are not mandatory for the home node. If no entity is provided, the card will instead calculate your home's consumption for you based on the other specified nodes.
The Electricity-Flow-Card also features sub-nodes for your home nodes, which can be freely arranged as a tree. An example is shown in the following:

```
home:
  secondaryUsesDatePicker: false
  icon: mdi:home
subHome_1:
  parentId: home
  x: 138
  'y': 360
  label: Erster Stock
  icon: mdi:home-floor-1
  primaryInputEntity: sensor.smart_meter_ts_65a_3_bezogene_wirkenergie_4
  colorOverride: '#c213bf'
subHome_2:
  parentId: home
  x: 62
  'y': 360
  label: Erdgeschoss
  icon: mdi:home-floor-0
  primaryInputEntity: sensor.smart_meter_ts_65a_3_bezogene_wirkenergie_3
  colorOverride: '#c213bf'
```

Sub nodes must be named subHome[string] where string is any unique name you want to assign to the node. Sub-nodes must also feature the parentId-parameter, which tells the card to which parent node
the sub-node should be connected. This way, you can have sub-nodes of other sub-nodes! All subnodes must have x and y parameters set in order to position them in the card. 
In total, one of the sub-nodes per level of your sub-node tree does not need to have a primary input entity assigned. The system will instead calculate its value based on the consumption of its parent node, minus
the consumptions of its sibling nodes.

### Example

All of the above is probably fairly theoretic to you. In the following, we provide an example config that was used to generate the demo gif at the beginning of this readme. This should give you a starting point for creating your own config, along with a description of all the parameters above.

```
type: custom:electricity-flow-card
primaryUsesDatePicker: true
kiloThreshold: 0
usesDarkmode: true
solar:
  primaryOutputEntity: sensor.pvleistungintegral
  secondaryUsesDatePicker: false
  icon: mdi:solar-power
  colorOverride: '#ffae00'
grid:
  primaryOutputEntity: sensor.smart_meter_ts_65a_3_bezogene_wirkenergie
  primaryInputEntity: sensor.smart_meter_ts_65a_3_eingespeiste_wirkenergie
  secondaryUsesDatePicker: false
  icon: mdi:transmission-tower
  colorOverride: '#187fcc'
battery:
  primaryInputEntity: sensor.batterieladungintegral
  primaryOutputEntity: sensor.batterieentladungintegral
  secondaryEntity: sensor.byd_battery_box_premium_hv_ladezustand
  secondaryUsesDatePicker: false
  icon: mdi:battery
  colorOverride: '#05b35f'
home:
  secondaryUsesDatePicker: false
  icon: mdi:home
subHome_1:
  parentId: home
  x: 138
  'y': 360
  label: Erster Stock
  icon: mdi:home-floor-1
  primaryInputEntity: sensor.smart_meter_ts_65a_3_bezogene_wirkenergie_4
  colorOverride: '#c213bf'
subHome_2:
  parentId: home
  x: 62
  'y': 360
  label: Erdgeschoss
  icon: mdi:home-floor-0
  primaryInputEntity: sensor.smart_meter_ts_65a_3_bezogene_wirkenergie_3
  colorOverride: '#c213bf'
subHome_4:
  parentId: home
  x: 200
  'y': 300
  label: Wallbox
  icon: mdi:battery-charging
  primaryInputEntity: sensor.smart_meter_ts_65a_3_bezogene_wirkenergie_2
  colorOverride: '#9fc213'
subHome_3:
  parentId: home
  x: 0
  'y': 300
  label: Keller
  icon: mdi:home-floor-b
  colorOverride: '#8b13c2'

```

## How to contribute

TODO

