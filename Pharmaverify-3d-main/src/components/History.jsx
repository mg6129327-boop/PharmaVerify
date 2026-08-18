import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function History({ history, refreshHistory }) {
  const [loadingId, setLoadingId] = useState(null);
  const [clearing, setClearing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const deleteVerification = async (id) => {
    const confirmed = window.confirm(
      "Delete this verification record?"
    );

    if (!confirmed) return;

    try {
      setLoadingId(id);

      const response = await fetch(
        `${API_URL}/api/medicine/history/${id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        refreshHistory();
      } else {
        alert(
          data.message ||
            "Could not delete verification record."
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Unable to connect to server.");
    } finally {
      setLoadingId(null);
    }
  };

  const clearHistory = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete all verification history? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      setClearing(true);

      const response = await fetch(
        `${API_URL}/api/medicine/history`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        refreshHistory();
      } else {
        alert(
          data.message ||
            "Could not clear verification history."
        );
      }
    } catch (error) {
      console.error("Clear history error:", error);
      alert("Unable to connect to server.");
    } finally {
      setClearing(false);
    }
  };

  const getStatusClass = (status = "") => {
    const value = status.toUpperCase();

    if (value === "VERIFIED") return "verified";
    if (value === "EXPIRED") return "expired";
    if (value === "SUSPICIOUS") return "suspicious";

    return "unknown";
  };

  const getStatusIcon = (status = "") => {
    const value = status.toUpperCase();

    if (value === "VERIFIED") return "✓";
    if (value === "EXPIRED") return "✕";
    if (value === "SUSPICIOUS") return "⚠";

    return "?";
  };

  /* ================= FILTER HISTORY ================= */

  const filteredHistory = (history || []).filter((item) => {
    const searchValue = searchTerm.toLowerCase();

    const medicineName =
      item.medicineName?.toLowerCase() || "";

    const batchNumber =
      item.batchNumber?.toLowerCase() || "";

    const manufacturer =
      item.manufacturer?.toLowerCase() || "";

    const status =
      item.verificationStatus?.toUpperCase() ||
      "UNKNOWN";

    const matchesSearch =
      medicineName.includes(searchValue) ||
      batchNumber.includes(searchValue) ||
      manufacturer.includes(searchValue);

    const matchesStatus =
      statusFilter === "ALL" ||
      status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  /* ================= EMPTY HISTORY ================= */

  if (!history || history.length === 0) {
    return (
      <section className="history" id="history">
        <div className="history-header">
          <div>
            <span className="section-tag">
              ACTIVITY
            </span>

            <h2>Verification History</h2>

            <p>
              Track your recent medicine verification
              results.
            </p>
          </div>
        </div>

        <div className="empty-history">
          <div className="empty-icon">📋</div>

          <h3>No Verification History Yet</h3>

          <p>
            Your verified medicines will appear here after
            you scan a QR code.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="history" id="history">
      {/* ================= HEADER ================= */}

      <div className="history-header">
        <div>
          <span className="section-tag">
            ACTIVITY
          </span>

          <h2>Verification History</h2>

          <p>
            {history.length} medicine
            {history.length !== 1 ? "s" : ""} verified
          </p>
        </div>

        <div className="history-actions">
          <div className="history-count">
            <span>{history.length}</span>

            <small>Total Checks</small>
          </div>

          <button
            className="clear-history-btn"
            onClick={clearHistory}
            disabled={clearing}
          >
            {clearing
              ? "Clearing..."
              : "Clear History"}
          </button>
        </div>
      </div>

      {/* ================= SEARCH & FILTER ================= */}

      <div className="history-filters">
        <div className="history-search">
          <span>🔍</span>

          <input
            type="text"
            placeholder="Search medicine, batch or manufacturer..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />
        </div>

        <select
          className="status-filter"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
        >
          <option value="ALL">
            All Status
          </option>

          <option value="VERIFIED">
            Verified
          </option>

          <option value="EXPIRED">
            Expired
          </option>

          <option value="SUSPICIOUS">
            Suspicious
          </option>

          <option value="UNKNOWN">
            Unknown
          </option>
        </select>
      </div>

      <p className="filter-result">
        Showing {filteredHistory.length} of{" "}
        {history.length} records
      </p>

      {/* ================= HISTORY LIST ================= */}

      {filteredHistory.length === 0 ? (
        <div className="no-search-results">
          <div>🔎</div>

          <h3>No Results Found</h3>

          <p>
            Try searching with a different medicine name,
            batch number, manufacturer, or status.
          </p>
        </div>
      ) : (
        <div className="history-list">
          {filteredHistory.map((item) => {
            const status =
              item.verificationStatus || "UNKNOWN";

            const statusClass =
              getStatusClass(status);

            return (
              <div
                className={`history-card ${statusClass}`}
                key={item._id}
              >
                {/* CARD TOP */}

                <div className="history-card-top">
                  <div className="medicine-icon">
                    💊
                  </div>

                  <div className="card-actions">
                    <div
                      className={`status-badge ${statusClass}`}
                    >
                      <span>
                        {getStatusIcon(status)}
                      </span>

                      {status}
                    </div>

                    <button
                      className="delete-history-btn"
                      onClick={() =>
                        deleteVerification(item._id)
                      }
                      disabled={
                        loadingId === item._id
                      }
                      title="Delete verification"
                    >
                      {loadingId === item._id
                        ? "..."
                        : "🗑"}
                    </button>
                  </div>
                </div>

                {/* MEDICINE NAME */}

                <h3>
                  {item.medicineName ||
                    "Unknown Medicine"}
                </h3>

                {item.brandName && (
                  <p className="brand-name">
                    {item.brandName}
                  </p>
                )}

                {/* DETAILS */}

                <div className="history-details">
                  {item.batchNumber && (
                    <div className="history-detail">
                      <span>Batch Number</span>

                      <strong>
                        {item.batchNumber}
                      </strong>
                    </div>
                  )}

                  {item.manufacturer && (
                    <div className="history-detail">
                      <span>Manufacturer</span>

                      <strong>
                        {item.manufacturer}
                      </strong>
                    </div>
                  )}
                </div>

                {/* FOOTER */}

                <div className="history-footer">
                  <div className="history-score">
                    <span>
                      Verification Score
                    </span>

                    <strong>
                      {item.score ?? 0}
                      <small>/100</small>
                    </strong>
                  </div>

                  {item.createdAt && (
                    <div className="verified-time">
                      {new Date(
                        item.createdAt
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default History;