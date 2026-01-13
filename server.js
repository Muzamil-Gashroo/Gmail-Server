const express = require("express");
const { connectDB, config } = require("./config/config");


const authRoutes = require("./routes/auth");
const emailRoutes = require("./routes/emails");
const trackingRoutes = require("./routes/tracking");

const app = express();


app.use(express.json());
app.use(express.static('public')); 

connectDB();


app.use("/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/track", trackingRoutes);


app.get("/api/debug/config", require("./controllers/trackingController").getConfig);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Tracking Base URL: ${config.TRACKING_BASE_URL}`);
  if (config.TRACKING_BASE_URL === "http://localhost:5000") {
    console.warn("WARNING: Using localhost for tracking. Set NGROK_URL in .env for external tracking!");
  } else {
    console.log(" ngrok configured for external tracking");
  }
});