import express from "express";
import { z } from "zod";
import { handleGeneration } from "../services/boilerplateService.js";

const router = express.Router();

const payloadSchema = z.object({
  title: z.string(),
  description: z.string(),
  structure: z.string(),
  inputFormat: z.string(),
  outputFormat: z.string(),
  constraints: z.string(),
  sampleInput: z.string(),
  sampleOutput: z.string(),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  tags: z.array(z.string())
});

router.post("/", async (req, res) => {
  try {
    console.log("[DEBUG] req.body.json:", req.body?.json);
    let parsed;
    try {
      parsed = payloadSchema.parse(JSON.parse(req.body.json));
    } catch (e) {
      console.error("[DEBUG] Failed to parse payload or schema:", e);
      return res.status(400).json({ error: "Invalid payload: " + e.message });
    }
    console.log("[DEBUG] Parsed payload:", parsed);
    const inputOutputFile = req.files?.input_output?.[0];
    console.log("[DEBUG] inputOutputFile present:", !!inputOutputFile);
    if (!inputOutputFile) {
      return res.status(400).json({ error: "Input file is required." });
    }

    const result = await handleGeneration(parsed, inputOutputFile);
    res.status(201).json({ message: "Problem created", problemId: result.id });
  } catch (error) {
    console.error("❌ Error generating problem:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
