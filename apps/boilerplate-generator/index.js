import express from "express";
import multer from "multer";
import generateRoute from "./routes/generate.js";

const app = express();
const upload = multer();

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Boilerplate generator is healthy 🚀" });
});

app.use(express.json());
app.use("/generate", upload.fields([{ name: "input_output" }]), generateRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Boilerplate generator running on port ${PORT}`));
