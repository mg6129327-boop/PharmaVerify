const express = require("express");

const {
  verifyMedicine,
  verifyMedicineByCode,
  verifyBarcodeMedicine,
  verifyQRMedicine,
  getAllMedicines,
  syncMedicineDatabase,
  addMedicine,
  searchMedicine,
  getVerificationHistory,
  deleteVerification,
  clearVerificationHistory,
} = require("../controllers/medicineController");

const router = express.Router();

// SYNC
router.post("/sync", syncMedicineDatabase);

// SEARCH
router.get("/search", searchMedicine);

// VERIFICATION HISTORY
router.get("/history", getVerificationHistory);

router.delete(
  "/history/:id",
  deleteVerification
);

router.delete(
  "/history",
  clearVerificationHistory
);

// BARCODE VERIFICATION
router.post(
  "/verify-barcode",
  verifyBarcodeMedicine
);

// QR VERIFICATION
router.post(
  "/verify-qr",
  verifyQRMedicine
);

// NORMAL VERIFICATION
router.post(
  "/verify",
  verifyMedicine
);

// BATCH NUMBER VERIFICATION
router.get(
  "/verify/:code",
  verifyMedicineByCode
);

// MEDICINES
router.get("/", getAllMedicines);

router.post("/", addMedicine);

module.exports = router;