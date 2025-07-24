// Express-compatible webhook route handler

import express from "express";
import { z } from "zod";
import prisma from "@repo/db/client";
const router = express.Router();

// Zod schema to validate Judge0 callback
const judge0CallbackSchema = z.object({
  status: z.object({
    id: z.number(),
  }),
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  token: z.string(),
});

// POST /webhook?submissionTestCaseResultId=...
router.post("/", async (req, res) => {
  const submissionTestCaseResultId = req.query.submissionTestCaseResultId;

  if (!submissionTestCaseResultId) {
    console.error("Missing submissionTestCaseResultId");
    return res.status(400).json({ error: "Missing submissionTestCaseResultId" });
  }

  const numericId = parseInt(submissionTestCaseResultId, 10);
  if (isNaN(numericId)) {
    console.error("Invalid ID format:", submissionTestCaseResultId);
    return res.status(400).json({ error: "Invalid ID format" });
  }

  try {
    const parsed = judge0CallbackSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("Invalid Judge0 body:", parsed.error);
      return res.status(400).json({ error: "Invalid callback body" });
    }

    const { status } = parsed.data;
    const passed = status.id === 3;

    await prisma.submissionTestCaseResult.update({
      where: { id: numericId },
      data: { passed },
    });

    console.log(`Webhook processed: ID ${numericId}, Result: ${passed}`);
    return res.status(200).json({ message: "Webhook received successfully." });
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
