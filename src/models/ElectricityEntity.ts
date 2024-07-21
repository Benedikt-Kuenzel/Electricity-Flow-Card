import { Signal } from "@preact/signals-react";
import { ElectricityUnit } from "./ElectricityUnit";
import { addHours, differenceInDays } from 'date-fns';

export interface ElectricityState {
    value: number;
    unit: ElectricityUnit;
    available: boolean;
};

export interface Statistics {
    [statisticId: string]: StatisticValue[];
};

export interface StatisticValue {
    statistic_id: string;
    start: string;
    end: string;
    last_reset: string | null;
    max: number | null;
    mean: number | null;
    min: number | null;
    sum: number | null;
    state: number | null;
};

export class ElectricityEntity {
    //External data
    private config: Signal<unknown>;
    private hass: Signal<unknown>;
    private configKey: string;
    private energySelection: Signal<unknown>;

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
    public onUpdated: Signal<number>;

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, configKey: string) {
        this.config = config;
        this.hass = hass;
        this.energySelection = energySelection;
        this.configKey = configKey;
        this.onUpdated = new Signal(0);

        this.hass.subscribe(() => { this.updateState(); });
        this.config.subscribe(() => { this.updateConfig(); this.updateState(); });
    }

    private updateConfig(): void {
        if (this.config.value == null || this.config.value[this.configKey] == null) {
            return;
        }




        this.primaryInputEntityId = this.configKey ? this.config.value[this.configKey]["primaryInputEntity"] : null;
        this.primaryOutputEntityId = this.configKey ? this.config.value[this.configKey]["primaryOutputEntity"] : null;
        this.secondaryEntityId = this.configKey ? this.config.value[this.configKey]["secondaryEntityId"] : null;
        this.secondaryUsesDatePicker = this.configKey ? this.config.value[this.configKey]["secondaryUsesDatePicker"] : false;

        this.primaryUsesDatePicker = this.config.value["primaryUsesDatePicker"];
        this.isPower = this.config.value["readingIsPower"];
        this.kiloThreshold = this.config.value["kiloThreshold"] ?? 1000;
        this.megaThreshold = this.config.value["megaThreshold"] ?? 1000000;
        this.gigaThreshold = this.config.value["gigaThreshold"] ?? 1000000000;
    }

    private async updateState(): Promise<void> {
        if (this.hass.value == null || this.hass.value["states"] == null) {
            this.primaryInputAvailable = false;
            this.primaryOutputAvailable = false;
            this.secondaryAvailable = false;
            return;
        }

        var stateObjPrimaryInput = this.hass.value["states"][this.primaryInputEntityId];
        var stateObjPrimaryOutput = this.hass.value["states"][this.primaryOutputEntityId];
        var stateObjSecondary = this.hass.value["states"][this.secondaryEntityId];
        this.primaryInputAvailable = false;
        this.primaryOutputAvailable = false;
        this.secondaryAvailable = false;

        if (stateObjPrimaryInput && !this.primaryUsesDatePicker) {
            this.primaryInputAvailable = true;
            this.primaryStateInput = Number(stateObjPrimaryInput.state);
        }

        if (stateObjPrimaryOutput && !this.primaryUsesDatePicker) {
            this.primaryOutputAvailable = true;
            this.primaryStateOutput = Number(stateObjPrimaryOutput.state);
        }

        if (stateObjSecondary && !this.secondaryUsesDatePicker) {
            this.secondaryAvailable = true;
            this.primaryStateOutput = Number(stateObjSecondary.state);
        }

        if (stateObjPrimaryInput && this.primaryUsesDatePicker) {
            var accumulatedStats = await this.getDateSelectedStatisticForEntities([this.primaryInputEntityId]);
            console.log(accumulatedStats);
            this.primaryStateInput = accumulatedStats && accumulatedStats[0] ? accumulatedStats[0] : 0;
            this.primaryInputAvailable = accumulatedStats && accumulatedStats[0] ? true : false;
        }

        if (stateObjPrimaryOutput && this.primaryUsesDatePicker) {
            var accumulatedStats = await this.getDateSelectedStatisticForEntities([this.primaryOutputEntityId]);
            console.log(accumulatedStats);
            this.primaryStateOutput = accumulatedStats && accumulatedStats[0] ? accumulatedStats[0] : 0;
            this.primaryOutputAvailable = accumulatedStats && accumulatedStats[0] ? true : false;
        }

        if (stateObjSecondary && this.secondaryUsesDatePicker) {
            var accumulatedStats = await this.getDateSelectedStatisticForEntities([this.secondaryEntityId]);
            console.log(accumulatedStats);
            this.secondaryState = accumulatedStats && accumulatedStats[0] ? accumulatedStats[0] : 0;
            this.secondaryAvailable = accumulatedStats && accumulatedStats[0] ? true : false;
        }

        this.onUpdated.value = this.onUpdated.value++;
    }

    private async getDateSelectedStatisticForEntities(entitiyIds: string[]): Promise<number[]> {
        if (!this.energySelection.value || !this.energySelection.value['end'] || !this.energySelection.value['start']) {
            return null;
        }

        var dayDifference = differenceInDays(this.energySelection.value['end'] || new Date(), this.energySelection.value['start']);
        var startMinHour = addHours(this.energySelection.value['start'], -1);
        var period = dayDifference > 35 ? 'month' : dayDifference > 2 ? 'day' : 'hour';

        var result: Statistics = await this.fetchStatistics(startMinHour, this.energySelection.value['end'], period, entitiyIds);


        Object.values(result).forEach(stat => {
            if (stat.length && new Date(stat[0].start) > startMinHour) {
                stat.unshift({
                    ...stat[0],
                    start: startMinHour.toISOString(),
                    end: startMinHour.toISOString(),
                    sum: stat[0].sum,
                    state: 0,
                });
            }
        });

        var statSums: number[] = [];
        Object.values(result).forEach(stat => {
            if (stat && stat.length > 0 && stat[0] != null && stat[stat.length - 1] != null) {
                var totalIncrease: number = stat[stat.length - 1].sum - stat[0].sum;
                statSums.push(totalIncrease);
            }
            statSums.push(0);
        })

        return statSums;
    }

    private async fetchStatistics(startTime: Date, endTime?: Date, period?: string, statistic_ids?: string[]): Promise<Statistics> {
        return (<any>this.hass.value).callWS({
            type: 'recorder/statistics_during_period',
            start_time: startTime.toISOString(),
            end_time: endTime?.toISOString(),
            statistic_ids,
            period
        }) as Statistics;
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
            unit = this.isPower ? ElectricityUnit.kW : ElectricityUnit.kWh;
        }
        else {
            result = value;
            unit = this.isPower ? ElectricityUnit.W : ElectricityUnit.Wh;
        }

        return { value: result, unit: unit, available: true };
    }

    public getPrimaryInputState(): ElectricityState {
        console.log("Primary Inputstate", this);
        return this.thresholdIfAvailable(this.primaryStateInput, this.primaryInputAvailable);
    }

    public getPrimaryOutputState(): ElectricityState {
        return this.thresholdIfAvailable(this.primaryStateOutput, this.primaryOutputAvailable);
    }

    public getSecondaryState(): ElectricityState {
        return this.thresholdIfAvailable(this.secondaryState, this.secondaryAvailable);
    }
}

