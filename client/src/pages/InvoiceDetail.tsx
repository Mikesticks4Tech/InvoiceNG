import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: {
    name: string;
    email: string;
    company: string;
    phone: string;
    address: string;
  };
  user: {
    name: string;
    email: string;
    businessName: string;
    phone: string;
    address: string;
  };
  lineItems: {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  notes: string;
  paidAt?: string;
  createdAt: string;
}

const statusColors: { [key: string]: string } = {
  draft: "#94a3b8",
  sent: "#f59e0b",
  paid: "#22c55e",
  overdue: "#ef4444",
};

const InvoiceDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data);
    } catch (err) {
      toast.error("Invoice not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setActionLoading(true);
    try {
      await api.put(`/invoices/${id}/send`);
      toast.success("Invoice marked as sent!");
      fetchInvoice();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to send");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePayment = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/payments/initialize/${id}`);
      localStorage.setItem("pendingPaymentReference", res.data.reference);
      window.location.href = res.data.authorizationUrl;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setActionLoading(false);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <p style={{ color: "#94a3b8" }}>Loading...</p>
      </div>
    );

  if (!invoice) return null;

  const isOwner = isAuthenticated && user;

  return (
    <div style={styles.container}>
      {isOwner && (
        <nav style={styles.nav}>
          <div style={styles.logo}>📄 InvoiceNG</div>
          <div style={styles.navLinks}>
            <Link to="/dashboard" style={styles.navLink}>
              Dashboard
            </Link>
            <Link to="/clients" style={styles.navLink}>
              Clients
            </Link>
          </div>
          <Link to="/dashboard" style={styles.backBtn}>
            ← Dashboard
          </Link>
        </nav>
      )}

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.invoiceNum}>{invoice.invoiceNumber}</h1>
            <p style={styles.invoiceDate}>
              Created{" "}
              {new Date(invoice.createdAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div style={styles.headerRight}>
            <span
              style={{
                ...styles.badge,
                background: `${statusColors[invoice.status]}15`,
                color: statusColors[invoice.status],
                border: `1px solid ${statusColors[invoice.status]}40`,
              }}
            >
              {invoice.status.toUpperCase()}
            </span>
            {isOwner && invoice.status === "draft" && (
              <button
                onClick={handleSend}
                disabled={actionLoading}
                style={styles.sendBtn}
              >
                📤 {actionLoading ? "Updating..." : "Mark as Sent"}
              </button>
            )}
          </div>
        </div>

        {/* Invoice Card */}
        <div style={styles.invoiceCard}>
          {/* From / To */}
          <div style={styles.fromTo}>
            <div>
              <p style={styles.fromToLabel}>FROM</p>
              <p style={styles.fromToName}>
                {invoice.user?.businessName || invoice.user?.name}
              </p>
              <p style={styles.fromToDetail}>{invoice.user?.email}</p>
              {invoice.user?.phone && (
                <p style={styles.fromToDetail}>{invoice.user.phone}</p>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={styles.fromToLabel}>TO</p>
              <p style={styles.fromToName}>{invoice.client?.name}</p>
              {invoice.client?.company && (
                <p style={styles.fromToDetail}>{invoice.client.company}</p>
              )}
              <p style={styles.fromToDetail}>{invoice.client?.email}</p>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Due Date */}
          <div style={styles.dueDateRow}>
            <div>
              <p style={styles.fromToLabel}>DUE DATE</p>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                {new Date(invoice.dueDate).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={styles.fromToLabel}>AMOUNT DUE</p>
              <p
                style={{
                  fontSize: "24px",
                  fontWeight: "800",
                  color: "#6366f1",
                }}
              >
                {formatAmount(invoice.total)}
              </p>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Line Items */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: "left" }}>Description</th>
                <th style={styles.th}>Qty</th>
                <th style={styles.th}>Rate</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr key={i} style={styles.tr}>
                  <td style={{ ...styles.td, textAlign: "left" }}>
                    {item.description}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {item.quantity}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {formatAmount(item.rate)}
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "right",
                      fontWeight: "600",
                    }}
                  >
                    {formatAmount(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div style={styles.totals}>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Subtotal</span>
              <span style={styles.totalValue}>
                {formatAmount(invoice.subtotal)}
              </span>
            </div>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Tax ({invoice.tax}%)</span>
              <span style={styles.totalValue}>
                {formatAmount((invoice.subtotal * invoice.tax) / 100)}
              </span>
            </div>
            <div
              style={{
                ...styles.totalRow,
                borderTop: "2px solid #e2e8f0",
                paddingTop: "12px",
                marginTop: "4px",
              }}
            >
              <span
                style={{
                  ...styles.totalLabel,
                  fontWeight: "700",
                  fontSize: "16px",
                  color: "#1e293b",
                }}
              >
                Total
              </span>
              <span
                style={{
                  ...styles.totalValue,
                  fontWeight: "800",
                  fontSize: "20px",
                  color: "#6366f1",
                }}
              >
                {formatAmount(invoice.total)}
              </span>
            </div>
          </div>

          {invoice.notes && (
            <>
              <div style={styles.divider} />
              <div>
                <p style={styles.fromToLabel}>NOTES</p>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    marginTop: "6px",
                    lineHeight: "1.6",
                  }}
                >
                  {invoice.notes}
                </p>
              </div>
            </>
          )}

          {invoice.status === "paid" && invoice.paidAt && (
            <div style={styles.paidBanner}>
              ✅ Paid on{" "}
              {new Date(invoice.paidAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>

        {/* Pay Button — shown to clients */}
        {invoice.status === "sent" && (
          <div style={styles.paySection}>
            <p style={styles.payText}>Pay this invoice securely via Paystack</p>
            <button
              onClick={handlePayment}
              disabled={actionLoading}
              style={styles.payBtn}
            >
              💳{" "}
              {actionLoading
                ? "Redirecting..."
                : `Pay ${formatAmount(invoice.total)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: { minHeight: "100vh", background: "#f8fafc" },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 32px",
    background: "#fff",
    borderBottom: "1px solid #e2e8f0",
  },
  logo: { fontSize: "20px", fontWeight: "800", color: "#6366f1" },
  navLinks: { display: "flex", gap: "24px" },
  navLink: { fontSize: "14px", color: "#64748b", fontWeight: "500" },
  backBtn: { fontSize: "14px", color: "#64748b" },
  content: { maxWidth: "760px", margin: "0 auto", padding: "40px 24px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  invoiceNum: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#6366f1",
    fontFamily: "monospace",
  },
  invoiceDate: { fontSize: "14px", color: "#94a3b8", marginTop: "4px" },
  headerRight: { display: "flex", alignItems: "center", gap: "12px" },
  badge: {
    fontSize: "12px",
    fontWeight: "700",
    padding: "6px 14px",
    borderRadius: "99px",
    letterSpacing: "0.06em",
  },
  sendBtn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "13px",
    fontWeight: "600",
  },
  invoiceCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "40px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
  },
  fromTo: { display: "flex", justifyContent: "space-between" },
  fromToLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginBottom: "6px",
  },
  fromToName: { fontSize: "16px", fontWeight: "700", color: "#1e293b" },
  fromToDetail: { fontSize: "13px", color: "#64748b", marginTop: "2px" },
  divider: { height: "1px", background: "#f1f5f9", margin: "24px 0" },
  dueDateRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "8px" },
  th: {
    padding: "12px 8px",
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid #f1f5f9",
    textAlign: "center",
  },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: {
    padding: "14px 8px",
    fontSize: "14px",
    color: "#1e293b",
    textAlign: "center",
  },
  totals: {
    marginTop: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxWidth: "320px",
    marginLeft: "auto",
  },
  totalRow: { display: "flex", justifyContent: "space-between" },
  totalLabel: { fontSize: "14px", color: "#64748b" },
  totalValue: { fontSize: "14px", color: "#1e293b" },
  paidBanner: {
    marginTop: "24px",
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.2)",
    borderRadius: "8px",
    padding: "14px 20px",
    fontSize: "14px",
    color: "#22c55e",
    fontWeight: "600",
  },
  paySection: {
    marginTop: "24px",
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "28px",
    textAlign: "center",
  },
  payText: { fontSize: "15px", color: "#64748b", marginBottom: "16px" },
  payBtn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "16px 40px",
    fontSize: "16px",
    fontWeight: "700",
  },
};

export default InvoiceDetail;
