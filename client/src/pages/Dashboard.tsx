import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: { name: string; email: string; company: string };
  total: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  createdAt: string;
}

const statusColors: { [key: string]: string } = {
  draft: "#94a3b8",
  sent: "#f59e0b",
  paid: "#22c55e",
  overdue: "#ef4444",
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/invoices");
      setInvoices(res.data);
    } catch (err) {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})
  const totalRevenue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);
  const totalPending = invoices
    .filter((i) => i.status === "sent")
    .reduce((sum, i) => sum + i.total, 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  // Chart data - last 6 months
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.toLocaleString("default", { month: "short" });
    const total = invoices
      .filter((inv) => {
        const invDate = new Date(inv.createdAt);
        return (
          invDate.getMonth() === date.getMonth() &&
          invDate.getFullYear() === date.getFullYear() &&
          inv.status === "paid"
        );
      })
      .reduce((sum, inv) => sum + inv.total, 0);
    return { month, total };
  });

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <nav style={styles.nav}>
        <div style={styles.logo}>📄 InvoiceNG</div>
        <div style={styles.navLinks}>
          <Link to="/dashboard" style={styles.navLink}>
            Dashboard
          </Link>
          <Link to="/clients" style={styles.navLink}>
            Clients
          </Link>
          <Link to="/invoices/new" style={styles.navLink}>
            New Invoice
          </Link>
        </div>
        <div style={styles.navRight}>
          <span style={styles.navUser}>{user?.businessName || user?.name}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </nav>

      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back, {user?.name}</p>
          </div>
          <Link to="/invoices/new" style={styles.newBtn}>
            + New Invoice
          </Link>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Total Revenue</span>
            <span style={{ ...styles.statNum, color: "#22c55e" }}>
              {formatAmount(totalRevenue)}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Pending Payment</span>
            <span style={{ ...styles.statNum, color: "#f59e0b" }}>
              {formatAmount(totalPending)}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Paid Invoices</span>
            <span style={{ ...styles.statNum, color: "#6366f1" }}>
              {paidCount}
            </span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>Overdue</span>
            <span style={{ ...styles.statNum, color: "#ef4444" }}>
              {overdueCount}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div style={styles.chartCard}>
          <h2 style={styles.sectionTitle}>Revenue Overview</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip formatter={(value) => formatAmount(Number(value))} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Invoices */}
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h2 style={styles.sectionTitle}>Recent Invoices</h2>
          </div>
          {loading ? (
            <p style={styles.empty}>Loading...</p>
          ) : invoices.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ fontSize: "48px" }}>📄</p>
              <p style={{ color: "#94a3b8", fontSize: "16px" }}>
                No invoices yet
              </p>
              <Link to="/invoices/new" style={styles.newBtn}>
                Create your first invoice
              </Link>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Invoice</th>
                  <th style={styles.th}>Client</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Due Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id} style={styles.tr}>
                    <td style={styles.td}>
                      <span style={styles.invoiceNum}>{inv.invoiceNumber}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.clientName}>{inv.client?.name}</span>
                      <span style={styles.clientCompany}>
                        {inv.client?.company}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.amount}>
                        {formatAmount(inv.total)}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.date}>
                        {new Date(inv.dueDate).toLocaleDateString("en-NG")}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: `${statusColors[inv.status]}20`,
                          color: statusColors[inv.status],
                          border: `1px solid ${statusColors[inv.status]}40`,
                        }}
                      >
                        {inv.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <Link to={`/invoices/${inv._id}`} style={styles.viewBtn}>
                        View
                      </Link>
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
  navRight: { display: "flex", alignItems: "center", gap: "16px" },
  navUser: { fontSize: "14px", color: "#64748b", fontWeight: "500" },
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
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  statLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  statNum: { fontSize: "28px", fontWeight: "700", color: "#1e293b" },
  chartCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },
  tableCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: "20px",
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
  invoiceNum: { fontWeight: "600", color: "#6366f1", fontFamily: "monospace" },
  clientName: { display: "block", fontWeight: "500" },
  clientCompany: { display: "block", fontSize: "12px", color: "#94a3b8" },
  amount: { fontWeight: "600" },
  date: { color: "#64748b" },
  badge: {
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 10px",
    borderRadius: "99px",
    letterSpacing: "0.06em",
  },
  viewBtn: { color: "#6366f1", fontWeight: "600", fontSize: "13px" },
};

export default Dashboard;
