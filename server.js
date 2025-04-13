const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const fetch = require("node-fetch");
const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/register", async (req, res) => {
  const { name, email, phone, amount } = req.body;

  if (!name || !email || !phone || !amount) {
    return res.status(400).send("All fields are required.");
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID;

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, email, phone, amount]],
      },
    });

    // WhatsApp Message via AiSensy
    const waRes = await fetch("https://backend.aisensy.com/campaign/t1/api/v2/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AISENSY_API_KEY}`,
      },
      body: JSON.stringify({
        campaignName: "QRPass Registration",
        destination: `91${phone}`,
        user: {
          name,
          email,
        },
      }),
    });

    const waJson = await waRes.json();
    console.log("✅ WhatsApp API response:", waJson);

    res.send("✅ Registration successful! You’ll get WhatsApp confirmation shortly.");
  } catch (error) {
    console.error("❌ Registration failed:", error);
    res.status(500).send("Something went wrong on the server.");
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
