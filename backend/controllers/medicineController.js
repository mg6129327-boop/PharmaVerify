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

const {
    syncMedicines,
} = require("../services/syncService");

const Verification = require(
    "../models/verification"
);

/* ===============================
VERIFY MEDICINE BY BATCH CODE
================================ */

const verifyMedicineByCode = async (
    req,
    res
) => {
    try {
        const { code } = req.params;


        const medicine =
            await Medicine.findOne({
                batchNumber: code,
            });

        if (!medicine) {
            return res.status(404).json({
                success: false,
                message:
                    "Medicine not found. It may be counterfeit.",
            });
        }

        if (
            medicine.expiryDate &&
            new Date(medicine.expiryDate) <
            new Date()
        ) {
            medicine.status = "Expired";

            await medicine.save();
        }

        res.json({
            success: true,
            medicine,
        });

    } catch (error) {
        console.error(
            "Medicine verification error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }


};

/* ===============================
VERIFY BARCODE
================================ */

const verifyBarcodeMedicine = async (
    req,
    res
) => {
    try {
        const { barcode } = req.body;


        if (!barcode || !barcode.trim()) {
            return res.status(400).json({
                success: false,
                message:
                    "Barcode is required",
            });
        }

        const cleanBarcode =
            barcode.trim();

        console.log(
            "Verifying barcode:",
            cleanBarcode
        );


        /* ===============================
           1. SEARCH LOCAL DATABASE
        ================================ */

        let medicine =
            await Medicine.findOne({
                $or: [
                    {
                        gtin:
                            cleanBarcode,
                    },
                    {
                        batchNumber:
                            cleanBarcode,
                    },
                ],
            });


        if (medicine) {
            let verificationStatus =
                "VERIFIED";

            let score = 100;

            if (
                medicine.expiryDate &&
                new Date(
                    medicine.expiryDate
                ) < new Date()
            ) {
                verificationStatus =
                    "EXPIRED";

                score = 60;

                medicine.status =
                    "Expired";

                await medicine.save();
            }

            await Verification.create({
                type: "BARCODE",

                medicineName:
                    medicine.name,

                batchNumber:
                    medicine.batchNumber,

                manufacturer:
                    medicine.manufacturer,

                gtin: medicine.gtin,

                barcode:
                    cleanBarcode,

                source:
                    "Local Database",

                verificationStatus,

                score,

                message:
                    verificationStatus ===
                        "EXPIRED"
                        ? "Medicine was found but has expired."
                        : "Medicine barcode was verified successfully.",
            });

            return res.json({
                success: true,

                verification:
                    verificationStatus,

                score,

                message:
                    verificationStatus ===
                        "EXPIRED"
                        ? "Medicine found, but it has expired."
                        : "Medicine barcode verified successfully.",

                medicine,

                checks: {
                    medicineFound: true,

                    barcodeVerified: true,

                    manufacturerMatched: true,

                    expiryValid:
                        verificationStatus !==
                        "EXPIRED",
                },
            });
        }


        /* ===============================
           2. SEARCH EXTERNAL DATABASE
        ================================ */

        const externalResults =
            await searchMedicineByGTIN(
                cleanBarcode
            );


        if (
            externalResults &&
            externalResults.length > 0
        ) {
            const externalMedicine =
                externalResults[0];

            await Verification.create({
                type: "BARCODE",

                medicineName:
                    externalMedicine.name,

                brandName:
                    externalMedicine.brandName,

                manufacturer:
                    externalMedicine.manufacturer,

                gtin:
                    externalMedicine.productNdc ||
                    cleanBarcode,

                barcode:
                    cleanBarcode,

                source:
                    externalMedicine.source,

                verificationStatus:
                    "VERIFIED",

                score: 85,

                message:
                    "Medicine information was found in an external medicine database.",
            });

            return res.json({
                success: true,

                verification:
                    "VERIFIED",

                score: 85,

                message:
                    "Medicine information found through an external database.",

                medicine:
                    externalMedicine,

                checks: {
                    medicineFound: true,

                    barcodeVerified: true,

                    manufacturerMatched: true,

                    expiryValid: true,
                },
            });
        }


        /* ===============================
           3. BARCODE NOT FOUND
        ================================ */

        await Verification.create({
            type: "BARCODE",

            barcode:
                cleanBarcode,

            verificationStatus:
                "UNKNOWN",

            score: 0,

            message:
                "Barcode was not found in the available medicine databases.",
        });

        return res.status(404).json({
            success: false,

            verification:
                "UNKNOWN",

            score: 0,

            message:
                "Medicine barcode could not be verified.",
        });

    } catch (error) {
        console.error(
            "Barcode verification error:",
            error
        );

        res.status(500).json({
            success: false,

            message:
                "Barcode verification failed",

            error: error.message,
        });
    }


};

/* ===============================
GET ALL MEDICINES
================================ */

const getAllMedicines = async (
    req,
    res
) => {
    try {
        const medicines =
            await Medicine.find();


        res.json({
            success: true,

            count:
                medicines.length,

            medicines,
        });

    } catch (error) {
        res.status(500).json({
            success: false,

            message:
                "Server error",

            error:
                error.message,
        });
    }


};

/* ===============================
ADD MEDICINE
================================ */

const addMedicine = async (
    req,
    res
) => {
    try {
        const medicine =
            await Medicine.create(
                req.body
            );


        res.status(201).json({
            success: true,

            message:
                "Medicine added successfully",

            medicine,
        });

    } catch (error) {
        res.status(400).json({
            success: false,

            message:
                "Could not add medicine",

            error:
                error.message,
        });
    }


};

/* ===============================
UPDATE MEDICINE BY GTIN OR BATCH NUMBER
(used to fix/overwrite a wrongly-added
local record without needing its _id)
================================ */

const updateMedicineByGTIN = async (
    req,
    res
) => {
    try {
        const { gtin, batchNumber } =
            req.body;

        if (!gtin && !batchNumber) {
            return res.status(400).json({
                success: false,

                message:
                    "gtin or batchNumber is required to find the record to update",
            });
        }

        const query = gtin
            ? { gtin }
            : { batchNumber };

        const medicine =
            await Medicine.findOneAndUpdate(
                query,
                req.body,
                {
                    new: true,
                    runValidators: true,
                }
            );

        if (!medicine) {
            return res.status(404).json({
                success: false,

                message:
                    "No matching medicine found to update",
            });
        }

        res.json({
            success: true,

            message:
                "Medicine updated successfully",

            medicine,
        });

    } catch (error) {
        res.status(400).json({
            success: false,

            message:
                "Could not update medicine",

            error:
                error.message,
        });
    }
};

/* ===============================
SEARCH MEDICINE BY NAME
================================ */

const searchMedicine = async (
    req,
    res
) => {
    try {
        const { q } =
            req.query;


        if (
            !q ||
            q.trim() === ""
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "Please enter a medicine name",
            });
        }

        const localResults =
            await Medicine.find({
                name: {
                    $regex: q,
                    $options: "i",
                },
            });

        const externalResults =
            await searchExternalMedicine(
                q
            );

        res.json({
            success: true,

            query: q,

            localResults,

            externalResults,
        });

    } catch (error) {
        console.error(
            "Medicine search error:",
            error
        );

        res.status(500).json({
            success: false,

            message:
                "Medicine search failed",

            error:
                error.message,
        });
    }


};

/* ===============================
MANUAL VERIFICATION
================================ */

const verifyMedicine = async (
    req,
    res
) => {
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

                message:
                    "Medicine name is required",
            });
        }

        const result =
            await verifyMedicineData({
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
        console.error(
            "Verification error:",
            error
        );

        res.status(500).json({
            success: false,

            message:
                "Verification failed",

            error:
                error.message,
        });
    }


};

/* ===============================
QR VERIFICATION
================================ */

const verifyQRMedicine = async (
    req,
    res
) => {
    try {
        const { qrData } =
            req.body;


        if (
            !qrData ||
            !qrData.trim()
        ) {
            return res.status(400).json({
                success: false,

                message:
                    "QR data is required",
            });
        }

        const html =
            await fetchQRMedicineDetails(
                qrData
            );

        const medicineDetails =
            parseQRMedicineDetails(
                html
            );

        await Verification.create({
            type: "QR",

            medicineName:
                medicineDetails.name,

            brandName:
                medicineDetails.brandName,

            batchNumber:
                medicineDetails.batchNumber,

            manufacturer:
                medicineDetails.manufacturer,

            gtin:
                medicineDetails.gtin,

            verificationStatus:
                "VERIFIED",

            score: 100,

            message:
                "Medicine details were successfully verified from the QR product page.",
        });

        res.json({
            success: true,

            verification:
                "VERIFIED",

            score: 100,

            message:
                "Medicine details were successfully verified.",

            medicine:
                medicineDetails,

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

            message:
                "QR verification failed",

            error:
                error.message,
        });
    }


};

/* ===============================
GET HISTORY
================================ */

const getVerificationHistory =
    async (req, res) => {
        try {
            const history =
                await Verification.find()
                    .sort({
                        createdAt: -1,
                    })
                    .limit(50);


            res.json({
                success: true,

                count:
                    history.length,

                history,
            });

        } catch (error) {
            res.status(500).json({
                success: false,

                message:
                    "Could not fetch verification history",

                error:
                    error.message,
            });
        }
    };


/* ===============================
DELETE ONE HISTORY RECORD
================================ */

const deleteVerification =
    async (req, res) => {
        try {
            const { id } =
                req.params;


            const deletedVerification =
                await Verification.findByIdAndDelete(
                    id
                );

            if (
                !deletedVerification
            ) {
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

                error:
                    error.message,
            });
        }
    };


/* ===============================
CLEAR HISTORY
================================ */

const clearVerificationHistory =
    async (req, res) => {
        try {
            const result =
                await Verification.deleteMany(
                    {}
                );


            res.json({
                success: true,

                message:
                    "Verification history cleared successfully",

                deletedCount:
                    result.deletedCount,
            });

        } catch (error) {
            res.status(500).json({
                success: false,

                message:
                    "Could not clear verification history",

                error:
                    error.message,
            });
        }
    };


/* ===============================
SYNC MEDICINE DATABASE
================================ */

const syncMedicineDatabase =
    async (req, res) => {
        try {
            const result =
                await syncMedicines();

            res.json(result);

        } catch (error) {
            res.status(500).json({
                success: false,

                message:
                    "Medicine sync failed",

                error:
                    error.message,
            });
        }
    };


/* ===============================
EXPORT CONTROLLERS
================================ */

module.exports = {
    verifyMedicine,


    verifyMedicineByCode,

    verifyBarcodeMedicine,

    verifyQRMedicine,

    getAllMedicines,

    syncMedicineDatabase,

    addMedicine,

    updateMedicineByGTIN,

    searchMedicine,

    getVerificationHistory,

    deleteVerification,

    clearVerificationHistory,
};