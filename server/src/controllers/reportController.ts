import {Request, Response} from 'express';
import {QueryResult} from 'pg';
import * as dbUtil from './../utils/dbUtil';

interface Report {
    year: number,
    caregivers: {
        name: string,
        patients: string[]
    }[]
}

export const getReport = async (req: Request, res: Response) => {

    const sql = `
        SELECT
            caregiver.id      AS caregiver_id,
            caregiver.name    AS caregiver_name,
            patient.id        AS patient_id,
            patient.name      AS patient_name,
            visit.date        AS visit_date
        FROM caregiver
        JOIN visit ON visit.caregiver = caregiver.id
        JOIN patient ON patient.id = visit.patient
    `;

    let result: QueryResult;
    try {
        result = await dbUtil.sqlToDB(sql, []);
        const report: Report = {
            year: parseInt(req.params.year),
            caregivers: []
        };

        let caregiversMap = new Map();
        for (let row of result.rows) {
            if (caregiversMap.has(row.caregiver_name)) {
                caregiversMap.get(row.caregiver_name).push(row.patient_name);
            } else {
                caregiversMap.set(row.caregiver_name, [row.patient_name]);
            }
        }
        report.caregivers = Array.from(caregiversMap, item => ({name: item[0], patients: item[1]}))
        res.status(200).json(report);
    } catch (error) {
        throw new Error(error.message);
    }

}
