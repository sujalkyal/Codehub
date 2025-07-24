// apps/web/app/api/run/route.js

import { NextResponse } from 'next/server';
import { z } from 'zod';
import axios from 'axios';
import prisma from "@repo/db/client";
import { downloadFile } from "@repo/s3-client/client"; // Assuming this is the correct import path

const runSchema = z.object({
  userId: z.number(),
  problemSlug: z.string(),
  languageId: z.number(),
  code: z.string(),
});

// ================== REAL S3 FETCHING LOGIC ==================
/**
 * Fetches and parses the test case JSON file from S3 for a given problem slug.
 * @param {string} slug - The unique slug for the problem (e.g., "two-sum").
 * @returns {Promise<Array<{input: string, output: string}>>} A promise that resolves to an array of test cases.
 */
async function getTestCasesFromS3(slug) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  const key = `problems/${slug}/input_output.json`;

  console.log(`Fetching real test cases from S3: s3://${bucketName}/${key}`);

  try {
    const jsonString = await downloadFile({ Bucket: bucketName, Key: key });
    return JSON.parse(jsonString);
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      console.warn(`Test case file not found in S3 for slug: ${slug}`);
      return [];
    }
    console.error(`S3 Error fetching ${key}:`, error);
    throw new Error('Failed to fetch test cases from S3.');
  }
}
// ============================================================

export async function POST(req) {
  try {
    const body = await req.json();
    const parsedBody = runSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userId, problemSlug, languageId, code } = parsedBody.data;
    
    const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
    if (!problem) {
        return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const allTestCases = await getTestCasesFromS3(problemSlug);
    const sampleTestCases = allTestCases.slice(0, 3);

    if (sampleTestCases.length === 0) {
      return NextResponse.json({ error: 'No sample test cases found' }, { status: 404 });
    }

    // 1. Create a temporary Submission record
    const runSession = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        languageId,
        code,
        statusId: 2, // "Processing"
        token: `run-${Date.now()}`, // Add placeholder token
      },
    });

    // 2. Create SubmissionTestCaseResult records and prepare the detailed map for the frontend
    const testCaseMap = [];
    const judge0Promises = [];

    for (const testCase of sampleTestCases) {
      const resultRecord = await prisma.submissionTestCaseResult.create({
        data: {
          passed: -1, // -1 indicates "Processing"
          submission: {
            connect: {
              id: runSession.id,
            },
          },
        },
      });

      testCaseMap.push({
        submissionTestCaseResultId: resultRecord.id,
        input: testCase.input,
        output: testCase.output,
      });

      const callbackUrl = `${process.env.WEBHOOK_URL}/api/webhook?submissionTestCaseResultId=${resultRecord.id}`;
      judge0Promises.push(
        axios.post(
          `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
          {
            source_code: code,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output,
            callback_url: callbackUrl,
          }
        )
      );
    }

    // 3. Dispatch all jobs to Judge0
    Promise.all(judge0Promises).catch(err => console.error("Error dispatching run to Judge0:", err));

    // 4. Return immediately with the runId and the detailed test case map
    return NextResponse.json({
        runId: runSession.id,
        testCases: testCaseMap,
    }, { status: 202 });

  } catch (error) {
    console.error('Run API Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}