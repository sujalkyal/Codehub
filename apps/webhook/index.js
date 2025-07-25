import express from "express";
import webhookRoute from "./app/api/webhook/route.js"; // Express-compatible router

const app = express();
app.use(express.json());

// All Judge0 webhooks should POST to /webhook?submissionTestCaseResultsId=...
app.use("/webhook", webhookRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
});
