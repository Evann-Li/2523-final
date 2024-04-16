import fs from 'fs';
import { Map } from './map';
import { ReportMaker, ComplexReport } from './map';

async function main() {
    try {
        const map = Map.loadFromJSON('data.json', 50);
        const clinicsData = map.getClinicsData();
        const report = new ReportMaker(new ComplexReport(clinicsData));
        report.printDetails();
        console.log("---End of Report---");
        map.printMap();
        console.log("---End of Map---");
    } catch (error) {
        console.error("Error reading or parsing data.json:", error);
    }
}

main();
