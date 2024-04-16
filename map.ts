import fs from 'fs';

interface Inhabitant {
    phn: string;
    fullName: string;
    isVaccinated: boolean;
    age: number;
}

interface Household {
    blockNum: number;
    inhabitants: Inhabitant[];
}

interface Clinic {
    name: string;
    blockNum: number;
    staff: number;
    queue: Inhabitant[];
    enqueue(person: Inhabitant): void;
    dequeue(): Inhabitant | undefined;
    size(): number;
    getCurrentWaitTime(): number;
}

interface CityData {
    [cityName: string]: {
        households: Household[];
        clinics: Clinic[];
    };
}

interface IReport {
    printDetails(): void;
}

interface ISimpleReport extends IReport {
    printDetails(): void;
}

interface IComplexReport extends IReport {
    printDetails(): void;
}


class Clinic implements Clinic {
    name: string;
    blockNum: number;
    staff: number;
    queue: Inhabitant[];

    constructor(name: string, blockNum: number, staff: number) {
        this.name = name;
        this.blockNum = blockNum;
        this.staff = staff;
        this.queue = [];
    }

    enqueue(person: Inhabitant): void {
        this.queue.push(person);
    }

    dequeue(): Inhabitant | undefined {
        return this.queue.shift();
    }

    size(): number {
        return this.queue.length;
    }

    getCurrentWaitTime(): number {
        return this.size() * 15; // 1 person in Queue = 15 min
    }
}

class SimpleReport implements ISimpleReport {
    constructor(private clinics: Clinic[]) {}

    printDetails() {
        console.log("Simple Report:");
        this.clinics.forEach(clinic => {
            console.log(`${clinic.name} - ${clinic.size()} People In Lineup`);
        });
    }
}

class ComplexReport implements IComplexReport {
    constructor(private clinics: Clinic[]) {}

    printDetails() {
        console.log("Complex Report:");
        this.clinics.forEach(clinic => {
            console.log(`Average Wait Time at ${clinic.name}: ${clinic.getCurrentWaitTime()} min`);
            console.log(`${clinic.name} - ${clinic.size()} People In Lineup`);
        });
    }
}

class ReportMaker {
    constructor(private report: IReport) {}

    printDetails() {
        this.report.printDetails();
    }
}


class Map {
    private _mapData: CityData;
    private _currentIntake: number;

    constructor(mapData: CityData, currentIntake: number) {
        this._mapData = mapData;
        this._currentIntake = currentIntake;
    }

    static loadFromJSON(filePath: string, currentIntake: number): Map {
        try {
            const jsonData = fs.readFileSync(filePath, 'utf-8');
            const mapData: CityData = JSON.parse(jsonData);
            return new Map(mapData, currentIntake);
        } catch (error) {
            console.error('Error reading or parsing data.json:', error);
            process.exit(1);
        }
    }
    
    printMap() {
        for (const cityName in this._mapData) {
            const city = this._mapData[cityName];
            const householdBlocks = (city.households || []).map(household => household.blockNum);
            const clinicBlocks = (city.clinics || []).map(clinic => clinic.blockNum);
            const allBlocks = [...householdBlocks, ...clinicBlocks];
            
            const maxBlock = Math.max(...allBlocks, 0);
    
            const blocks = new Array(maxBlock + 1).fill('x');
    
            (city.households || []).forEach(household => {
                blocks[household.blockNum] = household.inhabitants.every(inhabitant => inhabitant.isVaccinated) ? 'F' : 'H';
            });
    
            (city.clinics || []).forEach(clinic => {
                blocks[clinic.blockNum] = 'C';
            });
            
            console.log(`${blocks.join(',')} // ${cityName}`);
        }
    }
    
    registerForShots(currentIntake: number) {
        for (const cityName in this._mapData) {
            const city = this._mapData[cityName];
            const households = city.households || [];
            for (const household of households) {
                for (const inhabitant of household.inhabitants) {
                    if (!inhabitant.isVaccinated && inhabitant.age >= currentIntake) {
                        const nearestClinic = this.findNearestClinic(city.clinics, household.blockNum);
                        if (nearestClinic) {
                            nearestClinic.enqueue(inhabitant);
                            inhabitant.isVaccinated = true;
                            console.log(`${inhabitant.fullName} added to queue at ${nearestClinic.name}`);
                            if (household.inhabitants.every(inhabitant => inhabitant.isVaccinated)) {
                                console.log(`All members of household at block ${household.blockNum} in ${cityName} are vaccinated.`);
                            }
                        } else {
                            console.log(`No clinics available near household at block ${household.blockNum} in ${cityName}`);
                        }
                    }
                }
            }
        }
    }
    
    private findNearestClinic(clinics: Clinic[], blockNum: number): Clinic | undefined {
        if (clinics.length === 0) return undefined;
        return clinics.reduce((nearest, clinic) => {
            return Math.abs(clinic.blockNum - blockNum) < Math.abs(nearest.blockNum - blockNum) ? clinic : nearest;
        });
    }

    getClinicsData() {
        const clinicsData = [];
        for (const cityName in this._mapData) {
            const city = this._mapData[cityName];
            const clinics = city.clinics || [];
            clinicsData.push(...clinics);
        }
        return clinicsData;
    }
    
}

export { Map, ReportMaker, SimpleReport, ComplexReport };