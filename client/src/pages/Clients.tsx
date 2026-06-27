import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

const Clients = () => {
  const { logout } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await api.get("/clients");
      setClients(res.data);
    } catch (err) {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/clients", form);
      toast.success("Client added!");
      setForm({ name: "", email: "", phone: "", company: "", address: "" });
      setShowForm(false);
      fetchClients();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add client");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try {
      await api.delete(`/clients/${id}`);
      toast.success("Client deleted");
      fetchClients();
    } catch (err) {
      toast.error("Failed to delete client");
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
          <Link to="/clients" style={{ ...styles.navLink, color: "#6366f1" }}>
            Clients
          </Link>
          <Link to="/invoices/new" style={styles.navLink}>
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
            <h1 style={styles.title}>Clients</h1>
            <p style={styles.subtitle}>Manage your client list</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={styles.newBtn}>
            {showForm ? "Cancel" : "+ Add Client"}
          </button>
        </div>

        {showForm && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>Add New Client</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.formGrid}>
                <div style={styles.group}>
                  <label style={styles.label}>Full Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Email *</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john@company.com"
                    required
                    style={styles.input}
                  />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Phone</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="08012345678"
                    style={styles.input}
                  />
                </div>
                <div style={styles.group}>
                  <label style={styles.label}>Company</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Company Ltd"
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.group, gridColumn: "1 / -1" }}>
                  <label style={styles.label}>Address</label>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="123 Street, Lagos"
                    style={styles.input}
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} style={styles.saveBtn}>
                {saving ? "Saving..." : "Save Client"}
              </button>
            </form>
          </div>
        )}

        <div style={styles.tableCard}>
          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : clients.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: "48px" }}>👥</p>
              <p style={{ color: "#94a3b8" }}>
                No clients yet — add your first client!
              </p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={{ fontWeight: "600" }}>{client.name}</span>
                    </td>
                    <td style={styles.td}>{client.email}</td>
                    <td style={styles.td}>{client.phone || "—"}</td>
                    <td style={styles.td}>{client.company || "—"}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleDelete(client._id)}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
  newBtn: {
    background: "#6366f1",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "700",
    border: "none",
  },
  formCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "28px",
    marginBottom: "24px",
  },
  formTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "20px",
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  group: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "13px", color: "#64748b", fontWeight: "500" },
  input: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "12px 16px",
    color: "#1e293b",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  saveBtn: {
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: "700",
    alignSelf: "flex-start",
  },
  tableCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
  },
  empty: { color: "#94a3b8", textAlign: "center", padding: "40px" },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    fontSize: "12px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    borderBottom: "1px solid #f1f5f9",
  },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "16px", fontSize: "14px", color: "#1e293b" },
  deleteBtn: {
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.2)",
    borderRadius: "6px",
    padding: "6px 12px",
    fontSize: "12px",
    fontWeight: "600",
  },
};

export default Clients;
