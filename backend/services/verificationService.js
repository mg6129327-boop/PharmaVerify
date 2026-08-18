const Medicine = require("../models/Medicine");
const { searchExternalMedicine } = require("./drugService");

const verifyMedicineData = async ({
    name,
    batchNumber,
    manufacturer,
    expiryDate,
}) => {
    let score = 0;

    const checks = {
        medicineFound: false,
        batchVerified: false,
        manufacturerMatched: false,
        expiryValid: false,
    };

    // 1. Local MongoDB me exact batch check
    if (batchNumber) {
        const localMedicine = await Medicine.findOne({
            batchNumber: batchNumber,
        });

        if (localMedicine) {
            checks.batchVerified = true;
            score += 50;

            return {
                verification: "VERIFIED",
                score: 100,
                checks: {
                    medicineFound: true,
                    batchVerified: true,
                    manufacturerMatched: true,
                    expiryValid:
                        !localMedicine.expiryDate ||
                        new Date(localMedicine.expiryDate) > new Date(),
                },
                medicine: localMedicine,
                message:
                    "Medicine batch was found in the verified database.",
            };
        }
    }

    // 2. External medicine database search
    const externalResults = await searchExternalMedicine(name);

    if (externalResults.length > 0) {
        checks.medicineFound = true;
        score += 30;
    }

    // 3. Manufacturer comparison
    if (manufacturer && externalResults.length > 0) {
        const normalizedManufacturer = manufacturer
            .trim()
            .toLowerCase();

        const manufacturerMatch = externalResults.some(
            (medicine) =>
                medicine.manufacturer
                    .toLowerCase()
                    .includes(normalizedManufacturer) ||
                normalizedManufacturer.includes(
                    medicine.manufacturer.toLowerCase()
                )
        );

        if (manufacturerMatch) {
            checks.manufacturerMatched = true;
            score += 25;
        }
    }

    // 4. Expiry date check
    if (expiryDate) {
        const expiry = new Date(expiryDate);

        if (!isNaN(expiry) && expiry > new Date()) {
            checks.expiryValid = true;
            score += 15;
        }
    }

    let verification = "UNKNOWN";
    let message = "Unable to verify this medicine.";

    if (checks.expiryValid === false && expiryDate) {
        verification = "EXPIRED";
        message = "The medicine appears to be expired.";
    } else if (score >= 50) {
        verification = "PARTIALLY VERIFIED";
        message =
            "Medicine information was found, but batch authenticity could not be independently verified.";
    } else if (score > 0) {
        verification = "SUSPICIOUS";
        message =
            "Some medicine information was found, but verification data does not fully match.";
    }

    return {
        verification,
        score,
        checks,
        externalResults,
        message,
    };
};
const verifyQRMedicineData = async (qrData) => {
    let gtin = null;
    let batchNumber = null;

    const gtinMatch = qrData.match(/\/01\/([^/?]+)/);
    const batchMatch = qrData.match(/\/10\/([^/?]+)/);

    if (gtinMatch) {
        gtin = gtinMatch[1];
    }

    if (batchMatch) {
        batchNumber = batchMatch[1];
    }

    const checks = {
        qrValid: !!gtin || !!batchNumber,
        productFound: false,
        batchVerified: false,
        manufacturerMatched: false,
    };

    let score = 0;

    // QR successfully parsed
    if (checks.qrValid) {
        score += 20;
    }

    // STEP 1: Pehle batch number check karo
    let medicine = null;

    if (batchNumber) {
        medicine = await Medicine.findOne({
            batchNumber: batchNumber,
        });

        if (medicine) {
            checks.productFound = true;
            checks.batchVerified = true;
            checks.manufacturerMatched = true;

            return {
                verification: "VERIFIED",
                score: 100,
                qrData: {
                    gtin,
                    batchNumber,
                },
                checks,
                medicine,
                message:
                    "Medicine batch was found in the verified database.",
            };
        }
    }

    // STEP 2: Batch nahi mila to GTIN check karo
    if (gtin) {
        medicine = await Medicine.findOne({
            gtin: gtin,
        });

        if (medicine) {
            checks.productFound = true;
            checks.manufacturerMatched = true;

            score += 50;

            return {
                verification: "SUSPICIOUS",
                score: 70,
                qrData: {
                    gtin,
                    batchNumber,
                },
                checks,
                medicine,
                message:
                    "Medicine product was found, but this specific batch could not be verified.",
            };
        }
    }

    // STEP 3: Kuch bhi match nahi hua
    return {
        verification: "NOT VERIFIED",
        score,
        qrData: {
            gtin,
            batchNumber,
        },
        checks,
        medicine: null,
        message:
            "The QR code was read successfully, but no matching medicine was found in the database.",
    };
};
module.exports = {
    verifyMedicineData,
    verifyQRMedicineData,
};