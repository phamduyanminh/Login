import mongoose from "mongoose";

const requiredText = {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
};

const employeeSchema = new mongoose.Schema({
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    firstName: requiredText,
    lastName: requiredText,
    department: requiredText,
    jobTitle: requiredText,
    salary: {
        type: Number,
        required: true,
        min: 0
    }
});

export default mongoose.model("Employee", employeeSchema);
