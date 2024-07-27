import { Signal } from "@preact/signals-react";
import { ElectricityUnit, StateUnit } from "./ElectricityUnit";
import { addHours, differenceInDays } from 'date-fns';

export interface ElectricityState {
    value: number;
    unit: ElectricityUnit;
    available: boolean;
};

export interface GeneralState {
    value: number;
    unit: string;
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

export abstract class ElectricityEntity {
    //References to required entities
    protected static Grid: GridEntity;
    protected static Battery: BatteryEntity;
    protected static Solar: SolarEntity;
    protected static Home: HomeEntity;

    //External data
    private config: Signal<unknown>;
    private hass: Signal<unknown>;
    private configKey: string;
    private energySelection: Signal<unknown>;

    //To be set by subclasses
    protected isSolar: boolean = false;
    protected isGrid: boolean = false;
    protected isBattery: boolean = false;
    protected isHome: boolean = false;
    protected isSubHome: boolean = false;

    //Extracted Configuration
    protected primaryInputEntityId: any;
    private primaryOutputEntityId: any;
    private secondaryEntityId: any;
    private primaryUsesDatePicker: boolean;
    private secondaryUsesDatePicker: boolean;
    protected kiloThreshold: any;
    protected megaThreshold: any;
    protected gigaThreshold: any;
    private haIcon: any;
    private solarColor: any;
    private gridColor: any;
    private batteryColor: any;
    private colorOverride: any;



    //Extracted State
    private primaryStateInput: number;
    private primaryStateInputUnit: StateUnit = new StateUnit();
    private primaryStateOutput: number;
    private primaryStateOutputUnit: StateUnit = new StateUnit();
    private primaryInputAvailable: boolean;
    private primaryOutputAvailable: boolean;
    private secondaryState: number;
    private secondaryStateUnit: StateUnit = new StateUnit();
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
        this.secondaryEntityId = this.configKey ? this.config.value[this.configKey]["secondaryEntity"] : null;
        this.secondaryUsesDatePicker = this.configKey ? this.config.value[this.configKey]["secondaryUsesDatePicker"] : false;

        this.primaryUsesDatePicker = this.config.value["primaryUsesDatePicker"];
        this.kiloThreshold = this.config.value["kiloThreshold"] ?? 1000;
        this.megaThreshold = this.config.value["megaThreshold"] ?? 1000000;
        this.gigaThreshold = this.config.value["gigaThreshold"] ?? 1000000000;
        this.haIcon = this.configKey ? this.config.value[this.configKey]["icon"] : "";
        this.solarColor = this.config.value["solarColor"] ?? "orange";
        this.gridColor = this.config.value["gridColor"] ?? "blue";
        this.batteryColor = this.config.value["batteryColor"] ?? "red";
        this.colorOverride = this.configKey ? this.config.value[this.configKey]["colorOverride"] : null;

        this.primaryStateInputUnit.setUnitFromConfig(this.configKey ? this.config.value[this.configKey]["primaryInputUnit"] : null);
        this.primaryStateOutputUnit.setUnitFromConfig(this.configKey ? this.config.value[this.configKey]["primaryOutputUnit"] : null);
        this.secondaryStateUnit.setUnitFromConfig(this.configKey ? this.config.value[this.configKey]["secondaryUnit"] : null);

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

        this.extractUnitsFromStates(stateObjPrimaryInput, stateObjPrimaryOutput, stateObjSecondary);

        //If not datepicker is used, directly pull data from hass state
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
            this.secondaryState = Number(stateObjSecondary.state);
        }

        //Otherwise get accumulated states from hass webservice if datepicker is used
        if (stateObjPrimaryInput && this.primaryUsesDatePicker) {
            var accumulatedStats = await this.getDateSelectedStatisticForEntities([this.primaryInputEntityId]);
            this.primaryStateInput = accumulatedStats && accumulatedStats[0] ? accumulatedStats[0] : 0;
            this.primaryInputAvailable = accumulatedStats && accumulatedStats[0] ? true : false;
        }

        if (stateObjPrimaryOutput && this.primaryUsesDatePicker) {
            var accumulatedStats = await this.getDateSelectedStatisticForEntities([this.primaryOutputEntityId]);
            this.primaryStateOutput = accumulatedStats && accumulatedStats[0] ? accumulatedStats[0] : 0;
            this.primaryOutputAvailable = accumulatedStats && accumulatedStats[0] ? true : false;
        }

        if (stateObjSecondary && this.secondaryUsesDatePicker) {
            var accumulatedStats = await this.getDateSelectedStatisticForEntities([this.secondaryEntityId]);
            this.secondaryState = accumulatedStats && accumulatedStats[0] ? accumulatedStats[0] : 0;
            this.secondaryAvailable = accumulatedStats && accumulatedStats[0] ? true : false;
        }

        this.onUpdated.value = this.onUpdated.value++;
    }

    private extractUnitsFromStates(primaryInput: any, primaryOutput: any, secondary: any) {
        console.log("ExtractUnitsFromHass", [primaryInput, primaryOutput, secondary]);
        this.primaryStateInputUnit.setUnitFromHass(primaryInput ? primaryInput['attributes'] ? primaryInput['attributes']['unit_of_measurement'] : null : null);
        this.primaryStateOutputUnit.setUnitFromHass(primaryOutput ? primaryOutput['attributes'] ? primaryOutput['attributes']['unit_of_measurement'] : null : null);
        this.secondaryStateUnit.setUnitFromHass(secondary ? secondary['attributes'] ? secondary['attributes']['unit_of_measurement'] : null : null);
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


    public getPrimaryInputState(): ElectricityState | GeneralState {
        var result;

        try {
            result = this.primaryStateInputUnit.thresholdIfElectricity(this.primaryStateInput, this.primaryInputAvailable, this.kiloThreshold, this.megaThreshold, this.gigaThreshold);
        }
        catch {
            result = { value: NaN, unit: "Wrong unit", available: false };
        }

        return result;
    }

    public getPrimaryOutputState(): ElectricityState | GeneralState {
        var result;

        try {
            result = this.primaryStateOutputUnit.thresholdIfElectricity(this.primaryStateOutput, this.primaryOutputAvailable, this.kiloThreshold, this.megaThreshold, this.gigaThreshold);
        }
        catch {
            result = { value: NaN, unit: "Wrong unit", available: false };
        }

        return result;
    }

    public getSecondaryState(): ElectricityState | GeneralState {
        if (this.secondaryEntityId == null) {
            return null;
        }

        var result;

        try {
            result = this.secondaryStateUnit.thresholdIfElectricity(this.secondaryState, this.secondaryAvailable, this.kiloThreshold, this.megaThreshold, this.gigaThreshold);
        }
        catch {
            result = { value: Math.round(this.secondaryState * 10) / 10, unit: this.secondaryStateUnit.getUnitString(), available: this.secondaryAvailable };
        }

        return result;

    }

    public getSolarColor(): any {
        return this.solarColor;
    }

    public getGridColor(): any {
        return this.gridColor;
    }

    public getBatteryColor(): any {
        return this.batteryColor;
    }

    public getColorOverride(): any {
        return this.colorOverride;
    }

    public getIcon(): any {
        return this.haIcon;
    }

    public getNodeTypeDescription(): any {
        return { isSolar: this.isSolar, isGrid: this.isGrid, isBattery: this.isBattery, isHome: this.isHome, isSubHome: this.isSubHome };
    }
}

export class SolarEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>) {
        super(config, hass, energySelection, "solar");
        this.isSolar = true;
        ElectricityEntity.Solar = this;
    }
}

export class GridEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>) {
        super(config, hass, energySelection, "grid");
        this.isGrid = true;
        ElectricityEntity.Grid = this;
    }
}

export class BatteryEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>) {
        super(config, hass, energySelection, "battery");
        this.isBattery = true;
        ElectricityEntity.Battery = this;
    }
}

export class HomeEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>) {
        super(config, hass, energySelection, "home");
        this.isHome = true;
        ElectricityEntity.Home = this;
    }

    public getPrimaryInputState(): ElectricityState | GeneralState {
        if (this.primaryInputEntityId != null) {
            return super.getPrimaryInputState();
        }

        if (!ElectricityEntity.Grid || !ElectricityEntity.Solar || !ElectricityEntity.Battery) {
            return { value: NaN, unit: "", available: false };
        }

        var sum = 0;

        var gridInput = ElectricityEntity.Grid.getPrimaryInputState();
        var gridOutput = ElectricityEntity.Grid.getPrimaryOutputState();
        var solarOutput = ElectricityEntity.Solar.getPrimaryOutputState();
        var batteryOutput = ElectricityEntity.Battery.getPrimaryOutputState();
        var batteryInput = ElectricityEntity.Battery.getPrimaryInputState();

        var gridInputUnit = new StateUnit();
        gridInputUnit.setUnitFromConfig(gridInput.unit);
        var gridOutputUnit = new StateUnit();
        gridOutputUnit.setUnitFromConfig(gridOutput.unit);
        var solarUnit = new StateUnit();
        solarUnit.setUnitFromConfig(solarOutput.unit);
        var batteryOutputUnit = new StateUnit();
        batteryOutputUnit.setUnitFromConfig(batteryOutput.unit);
        var batteryInputUnit = new StateUnit();
        batteryInputUnit.setUnitFromConfig(batteryInput.unit);

        if (!Number.isNaN(gridOutput.value) && !Number.isNaN(solarOutput.value) && !Number.isNaN(batteryOutput.value)) {
            sum += gridOutputUnit.convertToBaseUnit(gridOutput.value);
            sum += solarUnit.convertToBaseUnit(solarOutput.value);
            sum += batteryOutputUnit.convertToBaseUnit(batteryOutput.value);
            sum -= batteryInputUnit.convertToBaseUnit(batteryInput.value);
            sum -= gridInputUnit.convertToBaseUnit(gridInput.value);

            var unit = new StateUnit();

            try {
                if (gridOutputUnit.isPower())
                    unit.setUnitFromConfig(ElectricityUnit.W);
                else
                    unit.setUnitFromConfig(ElectricityUnit.Wh);

                return unit.thresholdIfElectricity(sum, true, this.kiloThreshold, this.megaThreshold, this.gigaThreshold);
            }
            catch {
                return { value: NaN, unit: "", available: false };
            }
        }

        return { value: NaN, unit: "", available: true };
    }
}

export class SubHomeEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, configKey: string) {
        super(config, hass, energySelection, configKey);
        this.isSubHome = true;
    }
}

