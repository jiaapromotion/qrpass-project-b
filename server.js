const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
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
    await fetch("https://backend.aisensy.com/campaign/t1/api/v2/push", {
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

    res.send("Registration successful!");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).send("Something went wrong.");
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));