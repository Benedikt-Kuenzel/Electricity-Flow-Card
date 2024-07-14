import { Signal } from "@preact/signals-react";
import { ElectricityUnit } from "./ElectricityUnit";

export interface ElectricityState {
    value: number;
    unit: ElectricityUnit;
    available: boolean;
}

export class ElectricityEntity {
    //External data
    private config: Signal<unknown>;
    private hass: Signal<unknown>;
    private configKey: string;

    //Extracted Configuration
    private primaryInputEntityId: any;
    private primaryOutputEntityId: any;
    private secondaryEntityId: any;
    private primaryUsesDatePicker: boolean;
    private secondaryUsesDatePicker: boolean;
    private isPower: boolean;
    private kiloThreshold: any;
    private megaThreshold: any;
    private gigaThreshold: any;

    //Extracted State
    private primaryStateInput: number;
    private primaryStateOutput: number;
    private primaryInputAvailable: boolean;
    private primaryOutputAvailable: boolean;
    private secondaryState: number;
    private secondaryAvailable: boolean;

    //Signals
    public onUpdated: Signal<ElectricityEntity>;

    constructor(config: Signal<unknown>, hass: Signal<unknown>, configKey: string) {
        this.config = config;
        this.hass = hass;
        this.configKey = configKey;
        this.onUpdated = new Signal(this);

        this.hass.subscribe(() => { this.updateState(); });
        this.config.subscribe(() => { this.updateConfig(); this.updateState(); });

        this.updateConfig();
        this.updateState();
    }

    private updateConfig(): void {
        this.primaryInputEntityId = this.configKey ? this.config.value[this.configKey]["primaryInputEntity"] : null;
        this.primaryOutputEntityId = this.configKey ? this.config.value[this.configKey]["primaryOutputEntity"] : null;
        this.secondaryEntityId = this.configKey ? this.config.value[this.configKey]["secondaryEntityId"] : null;
        this.secondaryUsesDatePicker = this.configKey ? this.config.value[this.configKey]["secondaryUsesDatePicker"] : null;

        this.primaryUsesDatePicker = this.config.value["primaryUsesDatePicker"];
        this.isPower = this.config.value["readingIsPower"];
        this.kiloThreshold = this.config.value["kiloThreshold"] ?? 1000;
        this.megaThreshold = this.config.value["megaThreshold"] ?? 1000000;
        this.gigaThreshold = this.config.value["gigaThreshold"] ?? 1000000000;
    }

    private updateState(): void {
        var stateObjPrimaryInput = this.hass.value["states"][this.primaryInputEntityId];
        var stateObjPrimaryOutput = this.hass.value["states"][this.primaryOutputEntityId];
        var stateObjSecondary = this.hass.value["states"][this.secondaryEntityId];
        this.primaryInputAvailable = false;
        this.primaryOutputAvailable = false;
        this.secondaryAvailable = false;

        if (stateObjPrimaryInput) {
            this.primaryInputAvailable = true;
            this.primaryStateInput = Number(stateObjPrimaryInput.state);
        }

        if (stateObjPrimaryOutput) {
            this.primaryOutputAvailable = true;
            this.primaryStateOutput = Number(stateObjPrimaryOutput.state);
        }

        if (stateObjSecondary) {
            this.secondaryAvailable = true;
            this.primaryStateOutput = Number(stateObjSecondary.state);
        }

        this.onUpdated.value = this;
    }

    private thresholdIfAvailable(value: number, available: boolean): ElectricityState {
        if (!available) {
            return { value: null, unit: null, available: false };
        }

        var result: number;
        var unit: ElectricityUnit;

        if (value > this.gigaThreshold) {
            result = value / 1000000000;
            unit = this.isPower ? ElectricityUnit.GW : ElectricityUnit.GWh;
        }
        else if (value > this.megaThreshold) {
            result = value / 1000000;
            unit = this.isPower ? ElectricityUnit.MW : ElectricityUnit.MWh;
        }
        else if (value > this.kiloThreshold) {
            result = value / 1000;
            unit = this.isPower ? ElectricityUnit.W : ElectricityUnit.Wh;
        }

        return { value: result, unit: unit, available: true };
    }

    public getPrimaryInputState(): ElectricityState {
        return this.thresholdIfAvailable(this.primaryStateInput, this.primaryInputAvailable);
    }

    public getPrimaryOutputState(): ElectricityState {
        return this.thresholdIfAvailable(this.primaryStateOutput, this.primaryOutputAvailable);
    }

    public getSecondaryState(): ElectricityState {
        return this.thresholdIfAvailable(this.secondaryState, this.secondaryAvailable);
    }
}

