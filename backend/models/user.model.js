import mongoose from "mongoose";
import UserRole from "./userRole";

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: UserRole.values(),
        required: true
    }
});

export default mongoose.model("User", userSchema);