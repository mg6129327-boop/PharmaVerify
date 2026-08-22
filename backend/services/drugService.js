const axios = require("axios");

/* ===============================
SEARCH MEDICINE BY NAME
================================ */

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


        const normalizedQuery = query
            .trim()
            .toLowerCase();

        const medicines = [];

        response.data.results.forEach((item) => {
            item.products.forEach((product) => {
                const brandName =
                    product.brand_name || "";

                medicines.push({
                    source: "openFDA",

                    name: brandName,

                    brandName,

                    applicationNumber:
                        item.application_number,

                    manufacturer:
                        item.sponsor_name,

                    activeIngredients:
                        product.active_ingredients,

                    dosageForm:
                        product.dosage_form,

                    marketingStatus:
                        product.marketing_status,
                });
            });
        });

        /* EXACT MATCH FIRST */

        medicines.sort((a, b) => {
            const aName =
                a.brandName.toLowerCase();

            const bName =
                b.brandName.toLowerCase();

            const aExact =
                aName === normalizedQuery;

            const bExact =
                bName === normalizedQuery;

            if (aExact && !bExact) {
                return -1;
            }

            if (!aExact && bExact) {
                return 1;
            }

            const aStarts =
                aName.startsWith(
                    normalizedQuery
                );

            const bStarts =
                bName.startsWith(
                    normalizedQuery
                );

            if (aStarts && !bStarts) {
                return -1;
            }

            if (!aStarts && bStarts) {
                return 1;
            }

            return 0;
        });

        /* REMOVE DUPLICATES */

        const uniqueMedicines = [];

        const seen = new Set();

        for (const medicine of medicines) {
            const key =
                `${medicine.brandName}-${medicine.manufacturer}`;

            if (!seen.has(key)) {
                seen.add(key);

                uniqueMedicines.push(
                    medicine
                );
            }
        }

        return uniqueMedicines.slice(0, 10);

    } catch (error) {

        if (
            error.response?.status === 404
        ) {
            return [];
        }

        console.error(
            "External medicine search error:",
            error.message
        );

        throw error;
    }
};

/* ===============================
SEARCH MEDICINE BY GTIN /
BARCODE
================================ */

const searchMedicineByGTIN = async (
    barcode
) => {
    try {
        console.log(
            "Searching medicine by barcode:",
            barcode
        );
        /*
        Barcode lookup using OpenFDA.
    
        OpenFDA does not provide a universal
        GTIN database, so we search possible
        product identifiers.
        */

        const cleanBarcode =
            barcode
                .toString()
                .trim();

        /*
        Try searching OpenFDA NDC directory.
    
        Many medicine barcodes are related
        to NDC product codes.
        */

        try {
            const response =
                await axios.get(
                    "https://api.fda.gov/drug/ndc.json",
                    {
                        params: {
                            search:
                                `product_ndc:"${cleanBarcode}"`,
                            limit: 10,
                        },
                    }
                );

            if (
                response.data &&
                response.data.results
            ) {
                return response.data.results.map(
                    (item) => ({
                        source: "openFDA Barcode Database",

                        name:
                            item.brand_name ||
                            item.generic_name ||
                            "Unknown Medicine",

                        brandName:
                            item.brand_name ||
                            item.generic_name,

                        genericName:
                            item.generic_name,

                        manufacturer:
                            item.labeler_name,

                        productNdc:
                            item.product_ndc,

                        barcode:
                            cleanBarcode,

                        dosageForm:
                            item.dosage_form,

                        route:
                            item.route,

                        marketingStatus:
                            item.marketing_category,
                    })
                );
            }

        } catch (error) {

            if (
                error.response?.status !== 404
            ) {
                console.log(
                    "OpenFDA barcode lookup failed:",
                    error.message
                );
            }
        }

        /*
        If exact barcode is not found,
        return empty array.
        */

        return [];

    } catch (error) {

        console.error(
            "Barcode search error:",
            error.message
        );

        return [];
    }


};

/* ===============================
EXPORT SERVICES
================================ */

module.exports = {
    searchExternalMedicine,
    searchMedicineByGTIN,
};
