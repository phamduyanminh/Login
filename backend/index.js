import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import router from "./routes/userRoute.js";
import employeeRouter from "./routes/employeeRoute.js";
import seedEmployees from "./utils/seedEmployees.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/users", router);
app.use("/employees", employeeRouter);

// app.get("/", (req, res) => {
//     res.send("Hello World!")
// });

// app.listen(3000, () => {
//     console.log("Server is running on http://localhost:3000")
// });

mongoose
  .connect(process.env.DB)
  .then(async () => {
    console.log("Connected to MongoDB");
    try {
      await seedEmployees();
    } catch (error) {
      console.error("Employee seeding failed", error);
    }
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
  });