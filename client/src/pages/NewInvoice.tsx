import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Client {
  _id: string;
  name: string;
  email: string;
  company: string;
}

interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

const NewInvoice = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tax, setTax] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 },
  ]);

  useEffect(() => {
    api
      .get("/clients")
      .then((res) => setClients(res.data))
      .catch(() => toast.error("Failed to load clients"));
  }, []);

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number,
  ) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      updated[index].amount = updated[index].quantity * updated[index].rate;
    }
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { description: "", quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * tax) / 100;
  const total = subtotal + taxAmount;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return toast.error("Please select a client");
    if (lineItems.some((item) => !item.description || item.rate === 0))
      return toast.error("Please fill all line items");
    setLoading(true);
    try {
      const res = await api.post("/invoices", {
        clientId,
        lineItems,
        tax,
        dueDate,
        notes,
      });
      toast.success("Invoice created!");
      navigate(`/invoices/${res.data._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <nav style={styles.nav}>
        <div style={styles.logo}>📄 InvoiceNG</div>
        <div style={styles.navLinks}>
          <Link to="/dashboard" style={styles.navLink}>
            Dashboard
          </Link>
          <Link to="/clients" style={styles.navLink}>
            Clients
          </Link>
          <Link
            to="/invoices/new"
            style={{ ...styles.navLink, color: "#6366f1" }}
          >
            New Invoice
          </Link>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </nav>

      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>New Invoice</h1>
            <p style={styles.subtitle}>Create a professional invoice</p>
          </div>
          <Link to="/dashboard" style={styles.backBtn}>
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            {/* Left column */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {/* Client & Date */}
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Invoice Details</h2>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={styles.group}>
                    <label style={styles.label}>Client *</label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      required
                      style={styles.input}
                    >
                      <option value="">Select a client</option>
                      {clients.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} {c.company ? `— ${c.company}` : ""}
                        </option>
                      ))}
                    </select>
                    {clients.length === 0 && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#f59e0b",
                          marginTop: "4px",
                        }}
                      >
                        No clients yet.{" "}
                        <Link to="/clients" style={{ color: "#6366f1" }}>
                          Add a client first →
                        </Link>
                      </p>
                    )}
                  </div>
                  <div style={styles.group}>
                    <label style={styles.label}>Due Date *</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.group}>
                    <label style={styles.label}>Tax (%)</label>
                    <input
                      type="number"
                      value={tax}
                      onChange={(e) => setTax(Number(e.target.value))}
                      min="0"
                      max="100"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.group}>
                    <label style={styles.label}>Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Payment terms, thank you note..."
                      rows={3}
                      style={{ ...styles.input, resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — Line Items */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Line Items</h2>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div style={styles.lineHeader}>
                    <span style={{ flex: 3 }}>Description</span>
                    <span style={{ flex: 1, textAlign: "center" }}>Qty</span>
                    <span style={{ flex: 1, textAlign: "center" }}>
                      Rate (₦)
                    </span>
                    <span style={{ flex: 1, textAlign: "right" }}>Amount</span>
                    <span style={{ width: "32px" }}></span>
                  </div>
                  {lineItems.map((item, i) => (
                    <div key={i} style={styles.lineRow}>
                      <input
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(i, "description", e.target.value)
                        }
                        placeholder="Service description"
                        style={{ ...styles.input, flex: 3 }}
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(i, "quantity", Number(e.target.value))
                        }
                        min="1"
                        style={{
                          ...styles.input,
                          flex: 1,
                          textAlign: "center",
                        }}
                      />
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) =>
                          updateLineItem(i, "rate", Number(e.target.value))
                        }
                        min="0"
                        style={{
                          ...styles.input,
                          flex: 1,
                          textAlign: "center",
                        }}
                      />
                      <span
                        style={{
                          flex: 1,
                          textAlign: "right",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b",
                          padding: "12px 0",
                        }}
                      >
                        {formatAmount(item.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLineItem(i)}
                        style={styles.removeBtn}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addLineItem}
                    style={styles.addLineBtn}
                  >
                    + Add Line Item
                  </button>
                </div>

                {/* Totals */}
                <div style={styles.totals}>
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>Subtotal</span>
                    <span style={styles.totalValue}>
                      {formatAmount(subtotal)}
                    </span>
                  </div>
                  <div style={styles.totalRow}>
                    <span style={styles.totalLabel}>Tax ({tax}%)</span>
                    <span style={styles.totalValue}>
                      {formatAmount(taxAmount)}
                    </span>
                  </div>
                  <div
                    style={{
                      ...styles.totalRow,
                      borderTop: "2px solid #e2e8f0",
                      paddingTop: "12px",
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
                        fontWeight: "700",
                        fontSize: "20px",
                        color: "#6366f1",
                      }}
                    >
                      {formatAmount(total)}
                    </span>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? "Creating..." : "📄 Create Invoice →"}
              </button>
            </div>
          </div>
        </form>
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
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: { fontSize: "20px", fontWeight: "800", color: "#6366f1" },
  navLinks: { display: "flex", gap: "24px" },
  navLink: { fontSize: "14px", color: "#64748b", fontWeight: "500" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #e2e8f0",
    color: "#64748b",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
  },
  content: { maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
  },
  title: { fontSize: "28px", fontWeight: "700", color: "#1e293b" },
  subtitle: { fontSize: "14px", color: "#94a3b8", marginTop: "4px" },
  backBtn: { fontSize: "14px", color: "#64748b" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: "24px" },
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "20px",
  },
  group: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", color: "#64748b", fontWeight: "500" },
  input: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#1e293b",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  lineHeader: {
    display: "flex",
    gap: "8px",
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    padding: "0 4px",
  },
  lineRow: { display: "flex", gap: "8px", alignItems: "center" },
  removeBtn: {
    width: "32px",
    height: "36px",
    background: "rgba(239,68,68,0.08)",
    border: "1px solid rgba(239,68,68,0.2)",
    color: "#ef4444",
    borderRadius: "6px",
    fontSize: "18px",
    flexShrink: 0,
  },
  addLineBtn: {
    background: "transparent",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    borderRadius: "8px",
    padding: "10px",
    fontSize: "13px",
    fontWeight: "500",
    marginTop: "4px",
  },
  totals: {
    marginTop: "24px",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: { fontSize: "14px", color: "#64748b" },
  totalValue: { fontSize: "14px", color: "#1e293b", fontWeight: "500" },
  submitBtn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "16px",
    fontSize: "15px",
    fontWeight: "700",
    width: "100%",
  },
};

export default NewInvoice;
