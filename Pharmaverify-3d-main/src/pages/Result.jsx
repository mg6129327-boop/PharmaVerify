function Result({ result }) {
  if (!result) return null;

  const status = (
    result.status ||
    result.verification ||
    "UNKNOWN"
  ).toUpperCase();

  let title;
  let icon;

  if (status === "VERIFIED") {
    title = "MEDICINE VERIFIED";
    icon = "✓";
  } else if (status === "FOUND") {
    title = "MEDICINE FOUND";
    icon = "✓";
  } else if (status === "EXPIRED") {
    title = "MEDICINE EXPIRED";
    icon = "✗";
  } else if (status === "SUSPICIOUS") {
    title = "MEDICINE SUSPICIOUS";
    icon = "⚠";
  } else {
    title = "MEDICINE NOT VERIFIED";
    icon = "✗";
  }

  const medicine = result.medicine || {};

  const medicineName =
    result.medicineName || medicine.name;

  const brandName =
    result.brandName || medicine.brandName;

  const manufacturer =
    result.manufacturer || medicine.manufacturer;

  const batch =
    result.batch || medicine.batchNumber;

  const gtin =
    result.gtin || medicine.gtin;

  const manufacturingDate =
    result.manufacturingDate ||
    medicine.manufacturingDate;

  const expiryDate =
    result.expiryDate || medicine.expiryDate;

  const licenceNumber =
    result.licenceNumber ||
    medicine.licenceNumber;

  return (
    <section className="result">
      <h2>Verification Result</h2>

      <div
        className={`result-card ${status.toLowerCase()}`}
      >
        <div className="result-status">
          <div className="status-icon">
            {icon}
          </div>

          <h3>{title}</h3>
        </div>

        {result.message && (
          <p className="result-message">
            {result.message}
          </p>
        )}

        {result.score !== undefined && (
          <div className="verification-score">
            <span>Verification Score</span>

            <strong>
              {result.score}/100
            </strong>
          </div>
        )}

        {result.checks && (
          <div className="verification-checks">
            <div className="check-item">
              <span>Medicine Found</span>

              <b>
                {result.checks.medicineFound
                  ? "✓ Yes"
                  : "✗ No"}
              </b>
            </div>

            <div className="check-item">
              <span>Batch Verified</span>

              <b>
                {result.checks.barcodeVerified ??
                result.checks.batchVerified
                  ? "✓ Yes"
                  : "✗ No"}
              </b>
            </div>

            <div className="check-item">
              <span>Manufacturer Matched</span>

              <b>
                {result.checks.manufacturerMatched
                  ? "✓ Yes"
                  : "✗ No"}
              </b>
            </div>

            <div className="check-item">
              <span>Expiry Valid</span>

              <b>
                {result.checks.expiryValid
                  ? "✓ Yes"
                  : "✗ No"}
              </b>
            </div>
          </div>
        )}

        {(medicineName ||
          brandName ||
          manufacturer ||
          batch ||
          gtin ||
          manufacturingDate ||
          expiryDate ||
          licenceNumber) && (
          <div className="medicine-details">
            <h3>Medicine Details</h3>

            <div className="details-grid">
              {medicineName && (
                <div className="detail-item">
                  <span>Medicine</span>
                  <p>{medicineName}</p>
                </div>
              )}

              {brandName && (
                <div className="detail-item">
                  <span>Brand</span>
                  <p>{brandName}</p>
                </div>
              )}

              {batch && (
                <div className="detail-item">
                  <span>Batch Number</span>
                  <p>{batch}</p>
                </div>
              )}

              {gtin && (
                <div className="detail-item">
                  <span>GTIN</span>
                  <p>{gtin}</p>
                </div>
              )}

              {manufacturingDate && (
                <div className="detail-item">
                  <span>Manufacturing Date</span>
                  <p>{manufacturingDate}</p>
                </div>
              )}

              {expiryDate && (
                <div className="detail-item">
                  <span>Expiry Date</span>
                  <p>{expiryDate}</p>
                </div>
              )}

              {licenceNumber && (
                <div className="detail-item">
                  <span>Manufacturing Licence</span>
                  <p>{licenceNumber}</p>
                </div>
              )}

              {result.medicineStatus && (
                <div className="detail-item">
                  <span>Status</span>
                  <p>{result.medicineStatus}</p>
                </div>
              )}
            </div>

            {manufacturer && (
              <div className="manufacturer-detail">
                <span>Manufacturer</span>
                <p>{manufacturer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Result;