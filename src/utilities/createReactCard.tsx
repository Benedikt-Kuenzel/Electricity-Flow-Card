import React from "react";
import ReactDOM from "react-dom/client";
import { Signal } from "@preact/signals-react";
import { ElectricityEntity, SolarEntity, GridEntity, BatteryEntity, HomeEntity, SubHomeEntity } from "../models/ElectricityEntity";
import { ElectricityEdge } from "../models/ElectricityEdge";
import { HassService } from "../utilities/hassService"

export type ReactCardProps = {
    hass: Signal<unknown>;
    config: Signal<unknown>;
    cardSize: Signal<number>;
    cardName: string;
    energySelection: Signal<unknown>;
    entities: ElectricityEntity[];
    nodes: any[];
    edges: ElectricityEdge[];
    subEntities: ElectricityEntity[];
    subEdges: ElectricityEdge[];
    subNodes: any[];
};

export interface EnergyCollection {
    start: Date;
    end?: Date;
    clearPrefs(): void;
    setPeriod(newStart: Date, newEnd?: Date): void;
    _refreshTimeout?: number;
    _updatePeriodTimeout?: number;
    _active: number;
};

export const getEnergyDataCollection = (hass: any, key = '_energy'): EnergyCollection | null => {
    if ((hass.connection as any)[key]) {
        return (hass.connection as any)[key];
    }
    // HA has not initialized the collection yet and we don't want to interfere with that
    return null;
};

const createReactCard = (
    ReactComponent: React.ElementType,
    signals: ReactCardProps
) => {
    return class Card extends HTMLElement {
        root: ReactDOM.Root;
        private mountPoint!: HTMLDivElement;

        constructor() {
            super();

            this.mountPoint = document.createElement("div");
            const style = document.createElement("style");
            style.innerHTML = SHADOW_STYLE;
            this.attachShadow({ mode: "open" });
            this.shadowRoot.appendChild(this.mountPoint);
            this.shadowRoot.appendChild(style);
            this.root = ReactDOM.createRoot(this.shadowRoot);

            HassService.createService(signals.hass, signals.energySelection);
            this.createEntitiesAndEdges();
            this.createSubEntitiesAndEdges();
            this.render();
        }

        createEntitiesAndEdges() {
            var Solar: SolarEntity = new SolarEntity(signals.config, signals.hass, signals.energySelection, 'solar');
            var Grid: GridEntity = new GridEntity(signals.config, signals.hass, signals.energySelection, 'grid');
            var Battery: BatteryEntity = new BatteryEntity(signals.config, signals.hass, signals.energySelection, 'battery');
            var Home: HomeEntity = new HomeEntity(signals.config, signals.hass, signals.energySelection, 'home');
            signals.entities = [Grid, Solar, Battery, Home];

            signals.entities.forEach(entity => {
                entity.onUpdated.subscribe(() => this.render());
            })

            var SolarToGrid = new ElectricityEdge(Solar, Grid, 'IO_Bottom_Left', 'IO_Right_Top', 0);
            var GridToBattery = new ElectricityEdge(Grid, Battery, 'IO_Right_Center', 'IO_Left_Center', 1);
            var SolarToBattery = new ElectricityEdge(Solar, Battery, 'IO_Bottom_Right', 'IO_Left_Top', 2);
            var SolarToHome = new ElectricityEdge(Solar, Home, 'IO_Bottom_Center', 'IO_Top_Center', 3);
            var GridToHome = new ElectricityEdge(Grid, Home, 'IO_Right_Bottom', 'IO_Top_Left', 4);
            var BatteryToHome = new ElectricityEdge(Battery, Home, 'IO_Left_Bottom', 'IO_Top_Right', 5);

            signals.edges = [SolarToGrid, GridToBattery, SolarToBattery, SolarToHome, GridToHome, BatteryToHome];
        }

        createNodes() {
            var GridNode = { id: 'grid', type: 'energyElementNode', position: { x: signals.config.value['grid']?.["x"] ?? 0, y: signals.config.value['grid']?.["y"] ?? 100 }, data: { label: 'Grid', entity: signals.entities[0], primaryInput: signals.entities[0].getPrimaryInputState(), primaryOutput: signals.entities[0].getPrimaryOutputState(), secondary: signals.entities[0].getSecondaryState() } };
            var SolarNode = { id: 'solar', type: 'energyElementNode', position: { x: signals.config.value['solar']?.["x"] ?? 100, y: signals.config.value['solar']?.["y"] ?? 0 }, data: { label: 'Solar', entity: signals.entities[1], primaryInput: signals.entities[1].getPrimaryInputState(), primaryOutput: signals.entities[1].getPrimaryOutputState(), secondary: signals.entities[1].getSecondaryState() } };
            var BatteryNode = { id: 'battery', type: 'energyElementNode', position: { x: signals.config.value['battery']?.["x"] ?? 200, y: signals.config.value['battery']?.["y"] ?? 100 }, data: { label: 'Battery', entity: signals.entities[2], primaryInput: signals.entities[2].getPrimaryInputState(), primaryOutput: signals.entities[2].getPrimaryOutputState(), secondary: signals.entities[2].getSecondaryState() } };
            var HomeNode = { id: 'home', type: 'energyElementNode', position: { x: signals.config.value['home']?.["x"] ?? 100, y: signals.config.value['home']?.["y"] ?? 200 }, data: { label: 'Home', entity: signals.entities[3], primaryInput: signals.entities[3].getPrimaryInputState(), primaryOutput: signals.entities[3].getPrimaryOutputState(), secondary: signals.entities[3].getSecondaryState() } };
            signals.nodes = [GridNode, SolarNode, BatteryNode, HomeNode];
        }

        createSubEntitiesAndEdges() {
            var subHomes: SubHomeEntity[] = [];

            signals.subEntities = [];
            signals.subEdges = [];

            for (const [key, value] of Object.entries(signals.config.value)) {
                if (key.includes("subHome")) {
                    var subHome = new SubHomeEntity(signals.config, signals.hass, signals.energySelection, String(key), String(key));
                    subHomes.push(subHome);
                }
            }

            signals.entities[3].clearChildEntities();

            subHomes.forEach(subHome => {
                var config = signals.config.value[subHome.getConfigKey()];
                var parent = config["parentId"] == "home" ? signals.entities[3] : null;
                if (parent == null) {
                    subHomes.forEach(otherSubHome => {
                        if (otherSubHome.getNodeId() == config["parentId"])
                            parent = otherSubHome;
                    })
                }

                if (parent == null)
                    throw "No parent found for sub home node";

                parent.addChildEntity(subHome);
                subHome.setParentEntity(parent);
                signals.subEdges.push(new ElectricityEdge(parent, subHome, 'IO_Bottom_Center', 'IO_Top_Center', 0));
                signals.subEntities.push(subHome);
            });
        }

        createSubNodes() {
            signals.subNodes = []
            signals.subEntities.forEach(subEntity => {
                signals.subNodes.push({ id: subEntity.getNodeId(), type: 'energyElementNode', position: { x: signals.config.value[subEntity.getConfigKey()]["x"], y: signals.config.value[subEntity.getConfigKey()]["y"] }, data: { label: signals.config.value[subEntity.getConfigKey()]['label'], entity: subEntity, primaryInput: subEntity.getPrimaryInputState(), primaryOutput: subEntity.getPrimaryOutputState(), secondary: subEntity.getSecondaryState() } })
            })
        }


        // Whenever the state changes, a new `hass` object is set. Use this to
        // update your content.
        set hass(hass: unknown) {
            signals.energySelection.value = getEnergyDataCollection(hass);
            signals.hass.value = hass;
        }


        render() {
            this.createNodes();
            this.createSubNodes();
            this.root.render(
                <React.StrictMode>
                    <ReactComponent
                        cardName={signals.cardName}
                        hass={signals.hass}
                        config={signals.config}
                        cardSize={signals.cardSize}
                        energySelection={signals.energySelection}
                        nodes={signals.nodes}
                        edges={signals.edges}
                        subEntities={signals.subEntities}
                        subEdges={signals.subEdges}
                        subNodes={signals.subNodes}
                    />
                </React.StrictMode>
            );
        }

        /**
         * Your card can define a getConfigElement method that returns a custom element for editing the user configuration. Home Assistant will display this element in the card editor in the dashboard.
         */
        static getConfigElement() {
            return document.createElement(`${signals.cardName}-editor`);
        }

        // The user supplied configuration. Throw an exception and Home Assistant
        // will render an error card.
        setConfig(config: unknown) {
            signals.config.value = config;
            this.createSubEntitiesAndEdges();
            this.render();
        }

        configChanged(newConfig: unknown) {
            signals.config.value = newConfig;
            this.createSubEntitiesAndEdges();
            this.render();
        }

        // The height of your card. Home Assistant uses this to automatically
        // distribute all cards over the available columns.
        getCardSize() {
            signals.cardSize.value = Math.max(
                1,
                Math.ceil(this.shadowRoot.host.getBoundingClientRect().height / 50)
            );
            return signals.cardSize.value;
        }
    };
};

export default createReactCard;