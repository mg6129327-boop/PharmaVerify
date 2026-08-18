const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const medicineRoutes = require("./routes/medicineRoutes");
const { startMedicineSyncJob } = require("./jobs/medicineSyncJob");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "PharmaVerify Backend is Running",
    });
});

app.use("/api/medicine", medicineRoutes);

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");

        startMedicineSyncJob();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });