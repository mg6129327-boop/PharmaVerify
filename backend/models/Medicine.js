const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        batchNumber: {
            type: String,
            sparse: true,
        },
        gtin: {
            type: String,
            sparse: true,
        },
        manufacturer: {
            type: String,
            required: true,
            trim: true,
        },

        manufacturingDate: {
            type: Date,
        },

        expiryDate: {
            type: Date,
        },

        status: {
            type: String,
            default: "Unknown",
        },
        description: {
            type: String,
        },
        applicationNumber: {
            type: String,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Medicine", medicineSchema);