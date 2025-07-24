// apps/web/app/api/submissions/route.js

import { uploadFile } from "@repo/s3-client";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from "@repo/db"; // Using your shared prisma instance
import axios from 'axios';

const submissionSchema = z.object({
  userId: z.number(),
  problemSlug: z.string(),
  languageId: z.number(),
  code: z.string(),
});

// ================== REAL S3 FETCHING LOGIC ==================
// This function fetches the test cases from S3 for a given problem slug.

async function getTestCasesFromS3(slug) {
  const bucketName = process.env.BUCKET_NAME;
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

/*
// This is the old mock function, now commented out.
async function getTestCasesFromS3(slug) {
  console.log(`Fetching MOCK test cases for slug: ${slug}`);
  if (slug === 'two-sum') {
    return [
      { input: '2 7 11 15\n9', output: '0 1' },
      { input: '3 2 4\n6', output: '1 2' },
      { input: '3 3\n6', output: '0 1' },
    ];
  }
  return [];
}
*/

export async function POST(req) {
  try {
    const body = await req.json();
    const parsedBody = submissionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { userId, problemSlug, languageId, code } = parsedBody.data;

    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
    });
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    const testCases = await getTestCasesFromS3(problemSlug);
    if (testCases.length === 0) {
      return NextResponse.json({ error: 'No test cases found' }, { status: 404 });
    }

    // 1. Create the main Submission record
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        languageId,
        code,
        statusId: 2, // Status: "Processing"
      },
    });

    // 2. Create SubmissionTestCaseResult records and dispatch jobs
    const judge0Promises = testCases.map(async (testCase) => {
      // The ID is created FIRST
      const resultRecord = await prisma.submissionTestCaseResult.create({
        data: {
          submissionId: submission.id,
          passed: null, // `null` correctly indicates a pending status
        },
      });

      // The callback URL uses the ID we just created
      const callbackUrl = `${process.env.WEBHOOK_URL}/api/webhook?submissionTestCaseResultId=${resultRecord.id}`;
      
      console.log(`Dispatching to Judge0 with callback: ${callbackUrl}`);

      // Return the axios post promise
      return axios.post(
        `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
        {
          source_code: code,
          language_id: languageId,
          stdin: testCase.input,
          expected_output: testCase.output,
          callback_url: callbackUrl,
        }
      );
    });

    // 3. Dispatch all jobs to Judge0 without waiting for them to complete
    Promise.all(judge0Promises).catch(err => {
        console.error("Error dispatching to Judge0:", err.message);
        // Optionally update submission status to an error state here if dispatch fails
    });

    // 4. Return immediately with the submission ID for the frontend to poll
    return NextResponse.json({ submissionId: submission.id }, { status: 202 }); // 202 Accepted

  } catch (error) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
