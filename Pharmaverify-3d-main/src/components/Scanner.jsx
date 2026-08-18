import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import { Html5Qrcode } from "html5-qrcode";

const API_URL = import.meta.env.VITE_API_URL;

export default function Scanner({ setResult, refreshHistory }) {
  const [batchNumber, setBatchNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrMessage, setQrMessage] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const html5QrCodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ================= VERIFY MEDICINE =================

  const verifyMedicine = async (value = batchNumber) => {
    if (!value.trim()) {
      alert("Please enter a Batch Number or Medicine Name");
      return;
    }

    try {
      setLoading(true);

      const searchValue = value.trim();

      // 1. Check exact batch number in medicine database
      const verifyResponse = await fetch(
        `${API_URL}/api/medicine/verify/${encodeURIComponent(
          searchValue
        )}`
      );

      const verifyData = await verifyResponse.json();

      if (verifyResponse.ok && verifyData.success) {
        const medicine = verifyData.medicine;

        setResult({
          status:
            medicine.status === "Expired"
              ? "EXPIRED"
              : "VERIFIED",

          message:
            medicine.status === "Expired"
              ? "This medicine record is expired."
              : "Medicine batch was found in the verified database.",

          batch: medicine.batchNumber,
          medicineName: medicine.name,
          brandName: medicine.brandName,
          manufacturer: medicine.manufacturer,
          medicineStatus: medicine.status,
        });

        return;
      }

      // 2. Check verification history
      const historyResponse = await fetch(
        `${API_URL}/api/medicine/history`
      );

      const historyData = await historyResponse.json();

      if (
        historyResponse.ok &&
        historyData.success &&
        historyData.history
      ) {
        const matchedMedicine = historyData.history.find(
          (item) =>
            item.batchNumber &&
            item.batchNumber.toLowerCase() ===
            searchValue.toLowerCase()
        );

        if (matchedMedicine) {
          setResult({
            status:
              matchedMedicine.verificationStatus === "EXPIRED"
                ? "EXPIRED"
                : "VERIFIED",

            score: matchedMedicine.score || 100,

            message:
              "This medicine batch was previously verified successfully.",

            medicineName:
              matchedMedicine.medicineName ||
              "Verified Medicine",

            brandName: matchedMedicine.brandName,

            manufacturer: matchedMedicine.manufacturer,

            batch: matchedMedicine.batchNumber,

            medicineStatus:
              matchedMedicine.verificationStatus,

            checks: {
              medicineFound: true,
              batchVerified: true,
              manufacturerMatched: true,
              expiryValid:
                matchedMedicine.verificationStatus !== "EXPIRED",
            },
          });

          return;
        }
      }

      // 3. Search medicine by name
      const searchResponse = await fetch(
        `${API_URL}/api/medicine/search?q=${encodeURIComponent(
          searchValue
        )}`
      );

      const searchData = await searchResponse.json();

      if (
        searchResponse.ok &&
        searchData.success &&
        (searchData.localResults.length > 0 ||
          searchData.externalResults.length > 0)
      ) {
        const medicine =
          searchData.localResults[0] ||
          searchData.externalResults[0];

        setResult({
          status: "FOUND",

          message:
            "Medicine information was found in the database.",

          medicineName:
            medicine.name || medicine.brandName,

          manufacturer: medicine.manufacturer,

          batch:
            medicine.batchNumber ||
            medicine.applicationNumber,

          medicineStatus:
            medicine.status ||
            medicine.marketingStatus,

          source:
            medicine.source || "Local Database",

          localCount:
            searchData.localResults.length,

          externalCount:
            searchData.externalResults.length,
        });
      } else {
        setResult({
          status: "UNKNOWN",

          message:
            "No matching medicine was found in the local or external database.",
        });
      }
    } catch (error) {
      console.error(error);

      setResult({
        status: "ERROR",
        message: "Unable to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY QR =================

  const verifyQRCode = async (qrData) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/medicine/verify-qr`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            qrData: qrData,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const medicine = data.medicine || {};

        setResult({
          status: data.verification,
          score: data.score,
          checks: data.checks,
          qrData: data.qrData,
          message: data.message,

          medicineName: medicine.name,
          brandName: medicine.brandName,
          manufacturer: medicine.manufacturer,
          batch: medicine.batchNumber,
          gtin: medicine.gtin,
          manufacturingDate:
            medicine.manufacturingDate,
          expiryDate: medicine.expiryDate,
          licenceNumber: medicine.licenceNumber,

          medicine: medicine,
        });

        if (refreshHistory) {
          refreshHistory();
        }
      } else {
        setResult({
          status: "UNKNOWN",
          message:
            data.message || "QR verification failed",
        });
      }
    } catch (error) {
      console.error("QR verification error:", error);

      setResult({
        status: "ERROR",
        message: "Unable to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= HANDLE SCANNED QR =================

  const handleScannedQR = async (scannedData) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;

    console.log("FULL QR DATA:", scannedData);

    let extractedBatch = scannedData;

    const batchMatch = scannedData.match(
      /\/10\/([^/?]+)/
    );

    if (batchMatch && batchMatch[1]) {
      extractedBatch = batchMatch[1];
    }

    setBatchNumber(extractedBatch);

    setQrMessage(
      `QR Code scanned successfully. Code: ${extractedBatch}`
    );

    await stopCamera();

    await verifyQRCode(scannedData);
  };

  // ================= START CAMERA =================

  const startCamera = async () => {
    try {
      setQrMessage("Starting camera...");
      isProcessingRef.current = false;

      const scanner = new Html5Qrcode("camera-reader");

      html5QrCodeRef.current = scanner;

      isScanningRef.current = true;
      setCameraActive(true);

      await scanner.start(
        {
          facingMode: "environment",
        },

        {
          fps: 10,

          qrbox: {
            width: 280,
            height: 280,
          },
        },

        async (decodedText) => {
          if (!isScanningRef.current) return;

          await handleScannedQR(decodedText);
        },

        () => {
          // QR detect nahi hua abhi
        }
      );

      setQrMessage(
        "Camera started. Hold the QR code inside the scanning box."
      );
    } catch (error) {
      console.error("Camera error:", error);

      isScanningRef.current = false;
      setCameraActive(false);

      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.clear();
        } catch (clearError) {
          console.log(clearError);
        }

        html5QrCodeRef.current = null;
      }

      setQrMessage(
        `Unable to access camera: ${error.message || "Unknown camera error"
        }`
      );
    }
  };

  // ================= STOP CAMERA =================

  const stopCamera = async () => {
    try {
      isScanningRef.current = false;

      const scanner =
        html5QrCodeRef.current;

      if (scanner) {
        try {
          await scanner.stop();
        } catch (error) {
          console.log(
            "Scanner was already stopped."
          );
        }

        try {
          await scanner.clear();
        } catch (error) {
          console.log(
            "Scanner was already cleared."
          );
        }
      }

      html5QrCodeRef.current = null;
      setCameraActive(false);
    } catch (error) {
      console.error(
        "Error stopping camera:",
        error
      );
    }
  };

  // ================= QR IMAGE UPLOAD =================

  const handleQRUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setQrMessage("Scanning QR Code...");

    const reader = new FileReader();

    reader.onload = (e) => {
      const image = new Image();

      image.onload = () => {
        const canvas =
          document.createElement("canvas");

        const context =
          canvas.getContext("2d");

        canvas.width = image.width;
        canvas.height = image.height;

        context.drawImage(
          image,
          0,
          0
        );

        const imageData =
          context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );

        const code = jsQR(
          imageData.data,
          imageData.width,
          imageData.height
        );

        if (code) {
          isProcessingRef.current = false;

          handleScannedQR(
            code.data.trim()
          );
        } else {
          setQrMessage(
            "No QR code found in this image. Please upload a clear QR code."
          );
        }
      };

      image.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  return (
    <section
      className="scanner"
      id="scanner"
    >
      <h2>Verify Your Medicine</h2>

      <p>
        Scan a QR Code, upload a QR image, or
        enter a Batch Number or Medicine Name.
      </p>

      <div className="scanner-box">

        {/* UPLOAD QR */}

        <div className="upload-box">
          <span>📷</span>

          <h3>Upload QR Code</h3>

          <p>
            Upload an image containing the
            medicine QR code.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleQRUpload}
            disabled={loading}
          />
        </div>

        {/* CAMERA QR */}

        <div className="camera-box">
          <span>📹</span>

          <h3>Scan with Camera</h3>

          <p>
            Use your device camera to scan the
            medicine QR code.
          </p>

          <div
            id="camera-reader"
            className={
              cameraActive
                ? "camera-reader active"
                : "camera-reader"
            }
          />

          {!cameraActive ? (
            <button
              className="camera-btn"
              onClick={startCamera}
              disabled={loading}
            >
              Start Camera Scanner
            </button>
          ) : (
            <button
              className="stop-camera-btn"
              onClick={stopCamera}
            >
              Stop Camera
            </button>
          )}
        </div>

        {qrMessage && (
          <p className="qr-message">
            {qrMessage}
          </p>
        )}

        <div className="divider">
          OR
        </div>

        {/* BATCH NUMBER */}

        <div className="batch-box">
          <input
            type="text"
            placeholder="Enter Batch Number or Medicine Name"
            value={batchNumber}
            onChange={(e) =>
              setBatchNumber(
                e.target.value
              )
            }
          />

          <button
            onClick={() =>
              verifyMedicine()
            }
            disabled={loading}
          >
            {loading
              ? "Verifying..."
              : "Verify Medicine"}
          </button>
        </div>
      </div>
    </section>
  );
}