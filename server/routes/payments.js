const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/initialize/:id", paymentController.initializePayment);
router.get("/verify/:reference", paymentController.verifyPayment);

module.exports = router;
