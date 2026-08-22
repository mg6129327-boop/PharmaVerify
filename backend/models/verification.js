const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["QR", "BARCODE", "MANUAL"],
      required: true,
    },


    medicineName: {
      type: String,
    },

    brandName: {
      type: String,
    },

    batchNumber: {
      type: String,
    },

    manufacturer: {
      type: String,
    },

    gtin: {
      type: String,
    },

    barcode: {
      type: String,
    },

    source: {
      type: String,
    },

    verificationStatus: {
      type: String,
      required: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }


);

module.exports = mongoose.model(
  "Verification",
  verificationSchema
);
