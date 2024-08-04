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
            subNodes: [],
            height: 400
        } as const satisfies ReactCardProps;
        cardStates.value = { ...cardStates.value, [cardName]: signals } as const;
    }

    const ReactNode = createReactCard(component, cardStates.value[cardName]);
    customElements.define(cardName, ReactNode);
    const version = "1.0.0";
    console.info(
        `%c ⚡ Electricity Flow Card ⚡ %c ${version} `,
        'color: white; background: blue; font-weight: 700;',
        'color: green; background: white; font-weight: 700;',
    );
}