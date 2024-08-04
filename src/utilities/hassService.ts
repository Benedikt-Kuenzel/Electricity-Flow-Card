import { Signal } from "@preact/signals-react";
import { addHours, differenceInDays } from 'date-fns';
import { Statistics, StatisticValue } from "../models/ElectricityEntity";

export class HassRegistration {
    public onValuesReceivedSignal: Signal<number[]> = new Signal<number[]>();
    public entitiyIdsToFetch: string[] = [];

    public valueOfEntity(entityId: string): number {
        var index = this.entitiyIdsToFetch.findIndex(x => x == entityId);
        if (index != -1 && this.onValuesReceivedSignal.value)
            return this.onValuesReceivedSignal.value[index];
        return -1;
    }
}

export class HassService {

    private static instance: HassService = null;
    private hassSignal: Signal<unknown>
    private hassRegistrations: HassRegistration[] = [];
    private energySelection: Signal<unknown>;

    private constructor(hassSignal: Signal<unknown>, energySelection: Signal<unknown>) {
        this.hassSignal = hassSignal;
        this.energySelection = energySelection;

        this.hassSignal.subscribe(() => { this.collectValuesAndNotify(); });
    }

    public static createService(hassSignal: Signal<unknown>, energySelection: Signal<unknown>): HassService {
        if (this.instance != null) {
            return this.instance;
        }

        this.instance = new HassService(hassSignal, energySelection);
        return this.instance;
    }

    public static getInstance(): HassService {
        return this.instance;
    }

    public registerForUpdates(registration: HassRegistration) {
        this.hassRegistrations.push(registration);
    }

    public unregister(registration: HassRegistration) {
        var index = this.hassRegistrations.findIndex(x => x == registration);
        if (index != -1)
            this.hassRegistrations.splice(index, 1);
    }

    private async collectValuesAndNotify() {
        var entityIdsToRetrieve: string[] = [];

        this.hassRegistrations.forEach(registration => {
            registration.entitiyIdsToFetch.forEach(entityId => {
                if (!entityIdsToRetrieve.find(x => x == entityId)) {
                    entityIdsToRetrieve.push(entityId);
                }
            })
        });

        this.getDateSelectedStatisticForEntities(entityIdsToRetrieve)
            .then(retrieved => {
                this.hassRegistrations.forEach(registration => {
                    var results: number[] = [];
                    registration.entitiyIdsToFetch.forEach(entityId => {
                        if (retrieved && retrieved[entityId] && retrieved[entityId].length > 0 && retrieved[entityId][0] != null && retrieved[entityId][retrieved[entityId].length - 1] != null) {
                            var totalIncrease: number = retrieved[entityId][retrieved[entityId].length - 1].sum - retrieved[entityId][0].sum;
                            results.push(totalIncrease);
                        }
                        else {
                            results.push(0);
                        }
                    });

                    registration.onValuesReceivedSignal.value = results;
                })
            });
    }

    private async getDateSelectedStatisticForEntities(entitiyIds: string[]): Promise<Statistics> {
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

        return result;
    }

    private async fetchStatistics(startTime: Date, endTime?: Date, period?: string, statistic_ids?: string[]): Promise<Statistics> {
        return (<any>this.hassSignal.value).callWS({
            type: 'recorder/statistics_during_period',
            start_time: startTime.toISOString(),
            end_time: endTime?.toISOString(),
            statistic_ids,
            period
        }) as Statistics;
    }


}