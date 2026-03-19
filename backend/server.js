import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config(); // load .env

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("DTMS Backend Running 🚀");
});

// Register API
app.post("/api/register", (req, res) => {
  const { name, email, password } = req.body;

  console.log("Register Data:", req.body);

  res.json({
    message: "User registered successfully",
    user: { name, email }
  });
});

// Login API
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Login Data:", req.body);

  res.json({
    message: "Login successful",
    user: { email }
  });
});

// ✅ Use only ONE PORT
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});