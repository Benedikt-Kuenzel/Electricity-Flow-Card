import { ElectricityState } from "./ElectricityEntity";

export enum ElectricityUnit {
    Wh = "Wh",
    kWh = "kWh",
    MWh = "MWh",
    GWh = "GWh",
    W = "W",
    kW = "kW",
    MW = "MW",
    GW = "GW"
}

export class StateUnit {
    private UnitFromHass: any = null;
    private UnitFromConfig: any = null;

    public setUnitFromHass(UnitFromHass: any) {
        this.UnitFromHass = UnitFromHass;
    }

    public setUnitFromConfig(UnitFromConfig: any) {
        this.UnitFromConfig = UnitFromConfig;
    }

    public isElectricity(): boolean {
        if (this.UnitFromConfig != null && this.UnitFromConfig != undefined)
            return this.UnitFromConfig in ElectricityUnit;

        return this.UnitFromHass in ElectricityUnit;
    }

    public getUnit(): ElectricityUnit {
        if (!this.isElectricity()) {
            throw "Is Not Electricity";
        }

        return this.UnitFromConfig ? this.UnitFromConfig as ElectricityUnit : this.UnitFromHass as ElectricityUnit;
    }

    public getUnitString(): string {
        return this.UnitFromConfig ? String(this.UnitFromConfig) : String(this.UnitFromHass);
    }

    public thresholdIfElectricity(value: number, available: boolean, kiloThreshold: any, megaThreshold: any, gigaThreshold: any): ElectricityState {
        if (!this.isElectricity()) {
            throw "Is Not Electricity";
        }

        var result: number;
        var unit: ElectricityUnit;
        value = this.convertToBaseUnit(value);

        if (value > gigaThreshold) {
            result = value / 1000000000;
            unit = this.isPower() ? ElectricityUnit.GW : ElectricityUnit.GWh;
        }
        else if (value > megaThreshold) {
            result = value / 1000000;
            unit = this.isPower() ? ElectricityUnit.MW : ElectricityUnit.MWh;
        }
        else if (value > kiloThreshold) {
            result = value / 1000;
            unit = this.isPower() ? ElectricityUnit.kW : ElectricityUnit.kWh;
        }
        else {
            result = value;
            unit = this.isPower() ? ElectricityUnit.W : ElectricityUnit.Wh;
        }

        //At most one decimal place
        result = Math.round(result * 10) / 10;

        return { value: result, unit: unit, available: true };
    }

    public isPower(): boolean {
        if (!this.isElectricity()) {
            throw "Is Not Electricity";
        }

        var unit = this.getUnit();

        return unit == ElectricityUnit.GW || unit == ElectricityUnit.MW || unit == ElectricityUnit.kW || unit == ElectricityUnit.W;
    }

    private convertToBaseUnit(value: number): number {
        if (!this.isElectricity()) {
            throw "Is Not Electricity";
        }

        var unit: ElectricityUnit = this.getUnit();

        switch (unit) {
            case ElectricityUnit.Wh:
                return value;
            case ElectricityUnit.kWh:
                return value * 1000;
            case ElectricityUnit.MWh:
                return value * 1000000;
            case ElectricityUnit.GWh:
                return value * 1000000000;
            case ElectricityUnit.W:
                return value
            case ElectricityUnit.kW:
                return value * 1000;
            case ElectricityUnit.MW:
                return value * 1000000;
            case ElectricityUnit.GW:
                return value * 1000000000;
        }
    }
}