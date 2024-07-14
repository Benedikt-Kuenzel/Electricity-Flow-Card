import React from "react";
import ReactDOM from "react-dom/client";
import { Signal } from "@preact/signals-react";
import { ElectricityEntity } from "../models/ElectricityEntity";

export type ReactCardProps = {
    hass: Signal<unknown>;
    config: Signal<unknown>;
    cardSize: Signal<number>;
    cardName: string;
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

            this.render();
        }

        // Whenever the state changes, a new `hass` object is set. Use this to
        // update your content.
        set hass(hass: unknown) {
            console.log("Hass changed");
            signals.hass.value = hass;
            // this.render();
        }

        render() {
            this.root.render(
                <React.StrictMode>
                    <ReactComponent
                        cardName={signals.cardName}
                        hass={signals.hass}
                        config={signals.config}
                        cardSize={signals.cardSize}
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