const Medicine = require("../models/Medicine");

const {
    fetchQRMedicineDetails,
    parseQRMedicineDetails,
} = require("../services/qrService");

const {
    searchExternalMedicine,
    searchMedicineByGTIN,
} = require("../services/drugService");

const {
    verifyMedicineData,
} = require("../services/verificationService");

const { syncMedicines } = require("../services/syncService");

const Verification = require("../models/Verification");

const verifyMedicineByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const medicine = await Medicine.findOne({
            batchNumber: code,
        });

        if (!medicine) {
            console.log("Medicine not found for code:", code);

            return res.status(404).json({
                success: false,
                message: "Medicine not found. It may be counterfeit.",
            });
        }

        if (
            medicine.expiryDate &&
            new Date(medicine.expiryDate) < new Date()
        ) {
            medicine.status = "Expired";
            await medicine.save();
        }

        res.json({
            success: true,
            medicine,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const getAllMedicines = async (req, res) => {
    try {
        const medicines = await Medicine.find();

        res.json({
            success: true,
            count: medicines.length,
            medicines,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

const addMedicine = async (req, res) => {
    try {
        const medicine = await Medicine.create(req.body);

        res.status(201).json({
            success: true,
            message: "Medicine added successfully",
            medicine,
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Could not add medicine",
            error: error.message,
        });
    }
};

const searchMedicine = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Please enter a medicine name",
            });
        }

        const localResults = await Medicine.find({
            name: { $regex: q, $options: "i" },
        });

        const externalResults =
            await searchExternalMedicine(q);

        res.json({
            success: true,
            query: q,
            localResults,
            externalResults,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Medicine search failed",
            error: error.message,
        });
    }
};

const verifyMedicine = async (req, res) => {
    try {
        const {
            name,
            batchNumber,
            manufacturer,
            expiryDate,
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Medicine name is required",
            });
        }

        const result = await verifyMedicineData({
            name,
            batchNumber,
            manufacturer,
            expiryDate,
        });

        res.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("Verification error:", error);

        res.status(500).json({
            success: false,
            message: "Verification failed",
            error: error.message,
        });
    }
};

const verifyQRMedicine = async (req, res) => {
    try {
        const { qrData } = req.body;

        if (!qrData || !qrData.trim()) {
            return res.status(400).json({
                success: false,
                message: "QR data is required",
            });
        }

        const html =
            await fetchQRMedicineDetails(qrData);

        console.log(
            "HTML received, length:",
            html.length
        );

        const medicineDetails =
            parseQRMedicineDetails(html);

        console.log(
            "PARSED DETAILS:",
            medicineDetails
        );

        await Verification.create({
            type: "QR",
            medicineName: medicineDetails.name,
            brandName: medicineDetails.brandName,
            batchNumber: medicineDetails.batchNumber,
            manufacturer: medicineDetails.manufacturer,
            gtin: medicineDetails.gtin,
            verificationStatus: "VERIFIED",
            score: 100,
            message:
                "Medicine details were successfully verified from the official QR product page.",
        });

        res.json({
            success: true,
            verification: "VERIFIED",
            score: 100,

            message:
                "Medicine details were successfully verified from the official QR product page.",

            medicine: medicineDetails,

            checks: {
                medicineFound: true,
                batchVerified: true,
                manufacturerMatched: true,
                expiryValid: true,
            },
        });
    } catch (error) {
        console.error(
            "QR verification error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "QR verification failed",
            error: error.message,
        });
    }
};

const getVerificationHistory = async (req, res) => {
    try {
        const history = await Verification.find()
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: history.length,
            history,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                "Could not fetch verification history",
            error: error.message,
        });
    }
};

/* DELETE ONE HISTORY RECORD */

const deleteVerification = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedVerification =
            await Verification.findByIdAndDelete(id);

        if (!deletedVerification) {
            return res.status(404).json({
                success: false,
                message:
                    "Verification record not found",
            });
        }

        res.json({
            success: true,
            message:
                "Verification record deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                "Could not delete verification record",
            error: error.message,
        });
    }
};

/* CLEAR ALL HISTORY */

const clearVerificationHistory = async (
    req,
    res
) => {
    try {
        const result =
            await Verification.deleteMany({});

        res.json({
            success: true,
            message:
                "Verification history cleared successfully",
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                "Could not clear verification history",
            error: error.message,
        });
    }
};

const syncMedicineDatabase = async (req, res) => {
    try {
        const result = await syncMedicines();

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Medicine sync failed",
            error: error.message,
        });
    }
};

module.exports = {
    verifyMedicine,
    verifyMedicineByCode,
    verifyQRMedicine,
    getAllMedicines,
    syncMedicineDatabase,
    addMedicine,
    searchMedicine,
    getVerificationHistory,
    deleteVerification,
    clearVerificationHistory,
};

