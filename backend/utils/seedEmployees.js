import { readFile } from "node:fs/promises";
import Employee from "../models/employee.model.js";

const CSV_PATH = new URL("../data/employees.csv", import.meta.url);

// CSV header -> Employee field
const COLUMNS = {
    "ID": "employeeId",
    "First Name": "firstName",
    "Last Name": "lastName",
    "Department": "department",
    "Job Title": "jobTitle",
    "Salary": "salary"
};

// Parses the CSV
function parseEmployeesCsv(text) {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
    const headers = lines[0].split(",").map((h) => h.trim());

    for (const header of headers) {
        if (!COLUMNS[header]) throw new Error(`Unknown CSV column: ${header}`);
    }

    return lines.slice(1).map((line, i) => {
        const values = line.split(",").map((v) => v.trim());
        if (values.length !== headers.length) {
            throw new Error(`CSV line ${i + 2} has ${values.length} values, expected ${headers.length}`);
        }
        const employee = {};
        headers.forEach((header, j) => {
            employee[COLUMNS[header]] = values[j];
        });
        employee.salary = Number(employee.salary);
        return employee;
    });
}

// Loads data/employees.csv into MongoDB the first time the app starts.
// Once the collection has data, the CSV is not read again.
export default async function seedEmployees() {
    const count = await Employee.countDocuments();
    if (count > 0) return;

    const text = await readFile(CSV_PATH, "utf8");
    const employees = parseEmployeesCsv(text);
    await Employee.insertMany(employees);
    console.log(`Seeded ${employees.length} employees from employees.csv`);
}
