const axios = require("axios");

const searchExternalMedicine = async (query) => {
    try {
        const response = await axios.get(
            "https://api.fda.gov/drug/drugsfda.json",
            {
                params: {
                    search: `products.brand_name:"${query}"`,
                    limit: 50,
                },
            }
        );

        const normalizedQuery = query.trim().toLowerCase();

        const medicines = [];

        response.data.results.forEach((item) => {
            item.products.forEach((product) => {
                const brandName = product.brand_name || "";

                medicines.push({
                    source: "openFDA",
                    brandName,
                    applicationNumber: item.application_number,
                    manufacturer: item.sponsor_name,
                    activeIngredients: product.active_ingredients,
                    dosageForm: product.dosage_form,
                    marketingStatus: product.marketing_status,
                });
            });
        });

        // Exact match ko pehle rakho
        medicines.sort((a, b) => {
            const aName = a.brandName.toLowerCase();
            const bName = b.brandName.toLowerCase();

            const aExact = aName === normalizedQuery;
            const bExact = bName === normalizedQuery;

            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;

            const aStarts = aName.startsWith(normalizedQuery);
            const bStarts = bName.startsWith(normalizedQuery);

            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;

            return 0;
        });

        // Duplicate results remove karo
        const uniqueMedicines = [];

        const seen = new Set();

        for (const medicine of medicines) {
            const key = `${medicine.brandName}-${medicine.manufacturer}`;

            if (!seen.has(key)) {
                seen.add(key);
                uniqueMedicines.push(medicine);
            }
        }

        return uniqueMedicines.slice(0, 10);

    } catch (error) {
        if (error.response?.status === 404) {
            return [];
        }

        throw error;
    }
};
const searchMedicineByGTIN = async (gtin) => {
    console.log("Searching medicine by GTIN:", gtin);

    return [];
};

module.exports = {
    searchExternalMedicine,
    searchMedicineByGTIN,
};