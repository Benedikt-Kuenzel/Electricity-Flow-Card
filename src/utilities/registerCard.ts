import { signal } from "@preact/signals-react";
import cardStates from "../cardStates";
import createReactCard, { ReactCardProps } from "./createReactCard";
import { ElectricityEntity } from "../models/ElectricityEntity";


export default function registerCard(
    cardName: string,
    component: React.ElementType
) {
    if (!cardStates.value[cardName]) {
        const signals = {
            hass: signal({}),
            config: signal({}),
            cardSize: signal(1),
            cardName,
            energySelection: signal({}),
            entities: [],
            nodes: [],
            edges: [],
            subEntities: [],
            subEdges: [],
            subNodes: []
        } as const satisfies ReactCardProps;
        cardStates.value = { ...cardStates.value, [cardName]: signals } as const;
    }

    const ReactNode = createReactCard(component, cardStates.value[cardName]);
    customElements.define(cardName, ReactNode);
    console.info("Registered:", cardName);
}