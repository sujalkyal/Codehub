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
    const parsed = payloadSchema.parse(JSON.parse(req.body.json));
    const inputFile = req.files?.input?.[0];
    const outputFile = req.files?.output?.[0];

    if (!inputFile || !outputFile) {
      return res.status(400).json({ error: "Input and Output files are required." });
    }

    const result = await handleGeneration(parsed, inputFile, outputFile);
    res.status(201).json({ message: "Problem created", problemId: result.id });
  } catch (error) {
    console.error("❌ Error generating problem:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
