/*const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const crypto = require("crypto");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Replace with your PhonePe API credentials
const merchantId = "PGTESTPAYUAT";
const merchantKey = "";
const secretKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const baseUrl = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay"; // Change to sandbox URL for testing

// Payment form route
app.get("/", (req, res) => {
  res.send(`
    <form action="/pay" method="POST">
      <label>Amount (in paise):</label><br>
      <input type="number" name="amount" required><br><br>
      
      <label>Customer Phone:</label><br>
      <input type="text" name="phone" required><br><br>
      
      <label>Customer Email:</label><br>
      <input type="email" name="email" required><br><br>
      
      <button type="submit">Pay Now</button>
    </form>
  `);
});

// Payment initiation route
app.post("/pay", async (req, res) => {
  try {
    const { amount, phone, email } = req.body;

    //console.log(req.body);
    
    // Payment request payload
    const payload = {
      merchantId: merchantId,
      transactionId: `TXN_${Date.now()}`, // Unique transaction ID
      amount: parseInt(amount), // Amount in paise
      merchantUserId: phone,
      email: email,
      redirectUrl: "http://localhost:3000/success",
      callbackUrl: "http://localhost:3000/callback",
    };

    //console.log(payload);
    
    // Create HMAC signature
    const payloadString = JSON.stringify(payload);
    //console.log(payloadString);

    const hmac = crypto
      .createHmac("sha256", secretKey)
      .update(payloadString)
      .digest("base64");

    // API request
    const response = await axios.post(`${baseUrl}/initiatePayment`, payload, {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": `${hmac}###${merchantKey}`,
      },
    });

    console.log(response);
    
    if (response.data.success) {
      // Redirect to PhonePe payment page
      res.redirect(response.data.data.paymentUrl);
    } else {
      res.status(400).send(`Payment initiation failed: ${response.data.message}`);
    }
  } catch (error) {
    console.error("Error initiating payment:", error.message);
    res.status(500).send("An error occurred while initiating the payment.");
  }
});

// Success and callback handlers
app.get("/success", (req, res) => {
  res.send("Payment successful! Thank you for your payment.");
});

app.post("/callback", (req, res) => {
  console.log("Payment callback received:", req.body);
  res.status(200).send("Callback received.");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});*/


const express = require("express");
const axios = require("axios");
const uniqid = require("uniqid");
const sha256 = require("sha256");
const app = express();
const port = 3000;

// Test Constants
const PHONE_PE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_INDEX = 1;
const SALT_KEY = "099eb8cd-02cf-4e2a-Baca-3e6c6af10399";

app.get("/pay", (req, res) => {
    const payEndPoint = "/pg/v1/pay";
    const merchantTransactionId = uniqid();

    const payload = {
        merchantId: MERCHANT_ID,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: "user123",
        amount: 30000, // Amount in paisa
        //redirectUrl: `https://localhost:3000/redirect-url/${merchantTransactionId}`,
        redirectUrl : `https://localhost:3000/redirect-url/${merchantTransactionId}`,
        redirectMode: "REDIRECT",
        mobileNumber: "9999999999",
        paymentInstrument: {
            type: "PAY_PAGE",
        },
    };

    const bufferObj = Buffer.from(JSON.stringify(payload), "utf8");
    const base63EncodedPayload = bufferObj.toString("base64");
    const xVerify = sha256(base63EncodedPayload + payEndPoint + SALT_KEY) + "###" + SALT_INDEX;

    const options = {
        method: "post",
        url: `${PHONE_PE_HOST_URL}${payEndPoint}`,
        headers: {
            accept: "text/plain",
            "Content-Type": "application/json",
            "X-VERIFY": xVerify,
        },
        data: {
            request: base63EncodedPayload,
        },
    };

    console.log("Payload:", payload);
    console.log("Encoded Payload:", base63EncodedPayload);
    console.log("X-VERIFY Header:", xVerify);

    axios
        .request(options)
        .then((response) => {
            console.log("Response:", response.data);
            res.send(response.data);
        })
        .catch((error) => {
            console.error("Error:", error.response?.data || error.message);
            res.status(500).send(error.response?.data || error.message);
        });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
