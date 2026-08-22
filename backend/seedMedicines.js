/**
 * seedMedicines.js
 *
 * Demo-data seeder for PharmaVerify.
 * Posts a list of common Indian OTC medicines to your live backend
 * using the existing POST /api/medicine route — no direct DB/model
 * access needed.
 *
 * USAGE:
 *   1. Place this file anywhere in your backend project (e.g. backend/seedMedicines.js)
 *   2. Run:  node seedMedicines.js
 *   3. It will print success/fail for each medicine.
 *
 * NOTE: GTINs below are DEMO/placeholder values in valid GS1-India
 * format (start with 890) — they will NOT match real product barcodes.
 * They're for the "search by name/batch" and manual-verify demo flow.
 * If you want a specific GTIN to match a barcode you'll actually scan,
 * edit that entry's "gtin" to the real number printed on the box.
 */

const axios = require("axios");

const API_URL =
  process.env.API_URL ||
  "https://pharmaverify.onrender.com";

const medicines = [
  {
    name: "Dolo 650",
    gtin: "8901234500011",
    batchNumber: "DOL650A1",
    manufacturer: "Micro Labs Ltd",
    expiryDate: "2027-06-01",
    manufacturingDate: "2025-06-01",
  },
  {
    name: "Crocin Advance",
    gtin: "8901234500028",
    batchNumber: "CRC500B2",
    manufacturer: "GSK Pharmaceuticals",
    expiryDate: "2027-08-01",
    manufacturingDate: "2025-08-01",
  },
  {
    name: "Combiflam",
    gtin: "8901234500035",
    batchNumber: "CMB100C3",
    manufacturer: "Sanofi India Ltd",
    expiryDate: "2027-04-01",
    manufacturingDate: "2025-04-01",
  },
  {
    name: "Saridon",
    gtin: "8901234500042",
    batchNumber: "SRD200D4",
    manufacturer: "Piramal Consumer Products",
    expiryDate: "2027-05-01",
    manufacturingDate: "2025-05-01",
  },
  {
    name: "Digene Gel",
    gtin: "8901234500059",
    batchNumber: "DIG300E5",
    manufacturer: "Abbott India Ltd",
    expiryDate: "2027-09-01",
    manufacturingDate: "2025-09-01",
  },
  {
    name: "ORS-L",
    gtin: "8901234500066",
    batchNumber: "ORS400F6",
    manufacturer: "FDC Ltd",
    expiryDate: "2027-03-01",
    manufacturingDate: "2025-03-01",
  },
  {
    name: "Volini Gel",
    gtin: "8901234500073",
    batchNumber: "VOL500G7",
    manufacturer: "Sun Pharmaceutical Industries",
    expiryDate: "2027-07-01",
    manufacturingDate: "2025-07-01",
  },
  {
    name: "Betadine Ointment",
    gtin: "8901234500080",
    batchNumber: "BET600H8",
    manufacturer: "Win-Medicare Pvt Ltd",
    expiryDate: "2027-10-01",
    manufacturingDate: "2025-10-01",
  },
  {
    name: "Zincovit Tablets",
    gtin: "8901234500097",
    batchNumber: "ZNC700I9",
    manufacturer: "Apex Laboratories",
    expiryDate: "2027-11-01",
    manufacturingDate: "2025-11-01",
  },
  {
    name: "Electral Powder",
    gtin: "8901234500103",
    batchNumber: "ELC800J1",
    manufacturer: "FDC Ltd",
    expiryDate: "2027-02-01",
    manufacturingDate: "2025-02-01",
  },
  {
    name: "Patanjali Drishti Eye Drop",
    gtin: "8904109449291",
    batchNumber: "ACGM260007",
    manufacturer: "Patanjali Ayurved Ltd",
    expiryDate: "2027-03-01",
    manufacturingDate: "2026-04-01",
  },
  {
    name: "Moov Pain Relief Spray",
    gtin: "8901234500110",
    batchNumber: "MOV900K2",
    manufacturer: "Reckitt Benckiser India",
    expiryDate: "2027-12-01",
    manufacturingDate: "2025-12-01",
  },
];

async function seed() {
  console.log(
    `Seeding ${medicines.length} medicines to ${API_URL} ...\n`
  );

  for (const med of medicines) {
    try {
      // Try to add. If it already exists (duplicate gtin/batch causing
      // a validation/unique error on your schema), fall back to PATCH
      // update so the script is safely re-runnable.
      const res = await axios.post(
        `${API_URL}/api/medicine`,
        med
      );

      console.log(
        `✅ Added: ${med.name} (${res.data.success})`
      );
    } catch (err) {
      const status = err.response?.status;

      if (status === 400) {
        // Likely already exists — try updating instead.
        try {
          const patchRes = await axios.patch(
            `${API_URL}/api/medicine`,
            med
          );

          console.log(
            `♻️  Updated existing: ${med.name} (${patchRes.data.success})`
          );
        } catch (patchErr) {
          console.log(
            `❌ Failed (add+update): ${med.name} — ${
              patchErr.response?.data?.message ||
              patchErr.message
            }`
          );
        }
      } else {
        console.log(
          `❌ Failed: ${med.name} — ${
            err.response?.data?.message || err.message
          }`
        );
      }
    }
  }

  console.log("\nSeeding complete.");
}

seed();