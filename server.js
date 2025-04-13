
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { google } = require("googleapis");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, "credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const SPREADSHEET_ID = "1ZnKm2cma8y9k6WMcT1YG3tqCjqq2VBILDEAaCBcyDtA";

app.post("/register", async (req, res) => {
  try {
    const { name, email, phone, amount } = req.body;

    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[name, email, phone, amount]],
      },
    });

    res.status(200).send("Registration successful!");
  } catch (error) {
    console.error("Registration failed:", error.message);
    res.status(500).send("Something went wrong on the server.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
