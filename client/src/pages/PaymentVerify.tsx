import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";

const PaymentVerify = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const reference = localStorage.getItem("pendingPaymentReference");
    const params = new URLSearchParams(window.location.search);
    const urlReference = params.get("reference");
    const finalReference = reference || urlReference;

    if (finalReference) {
      localStorage.removeItem("pendingPaymentReference");
      verifyPayment(finalReference);
    } else {
      toast.error("No payment reference found");
      navigate("/");
    }
  }, []);

  const verifyPayment = async (reference: string) => {
    try {
      const res = await api.get(`/payments/verify/${reference}`);
      toast.success("Payment successful! Invoice marked as paid ✅");
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Payment verification failed");
      navigate("/");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ fontSize: "48px" }}>⏳</div>
      <p style={{ color: "#1e293b", fontSize: "18px", fontWeight: "600" }}>
        Verifying your payment...
      </p>
      <p style={{ color: "#94a3b8", fontSize: "14px" }}>
        Please wait, do not close this page.
      </p>
    </div>
  );
};

export default PaymentVerify;
