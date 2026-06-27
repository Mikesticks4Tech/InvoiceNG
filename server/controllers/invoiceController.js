const Invoice = require("../models/Invoice");
const Client = require("../models/Client");

exports.createInvoice = async (req, res) => {
  try {
    const { clientId, lineItems, tax, dueDate, notes } = req.body;

    const client = await Client.findOne({ _id: clientId, user: req.user.id });
    if (!client) return res.status(404).json({ message: "Client not found" });

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * (tax || 0)) / 100;
    const total = subtotal + taxAmount;

    // Generate invoice number
    const count = await Invoice.countDocuments({ user: req.user.id });
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    const invoice = new Invoice({
      user: req.user.id,
      client: clientId,
      invoiceNumber,
      lineItems,
      subtotal,
      tax: tax || 0,
      total,
      dueDate,
      notes,
      status: "draft",
    });

    await invoice.save();
    const populated = await Invoice.findById(invoice._id).populate(
      "client",
      "name email company",
    );
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user.id })
      .populate("client", "name email company")
      .sort({ createdAt: -1 });
    res.status(200).json(invoices);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("client", "name email company phone address")
      .populate("user", "name email businessName phone address");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    res.status(200).json(invoice);
  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true },
    ).populate("client", "name email company");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json(invoice);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.status(200).json({ message: "Invoice deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.sendInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status: "sent" },
      { new: true },
    )
      .populate("client", "name email company")
      .populate("user", "name email businessName");

    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    const { sendInvoiceEmail } = require("../utils/email");
    const amount = new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(invoice.total);
    const invoiceUrl = `${process.env.CLIENT_URL}/invoices/${invoice._id}`;

    await sendInvoiceEmail({
      clientEmail: invoice.client.email,
      clientName: invoice.client.name,
      businessName: invoice.user.businessName || invoice.user.name,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      invoiceUrl,
    });

    res.status(200).json({ message: "Invoice sent", invoice });
  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
