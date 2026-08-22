import { useState, useRef, useEffect } from "react";

import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";

import { BrowserMultiFormatReader } from "@zxing/browser";

import {
  BarcodeFormat,
  DecodeHintType,
} from "@zxing/library";

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

      // 1. CHECK EXACT CODE / BATCH NUMBER

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

          score: 100,

          message:
            medicine.status === "Expired"
              ? "This medicine record is expired."
              : "Medicine was found in the verified database.",

          batch: medicine.batchNumber,
          medicineName: medicine.name,
          manufacturer: medicine.manufacturer,
          medicineStatus: medicine.status,
          gtin: medicine.gtin,
          expiryDate: medicine.expiryDate,
          manufacturingDate: medicine.manufacturingDate,

          checks: {
            medicineFound: true,
            batchVerified: true,
            manufacturerMatched: true,
            expiryValid: medicine.status !== "Expired",
          },
        });

        if (refreshHistory) {
          refreshHistory();
        }

        return;
      }

      // ================= CHECK HISTORY =================

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
              "This medicine was previously verified.",

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
                matchedMedicine.verificationStatus !==
                "EXPIRED",
            },
          });

          return;
        }
      }

      // ================= SEARCH MEDICINE =================

      const searchResponse = await fetch(
        `${API_URL}/api/medicine/search?q=${encodeURIComponent(
          searchValue
        )}`
      );

      const searchData = await searchResponse.json();

      if (
        searchResponse.ok &&
        searchData.success &&
        (searchData.localResults?.length > 0 ||
          searchData.externalResults?.length > 0)
      ) {
        const medicine =
          searchData.localResults?.[0] ||
          searchData.externalResults?.[0];

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
            medicine.source ||
            "Local Database",

          localCount:
            searchData.localResults?.length || 0,

          externalCount:
            searchData.externalResults?.length || 0,
        });
      } else {
        setResult({
          status: "UNKNOWN",

          message:
            "No matching medicine was found in the database.",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);

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
            qrData,
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

          medicine,
        });

        if (refreshHistory) {
          refreshHistory();
        }
      } else {
        setResult({
          status: "UNKNOWN",

          message:
            data.message ||
            "QR verification failed",
        });
      }
    } catch (error) {
      console.error(
        "QR verification error:",
        error
      );

      setResult({
        status: "ERROR",
        message: "Unable to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= VERIFY BARCODE =================

  const verifyBarcode = async (barcodeData) => {
    try {
      setLoading(true);

      setQrMessage(
        `Barcode detected: ${barcodeData}. Verifying...`
      );

      const response = await fetch(
        `${API_URL}/api/medicine/verify-barcode`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            barcode: barcodeData,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        const medicine = data.medicine || {};

        setResult({
          status: data.verification || "VERIFIED",

          score: data.score || 0,

          message:
            data.message ||
            "Medicine barcode was successfully verified.",

          medicineName:
            medicine.name ||
            medicine.brandName ||
            "Medicine Found",

          brandName: medicine.brandName,

          manufacturer: medicine.manufacturer,

          batch:
            medicine.batchNumber,

          gtin:
            medicine.gtin ||
            medicine.productNdc ||
            barcodeData,

          expiryDate:
            medicine.expiryDate,

          manufacturingDate:
            medicine.manufacturingDate,

          medicineStatus:
            medicine.status,

          checks: data.checks,

          source:
            medicine.source ||
            "External Database",
        });

        if (refreshHistory) {
          refreshHistory();
        }
      } else {
        setResult({
          status: "UNKNOWN",

          score: data.score || 0,

          message:
            data.message ||
            `Barcode ${barcodeData} could not be verified.`,

          gtin: barcodeData,
        });
      }
    } catch (error) {
      console.error(
        "Barcode verification error:",
        error
      );

      setResult({
        status: "ERROR",

        message:
          "Unable to verify barcode.",
      });
    } finally {
      setLoading(false);
    }
  };
  // ================= HANDLE SCANNED CODE =================

  const handleScannedCode = async (
    scannedData,
    format
  ) => {
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;

    console.log("SCANNED DATA:", scannedData);
    console.log("FORMAT:", format);

    setBatchNumber(scannedData);

    await stopCamera();

    const normalizedFormat = String(
      format
    ).toUpperCase();

    const isQR =
      normalizedFormat.includes("QR_CODE") ||
      normalizedFormat.includes("QR");

    if (isQR) {
      setQrMessage(
        `QR Code scanned successfully: ${scannedData}`
      );

      await verifyQRCode(scannedData);
    } else {
      setQrMessage(
        `Barcode scanned successfully: ${scannedData}`
      );

      await verifyBarcode(scannedData);
    }
  };

  // ================= START CAMERA =================

  const startCamera = async () => {
    try {
      setQrMessage(
        "Starting QR and barcode scanner..."
      );

      isProcessingRef.current = false;

      const scanner = new Html5Qrcode(
        "camera-reader"
      );

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
            width: 300,
            height: 250,
          },

          aspectRatio: 1.777,

          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
        },

        async (decodedText, decodedResult) => {
          if (
            !isScanningRef.current ||
            isProcessingRef.current
          ) {
            return;
          }

          const format =
            decodedResult?.result?.format?.formatName ||
            "UNKNOWN";

          await handleScannedCode(
            decodedText,
            format
          );
        },

        () => { }
      );

      setQrMessage(
        "Camera started. Scan a QR code or barcode."
      );
    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      isScanningRef.current = false;

      setCameraActive(false);

      setQrMessage(
        `Unable to access camera: ${error.message ||
        "Unknown camera error"
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
        } catch {
          console.log("Scanner already stopped.");
        }

        try {
          await scanner.clear();
        } catch {
          console.log("Scanner already cleared.");
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

  // ================= IMAGE UPLOAD =================

  const handleCodeUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    let imageUrl = null;

    try {
      setLoading(true);

      setQrMessage(
        "Scanning image for QR code or barcode..."
      );

      isProcessingRef.current = false;

      imageUrl = URL.createObjectURL(file);

      // ================================
      // METHOD 1: NATIVE BARCODE DETECTOR
      // ================================

      if ("BarcodeDetector" in window) {
        try {
          const supportedFormats =
            await window.BarcodeDetector.getSupportedFormats();

          const wantedFormats = [
            "qr_code",
            "ean_13",
            "ean_8",
            "code_128",
            "code_39",
            "upc_a",
            "upc_e",
          ].filter((format) =>
            supportedFormats.includes(format)
          );

          if (wantedFormats.length > 0) {
            const detector =
              new window.BarcodeDetector({
                formats: wantedFormats,
              });

            const bitmap =
              await createImageBitmap(file);

            const detected =
              await detector.detect(bitmap);

            bitmap.close();

            if (detected.length > 0) {
              const result = detected[0];

              const scannedData =
                result.rawValue;

              const format =
                result.format.toUpperCase();

              await handleScannedCode(
                scannedData,
                format
              );

              return;
            }
          }
        } catch (nativeError) {
          console.log(
            "Native detector failed, trying ZXing:",
            nativeError
          );
        }
      }

      // ================================
      // METHOD 2: TRY ORIGINAL IMAGE
      // ================================

      try {
        const hints = new Map();

        hints.set(
          DecodeHintType.POSSIBLE_FORMATS,
          [
            BarcodeFormat.QR_CODE,
            BarcodeFormat.EAN_13,
            BarcodeFormat.EAN_8,
            BarcodeFormat.CODE_128,
            BarcodeFormat.CODE_39,
            BarcodeFormat.UPC_A,
            BarcodeFormat.UPC_E,
          ]
        );

        hints.set(
          DecodeHintType.TRY_HARDER,
          true
        );

        const reader =
          new BrowserMultiFormatReader(
            hints
          );

        const result =
          await reader.decodeFromImageUrl(
            imageUrl
          );

        if (result) {
          const scannedData =
            result.getText();

          const format =
            result
              .getBarcodeFormat()
              .toString();

          await handleScannedCode(
            scannedData,
            format
          );

          return;
        }
      } catch (originalImageError) {
        console.log(
          "Original image decode failed. Trying enhanced image..."
        );
      }

      // ================================
      // METHOD 3: ENHANCE IMAGE
      // ================================

      const image = new Image();

      image.src = imageUrl;

      await new Promise(
        (resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        }
      );

      const canvas =
        document.createElement("canvas");

      const ctx =
        canvas.getContext("2d", {
          willReadFrequently: true,
        });

      if (!ctx) {
        throw new Error(
          "Could not create image processing canvas"
        );
      }

      // Large images ko manageable rakho

      const maxWidth = 2400;

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      if (width < 1200) {
        const scale = 2;

        width = width * scale;
        height = height * scale;
      }

      if (width > maxWidth) {
        const ratio =
          maxWidth / width;

        width = maxWidth;
        height =
          Math.round(height * ratio);
      }

      canvas.width =
        Math.round(width);

      canvas.height =
        Math.round(height);

      ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageData =
        ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

      const pixels =
        imageData.data;

      // Grayscale + contrast enhancement

      for (
        let i = 0;
        i < pixels.length;
        i += 4
      ) {
        const gray =
          0.299 * pixels[i] +
          0.587 * pixels[i + 1] +
          0.114 * pixels[i + 2];

        const contrast =
          Math.max(
            0,
            Math.min(
              255,
              (gray - 128) * 1.8 + 128
            )
          );

        pixels[i] = contrast;
        pixels[i + 1] = contrast;
        pixels[i + 2] = contrast;
      }

      ctx.putImageData(
        imageData,
        0,
        0
      );

      const processedImage =
        canvas.toDataURL(
          "image/png"
        );

      // ================================
      // METHOD 4: ZXING ON ENHANCED IMAGE
      // ================================

      const enhancedHints =
        new Map();

      enhancedHints.set(
        DecodeHintType.POSSIBLE_FORMATS,
        [
          BarcodeFormat.QR_CODE,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.CODE_128,
          BarcodeFormat.CODE_39,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
        ]
      );

      enhancedHints.set(
        DecodeHintType.TRY_HARDER,
        true
      );

      const enhancedReader =
        new BrowserMultiFormatReader(
          enhancedHints
        );

      const result =
        await enhancedReader.decodeFromImageUrl(
          processedImage
        );

      if (result) {
        const scannedData =
          result.getText();

        const format =
          result
            .getBarcodeFormat()
            .toString();

        await handleScannedCode(
          scannedData,
          format
        );

        return;
      }

      setQrMessage(
        "No readable QR code or barcode found. Try uploading a closer image of the code."
      );
    } catch (error) {
      console.error(
        "Image scan error:",
        error
      );

      setQrMessage(
        "Could not read the QR code or barcode. Try a close, straight photo with the entire code visible."
      );
    } finally {
      if (imageUrl) {
        URL.revokeObjectURL(
          imageUrl
        );
      }

      setLoading(false);

      event.target.value = "";
    }
  };

  return (
    <section
      className="scanner"
      id="scanner"
    >
      <h2>
        Verify Your Medicine
      </h2>

      <p>
        Scan a QR code or barcode,
        upload an image, or enter a
        batch number or medicine name.
      </p>

      <div className="scanner-box">
        {/* IMAGE UPLOAD */}

        <div className="upload-box">
          <span>📷</span>

          <h3>
            Upload QR or Barcode
          </h3>

          <p>
            Upload an image containing
            a medicine QR code or barcode.
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={handleCodeUpload}
            disabled={loading}
          />
        </div>

        {/* CAMERA SCANNER */}

        <div className="camera-box">
          <span>📹</span>

          <h3>
            Scan with Camera
          </h3>

          <p>
            Scan a medicine QR code
            or barcode using your
            device camera.
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
              Start Scanner
            </button>
          ) : (
            <button
              className="stop-camera-btn"
              onClick={stopCamera}
            >
              Stop Scanner
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

        {/* MANUAL INPUT */}

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

