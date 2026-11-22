import { Router } from 'express';
import mongoose from 'mongoose';
import Employee from '../models/employee.model.js';
import UserRole from '../models/userRole.js';
import { loadCurrentRole, requireRole } from '../middleware/auth.js';

const router = Router();

const PUBLIC_FIELDS = 'employeeId firstName lastName department jobTitle';
const ADMIN_FIELDS = `${PUBLIC_FIELDS} salary`;
const TEXT_FIELDS = ['firstName', 'lastName', 'department', 'jobTitle'];
const MAX_TEXT_LENGTH = 100;

// GET all employees (only admin can see salary)
router.get("/", loadCurrentRole, async (req, res) => {
    const fields = req.user.role === UserRole.ADMIN ? ADMIN_FIELDS : PUBLIC_FIELDS;
    try {
        const employees = await Employee.find({}, fields).sort({department: 1, employeeId: 1});
        return res.json({employees});
    } catch (error) {
        console.error('List employees error: ', error);
        return res.status(500).json({error: 'Could not load employees!'});
    }
});

// PATCH an employee (admin only)
router.patch("/:id", requireRole(UserRole.ADMIN), async (req, res) => {
    const {id} = req.params;
    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({error: 'Invalid employee id!'});
    }

    const update = {};
    for (const field of TEXT_FIELDS) {
        const value = req.body[field];
        if (typeof value !== 'string' || value.trim() === '') {
            return res.status(400).json({error: 'Name, department and job title are required!'});
        }
        if (value.trim().length > MAX_TEXT_LENGTH) {
            return res.status(400).json({error: `Fields must be ${MAX_TEXT_LENGTH} characters or fewer!`});
        }
        update[field] = value.trim();
    }

    const salary = req.body.salary;
    if (typeof salary !== 'number' || !Number.isFinite(salary) || salary < 0) {
        return res.status(400).json({error: 'Salary must be a number of 0 or more!'});
    }
    update.salary = Math.round(salary);

    try {
        const employee = await Employee.findByIdAndUpdate(
            id,
            update,
            {returnDocument: 'after', runValidators: true, projection: ADMIN_FIELDS}
        );
        if (!employee) {
            return res.status(404).json({error: 'Employee not found!'});
        }
        return res.json({employee});
    } catch (error) {
        console.error('Update employee error: ', error);
        return res.status(500).json({error: 'Could not update the employee!'});
    }
});

export default router;
