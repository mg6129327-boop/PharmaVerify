const axios = require("axios");
const cheerio = require("cheerio");

const fetchQRMedicineDetails = async (qrUrl) => {
    try {
        const response = await axios.get(qrUrl);

        console.log("QR page fetched successfully");

        return response.data;
    } catch (error) {
        console.error("QR page fetch failed:", error.message);
        throw error;
    }
};

const parseQRMedicineDetails = (html) => {
    const $ = cheerio.load(html);

    const text = $("body")
        .clone()
        .find("script, style")
        .remove()
        .end()
        .text()
        .replace(/\s+/g, " ")
        .trim();

    const extract = (regex) => {
        const match = text.match(regex);
        return match && match[1] ? match[1].trim() : null;
    };

    const medicineDetails = {
        gtin: extract(
            /Unique Product Identification Code \(GTIN No\.\)\s*:\s*(.*?)(?=Proper Name Of The Drug\s*:|$)/i
        ),

        name: extract(
            /Proper Name Of The Drug\s*:\s*(.*?)(?=Generic Name Of The Drug\s*:|Brand Name\s*:|$)/i
        ),

        brandName: extract(
            /Brand Name\s*:\s*(.*?)(?=Name And Address Of The Manufacturer\s*:|$)/i
        ),

        manufacturer: extract(
            /Name And Address Of The Manufacturer\s*:\s*(.*?)(?=Batch Number\s*:|$)/i
        ),

        batchNumber: extract(
            /Batch Number\s*:\s*(.*?)(?=Date Of Manufacturing\s*:|$)/i
        ),

        manufacturingDate: extract(
            /Date Of Manufacturing\s*:\s*(.*?)(?=Date Of Expiry\s*:|$)/i
        ),

        expiryDate: extract(
            /Date Of Expiry\s*:\s*(.*?)(?=Manufacturing Licence Number\s*:|$)/i
        ),

        licenceNumber: extract(
            /Manufacturing Licence Number\s*:\s*(.*?)(?=Qualitative Details|Thank you|$)/i
        ),
    };

    console.log("EXTRACTED MEDICINE DETAILS:", medicineDetails);

    return medicineDetails;
};

module.exports = {
    fetchQRMedicineDetails,
    parseQRMedicineDetails,
};