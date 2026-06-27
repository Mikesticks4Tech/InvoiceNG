const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    company: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Client", clientSchema);
