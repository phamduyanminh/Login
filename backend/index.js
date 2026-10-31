import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import router from "./routes/userRoute.js";

const app = express();
app.use(express.json());
app.use("/users", router);

// app.get("/", (req, res) => {
//     res.send("Hello World!")
// });

// app.listen(3000, () => {
//     console.log("Server is running on http://localhost:3000")
// });

mongoose
  .connect(process.env.DB)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
  });