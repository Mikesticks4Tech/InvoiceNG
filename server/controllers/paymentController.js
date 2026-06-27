const paystackRequest = require("../utils/paystack");
const Invoice = require("../models/Invoice");

exports.initializePayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client", "name email")
      .populate("user", "name email businessName");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    if (invoice.status === "paid")
      return res.status(400).json({ message: "Invoice already paid" });

    const reference = `inv_${invoice._id}_${Date.now()}`;

    const businessName =
      invoice.user?.businessName || invoice.user?.name || "InvoiceNG";

    const response = await paystackRequest.post("/transaction/initialize", {
      email: invoice.client.email,
      amount: invoice.total * 100,
      reference,
      metadata: {
        invoiceId: invoice._id.toString(),
        invoiceNumber: invoice.invoiceNumber,
        businessName,
      },
      callback_url: `${process.env.CLIENT_URL}/payment/verify`,
    });

    invoice.paystackReference = reference;
    await invoice.save();

    res.status(200).json({
      message: "Payment initialized",
      authorizationUrl: response.data.data.authorization_url,
      reference,
    });
  } catch (err) {
    console.log("Payment ERROR:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
