const axios = require("axios");
const Medicine = require("../models/Medicine");

const syncMedicines = async () => {
    try {
        console.log("Starting medicine database sync...");

        const response = await axios.get(
            "https://api.fda.gov/drug/drugsfda.json",
            {
                params: {
                    limit: 100,
                },
            }
        );

        const results = response.data.results || [];

        let added = 0;
        let updated = 0;
        let skipped = 0;

        for (const item of results) {

            // Agar products array nahi hai to skip karo
            if (!Array.isArray(item.products)) {
                skipped++;
                continue;
            }

            for (const product of item.products) {

                const name = product.brand_name;

                // Name ya application number nahi hai to skip
                if (!name || !item.application_number) {
                    skipped++;
                    continue;
                }

                const manufacturer =
                    item.sponsor_name || "Unknown";

                const applicationNumber =
                    item.application_number;

                const existingMedicine =
                    await Medicine.findOne({
                        applicationNumber: applicationNumber,
                    });

                const medicineData = {
                    name: name,
                    manufacturer: manufacturer,
                    applicationNumber: applicationNumber,

                    // External FDA status
                    status:
                        product.marketing_status || "Unknown",

                    lastUpdated: new Date(),
                };

                if (existingMedicine) {

                    await Medicine.updateOne(
                        { _id: existingMedicine._id },
                        medicineData
                    );

                    updated++;

                } else {

                    await Medicine.create(medicineData);

                    added++;
                }
            }
        }

        console.log(
            `Sync complete. Added: ${added}, Updated: ${updated}, Skipped: ${skipped}`
        );

        return {
            success: true,
            added,
            updated,
            skipped,
        };

    } catch (error) {

        console.error(
            "Medicine sync failed:",
            error.message
        );

        return {
            success: false,
            error: error.message,
        };
    }
};

module.exports = {
    syncMedicines,
};