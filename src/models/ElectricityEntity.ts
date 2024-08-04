import { Signal } from "@preact/signals-react";
import { ElectricityUnit, StateUnit } from "./ElectricityUnit";
import { HassRegistration, HassService } from "../utilities/hassService"

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
    private hassRegistration: HassRegistration;
    private nodeId: string;

    //To be set by subclasses
    protected isSolar: boolean = false;
    protected isGrid: boolean = false;
    protected isBattery: boolean = false;
    protected isHome: boolean = false;
    protected isSubHome: boolean = false;

    protected childEntities: ElectricityEntity[];
    protected parentEntitiy: ElectricityEntity;

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

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, configKey: string, nodeId: string) {
        this.config = config;
        this.hass = hass;
        this.energySelection = energySelection;
        this.configKey = configKey;
        this.onUpdated = new Signal(0);
        this.nodeId = nodeId;

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

        if (this.hassRegistration) {
            HassService.getInstance().unregister(this.hassRegistration);
        }
        this.hassRegistration = new HassRegistration();

        if (this.primaryInputEntityId != null && this.primaryUsesDatePicker)
            this.hassRegistration.entitiyIdsToFetch.push(this.primaryInputEntityId);
        if (this.primaryOutputEntityId != null && this.primaryUsesDatePicker)
            this.hassRegistration.entitiyIdsToFetch.push(this.primaryOutputEntityId);
        if (this.secondaryEntityId != null && this.secondaryUsesDatePicker)
            this.hassRegistration.entitiyIdsToFetch.push(this.secondaryEntityId);

        this.hassRegistration.onValuesReceivedSignal.subscribe(() => { this.updateStateFromHassWs(); });
        HassService.getInstance().registerForUpdates(this.hassRegistration);

    }

    public clearChildEntities() {
        this.childEntities = [];
    }

    public addChildEntity(childEntity: ElectricityEntity) {
        this.childEntities.push(childEntity);
    }

    public setChildEntities(childEntities: ElectricityEntity[]) {
        this.childEntities = childEntities;
    }

    public setParentEntity(parentEntitiy: ElectricityEntity) {
        this.parentEntitiy = parentEntitiy;
    }

    private updateStateFromHassWs() {
        if (this.primaryInputEntityId != null && this.primaryUsesDatePicker) {
            var accumulatedStats = this.hassRegistration.valueOfEntity(this.primaryInputEntityId);
            this.primaryStateInput = accumulatedStats ? accumulatedStats : 0;
            this.primaryInputAvailable = accumulatedStats ? true : false;
        }

        if (this.primaryOutputEntityId != null && this.primaryUsesDatePicker) {
            var accumulatedStats = this.hassRegistration.valueOfEntity(this.primaryOutputEntityId);
            this.primaryStateOutput = accumulatedStats ? accumulatedStats : 0;
            this.primaryOutputAvailable = accumulatedStats ? true : false;
        }

        if (this.secondaryEntityId != null && this.secondaryUsesDatePicker) {
            var accumulatedStats = this.hassRegistration.valueOfEntity(this.secondaryEntityId);
            this.secondaryState = accumulatedStats ? accumulatedStats : 0;
            this.secondaryAvailable = accumulatedStats ? true : false;
        }

        this.onUpdated.value = this.onUpdated.value++;
    }

    private updateState(): Promise<void> {
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

        this.onUpdated.value = this.onUpdated.value++;
    }

    private extractUnitsFromStates(primaryInput: any, primaryOutput: any, secondary: any) {
        this.primaryStateInputUnit.setUnitFromHass(primaryInput ? primaryInput['attributes'] ? primaryInput['attributes']['unit_of_measurement'] : null : null);
        this.primaryStateOutputUnit.setUnitFromHass(primaryOutput ? primaryOutput['attributes'] ? primaryOutput['attributes']['unit_of_measurement'] : null : null);
        this.secondaryStateUnit.setUnitFromHass(secondary ? secondary['attributes'] ? secondary['attributes']['unit_of_measurement'] : null : null);
    }



    public getNodeId(): string {
        return this.nodeId;
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

    public getElectricityInSystemFromSolarGridAndBattery() {
        if (!ElectricityEntity.Grid || !ElectricityEntity.Solar || !ElectricityEntity.Battery) {
            return { fromGrid: 0, fromSolar: 0, fromBattery: 0 };
        }

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

        if (!Number.isNaN(gridOutput.value) && !Number.isNaN(solarOutput.value) && !Number.isNaN(batteryOutput.value)
            && !Number.isNaN(batteryInput.value) && !Number.isNaN(gridInput.value)) {

            var fromGrid = gridOutputUnit.convertToBaseUnit(gridOutput.value);
            var fromSolar = solarUnit.convertToBaseUnit(solarOutput.value) - gridInputUnit.convertToBaseUnit(gridInput.value) - batteryInputUnit.convertToBaseUnit(batteryInput.value);
            var fromBattery = batteryOutputUnit.convertToBaseUnit(batteryOutput.value);

            return { fromGrid: fromGrid, fromSolar: fromSolar, fromBattery: fromBattery };
        }

        return { fromGrid: 0, fromSolar: 0, fromBattery: 0 };

    }

    public static getElectricityFlowRate(From: ElectricityEntity, To: ElectricityEntity) {

        if (!From.isSubHome && !To.isSubHome) {
            var flowRates = ElectricityEntity.getElectricityFlowRatesForBaseSystem();

            if (From.isGrid) {
                if (To.isBattery)
                    return flowRates.gridToBattery;
                if (To.isHome)
                    return flowRates.gridToHome;
                if (To.isSolar)
                    return -flowRates.solarToGrid;
            }
            if (From.isBattery) {
                if (To.isGrid)
                    return -flowRates.gridToBattery;
                if (To.isHome)
                    return flowRates.batteryToHome;
                if (To.isSolar)
                    return -flowRates.solarToBattery;

            }
            if (From.isSolar) {
                if (To.isGrid)
                    return flowRates.solarToGrid;
                if (To.isBattery)
                    return flowRates.solarToBattery;
                if (To.isHome)
                    return flowRates.solarToHome;
            }
            if (From.isHome) {
                if (To.isGrid)
                    return -flowRates.gridToHome;
                if (To.isBattery)
                    return - flowRates.batteryToHome;
                if (To.isSolar)
                    return - flowRates.solarToHome;
            }
        }

        if (To.isSubHome) {
            try {
                var fromInput = From.getPrimaryInputState();
                var fromInputUnit = new StateUnit();
                if (Number.isNaN(fromInput.value))
                    return 0;

                fromInputUnit.setUnitFromConfig(fromInput.unit);
                var fromInputBaseValue = fromInputUnit.convertToBaseUnit(fromInput.value);

                var toInput = To.getPrimaryInputState();
                var toInputUnit = new StateUnit();
                if (Number.isNaN(toInput.value) || toInput.value == 0)
                    return 0;


                toInputUnit.setUnitFromConfig(toInput.unit);

                var toInputBaseValue = toInputUnit.convertToBaseUnit(toInput.value);

                return toInputBaseValue / fromInputBaseValue;

            }
            catch {
                return 0;
            }

        }
    }

    public static getElectricityFlowRatesForBaseSystem() {
        var flowRates = { gridToHome: 0, gridToBattery: 0, solarToGrid: 0, solarToBattery: 0, solarToHome: 0, batteryToHome: 0 };

        if (!ElectricityEntity.Grid || !ElectricityEntity.Solar) {
            return flowRates;
        }

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


        //TODO: We're assuming the battery is only charged by solar and multiple other things, sigh...
        //If we have an electricity meter for home consumption, this can be calculated differently
        //Especially for users who only have a battery for arbitrage!
        if (!Number.isNaN(gridOutput.value) && !Number.isNaN(solarOutput.value) && !Number.isNaN(batteryOutput.value)
            && !Number.isNaN(batteryInput.value) && !Number.isNaN(gridInput.value)) {

            var totalElectricity = gridOutputUnit.convertToBaseUnit(gridOutput.value) + solarUnit.convertToBaseUnit(solarOutput.value);

            var gridToHome = gridOutputUnit.convertToBaseUnit(gridOutput.value);
            var batteryToHome = batteryOutputUnit.convertToBaseUnit(batteryOutput.value);
            var solarToHome = solarUnit.convertToBaseUnit(solarOutput.value) - gridInputUnit.convertToBaseUnit(gridInput.value) - batteryInputUnit.convertToBaseUnit(batteryInput.value);
            var solarToGrid = gridInputUnit.convertToBaseUnit(gridInput.value);
            var solarToBattery = batteryInputUnit.convertToBaseUnit(batteryInput.value);
            var gridToBattery = 0;

            gridToHome /= totalElectricity;
            batteryToHome /= totalElectricity;
            solarToHome /= totalElectricity;
            solarToGrid /= totalElectricity;
            solarToBattery /= totalElectricity;
            gridToBattery /= totalElectricity;

            flowRates.gridToHome = gridToHome;
            flowRates.batteryToHome = batteryToHome;
            flowRates.solarToHome = solarToHome;
            flowRates.solarToGrid = solarToGrid;
            flowRates.solarToBattery = solarToBattery;
            flowRates.gridToBattery = gridToBattery;
        }

        return flowRates;

    }

    public getParentEntity(): ElectricityEntity {
        return this.parentEntitiy;
    }

    public getChildEntities(): ElectricityEntity[] {
        return this.childEntities;
    }

    public getConfigKey(): string {
        return this.configKey;
    }

    public getSolarColor(): any {
        if (ElectricityEntity.Solar?.colorOverride) {
            return ElectricityEntity.Solar.colorOverride;
        }

        return this.solarColor;
    }

    public getGridColor(): any {
        if (ElectricityEntity.Grid?.colorOverride) {
            return ElectricityEntity.Grid.colorOverride;
        }

        return this.gridColor;
    }

    public getBatteryColor(): any {
        if (ElectricityEntity.Battery?.colorOverride) {
            return ElectricityEntity.Battery.colorOverride;
        }

        return this.batteryColor;
    }

    public hasPrimaryInputDefined(): boolean {
        return this.primaryInputEntityId != null;
    }

    public hasPrimaryOutputDefined(): boolean {
        return this.primaryOutputEntityId != null;
    }

    public getColorOverride(): any {
        return this.colorOverride;
    }

    public static getInboundColor(From: ElectricityEntity) {
        if (From.isBattery) {
            return From.getBatteryColor();
        }
        if (From.isGrid) {
            return From.getGridColor();
        }
        if (From.isSolar) {
            return From.getSolarColor();
        }

        return From.getColorOverride() ? From.getColorOverride() : "pink";
    }

    public getIcon(): any {
        return this.haIcon;
    }

    public getNodeTypeDescription(): any {
        return { isSolar: this.isSolar, isGrid: this.isGrid, isBattery: this.isBattery, isHome: this.isHome, isSubHome: this.isSubHome };
    }
}

export class SolarEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, nodeId: string) {
        super(config, hass, energySelection, "solar", nodeId);
        this.isSolar = true;
        ElectricityEntity.Solar = this;
    }
}

export class GridEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, nodeId: string) {
        super(config, hass, energySelection, "grid", nodeId);
        this.isGrid = true;
        ElectricityEntity.Grid = this;
    }
}

export class BatteryEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, nodeId: string) {
        super(config, hass, energySelection, "battery", nodeId);
        this.isBattery = true;
        ElectricityEntity.Battery = this;
    }
}

export class HomeEntity extends ElectricityEntity {

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, nodeId: string) {
        super(config, hass, energySelection, "home", nodeId);
        this.isHome = true;
        ElectricityEntity.Home = this;
    }

    public setChildEntities(childEntities: ElectricityEntity[]) {
        this.childEntities = childEntities;
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

        if (!Number.isNaN(gridOutput.value) && !Number.isNaN(solarOutput.value) && !Number.isNaN(batteryOutput.value)
            && !Number.isNaN(batteryInput.value) && !Number.isNaN(gridInput.value)) {

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

    constructor(config: Signal<unknown>, hass: Signal<unknown>, energySelection: Signal<unknown>, configKey: string, nodeId: string) {
        super(config, hass, energySelection, configKey, nodeId);
        this.isSubHome = true;
    }

    public setChildEntities(childEntities: SubHomeEntity[]) {
        this.childEntities = childEntities;
    }

    public setParentEntity(parentEntitiy: HomeEntity) {
        this.parentEntitiy = parentEntitiy;
    }


    public getPrimaryInputState(): ElectricityState | GeneralState {
        if (this.primaryInputEntityId != null) {
            return super.getPrimaryInputState();
        }
        try {
            //if we dont have a primary input defined, we can calulate it if all other siblings have one defined

            //first we're making sure we don't self refrence here when calculating our own use
            var everySiblingHasPrimary = true;

            this.parentEntitiy.getChildEntities().forEach(child => {
                if (child != this && !child.hasPrimaryInputDefined())
                    everySiblingHasPrimary = false;
            });

            if (!everySiblingHasPrimary) {
                return { value: NaN, unit: "", available: false };
            }

            var sumOfSiblings = 0;
            var isAvailable = true;
            var isPower = false;

            this.parentEntitiy.getChildEntities().forEach(child => {
                if (child != this) {
                    var input = child.getPrimaryInputState();

                    if (Number.isNaN(input.value)) {
                        isAvailable = false;
                        return;
                    }

                    var unit = new StateUnit();
                    unit.setUnitFromConfig(input.unit);
                    sumOfSiblings += unit.convertToBaseUnit(input.value);
                    isPower = unit.isPower();
                }
            });

            if (!isAvailable) {
                return { value: NaN, unit: "", available: false };
            }

            var parentInput = this.parentEntitiy.getPrimaryInputState();
            var parentUnit = new StateUnit();
            parentUnit.setUnitFromConfig(parentInput.unit);
            var ownSum = parentUnit.convertToBaseUnit(parentInput.value) - sumOfSiblings;

            try {
                var unit = new StateUnit();

                if (isPower)
                    unit.setUnitFromConfig(ElectricityUnit.W);
                else
                    unit.setUnitFromConfig(ElectricityUnit.Wh);

                return unit.thresholdIfElectricity(ownSum, true, this.kiloThreshold, this.megaThreshold, this.gigaThreshold);
            }
            catch {
                return { value: NaN, unit: "", available: false };
            }
        }
        catch {
            return { value: NaN, unit: "", available: false };
        }
    }
}

