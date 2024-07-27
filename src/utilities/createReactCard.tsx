import React from "react";
import ReactDOM from "react-dom/client";
import { Signal } from "@preact/signals-react";
import { ElectricityEntity, SolarEntity, GridEntity, BatteryEntity, HomeEntity, SubHomeEntity } from "../models/ElectricityEntity";

export type ReactCardProps = {
    hass: Signal<unknown>;
    config: Signal<unknown>;
    cardSize: Signal<number>;
    cardName: string;
    energySelection: Signal<unknown>;
    entities: ElectricityEntity[];
    nodes: any[];
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

            this.createEntities();
            this.createNodes();
            this.render();
        }

        createEntities() {
            var Solar: SolarEntity = new SolarEntity(signals.config, signals.hass, signals.energySelection);
            var Grid: GridEntity = new GridEntity(signals.config, signals.hass, signals.energySelection);
            var Battery: BatteryEntity = new BatteryEntity(signals.config, signals.hass, signals.energySelection);
            var Home: HomeEntity = new HomeEntity(signals.config, signals.hass, signals.energySelection);
            signals.entities = [Grid, Solar, Battery, Home];

            signals.entities.forEach(entity => {
                entity.onUpdated.subscribe(() => this.render());
            })
        }

        createNodes() {
            var GridNode = { id: '1', type: 'energyElementNode', position: { x: 0, y: 100 }, data: { label: 'Grid', entity: signals.entities[0], primaryInput: signals.entities[0].getPrimaryInputState(), primaryOutput: signals.entities[0].getPrimaryOutputState(), secondary: signals.entities[0].getSecondaryState() } };
            var SolarNode = { id: '2', type: 'energyElementNode', position: { x: 100, y: 0 }, data: { label: 'Solar', entity: signals.entities[1], primaryInput: signals.entities[1].getPrimaryInputState(), primaryOutput: signals.entities[1].getPrimaryOutputState(), secondary: signals.entities[1].getSecondaryState() } };
            var BatteryNode = { id: '3', type: 'energyElementNode', position: { x: 200, y: 100 }, data: { label: 'Battery', entity: signals.entities[2], primaryInput: signals.entities[2].getPrimaryInputState(), primaryOutput: signals.entities[2].getPrimaryOutputState(), secondary: signals.entities[2].getSecondaryState() } };
            var HomeNode = { id: '4', type: 'energyElementNode', position: { x: 100, y: 200 }, data: { label: 'Home', entity: signals.entities[3], primaryInput: signals.entities[3].getPrimaryInputState(), primaryOutput: signals.entities[3].getPrimaryOutputState(), secondary: signals.entities[3].getSecondaryState() } };
            signals.nodes = [GridNode, SolarNode, BatteryNode, HomeNode];
        }

        // Whenever the state changes, a new `hass` object is set. Use this to
        // update your content.
        set hass(hass: unknown) {
            console.log("Hass changed");
            signals.energySelection.value = getEnergyDataCollection(hass);
            signals.hass.value = hass;
        }


        render() {
            this.createNodes();
            this.root.render(
                <React.StrictMode>
                    <ReactComponent
                        cardName={signals.cardName}
                        hass={signals.hass}
                        config={signals.config}
                        cardSize={signals.cardSize}
                        energySelection={signals.energySelection}
                        nodes={signals.nodes}
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
        }

        configChanged(newConfig: unknown) {
            signals.config.value = newConfig;
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