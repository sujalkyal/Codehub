import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from "@repo/db/client"; // Using your shared prisma instance
import axios from 'axios';
import { downloadFile } from "@repo/s3-client/client";

const submissionSchema = z.object({
  userId: z.string(),
  problemSlug: z.string(),
  languageId: z.number(),
  code: z.string(),
});

// ================== REAL S3 FETCHING LOGIC ==================
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
    console.log(`Problem found: ${problem.title}`);

    // ================== NEW LOGIC STARTS HERE ==================
    // This is the only new block of code.
    const boilerplate = await prisma.problemBoilerplate.findFirst({
        where: {
            problemId: problem.id,
            languageId: languageId,
        }
    });

    if (!boilerplate || !boilerplate.fullcode || !boilerplate.code) {
      console.warn(`Boilerplate not found for problem: ${problemSlug}, language ID: ${languageId}`);
        return NextResponse.json({ error: 'Boilerplate for this language not found.' }, { status: 404 });
    }

    const finalCode = boilerplate.fullcode.replace(boilerplate.code, code);
    console.log(`Using boilerplate for language ID ${languageId}:`, finalCode);
    // ================== NEW LOGIC ENDS HERE ==================

    const testCases = await getTestCasesFromS3(problemSlug);
    if (testCases.length === 0) {
      return NextResponse.json({ error: 'No test cases found' }, { status: 404 });
    }
    console.log(`Fetched ${testCases.length} test cases for problem: ${problemSlug}`);
    console.log("testCases =", languageId);
    // 1. Create the main Submission record
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        languageId,
        code,
        statusId: 2, // Status: "Processing"
        token: `submission-${Date.now()}`,
      },
    });
    console.log(`Created submission with ID: ${submission.id}`);
    console.log("submission.id =", submission.id, "typeof =", typeof submission.id);

    // const resultrr = await prisma.submissionTestCaseResults.create({
    //   data: {
    //     passed: -1,
    //     submissionId: parseInt(submission.id), // FIX: Use direct ID assignment
    //   },
    // });
    // console.log(`Created result record with ID: ${resultr.id}`);
    // 2. Create submissionTestCaseResults records and dispatch jobs
    const judge0Promises = testCases.map(async (testCase) => {
      // The ID is created FIRST
      const resultRecord = await prisma.submissionTestCaseResults.create({
        data: {
          submissionId: submission.id,
          passed: -1, // -1 indicates "Processing"
        },
      });
      console.log(`Created result record with ID: ${resultRecord.id}`);
      // The callback URL uses the ID we just created
      const callbackUrl = `${process.env.WEBHOOK_URL}?submissionTestCaseResultsId=${resultRecord.id}`;
      
      console.log(`Dispatching to Judge0 with callback: ${callbackUrl}`);
      
      // Return the axios post promise
      return axios.post(
        `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: finalCode, // CHANGED: This now sends the merged code
          language_id: parseInt(54),
          stdin: testCase.input,
          expected_output: testCase.output,
          callback_url: callbackUrl,
        }
      );
    });

    // 3. Dispatch all jobs to Judge0 without waiting for them to complete
    Promise.all(judge0Promises).catch(err => {
        console.error("Error dispatching to Judge0:", err.message);
    });

    // 4. Return immediately with the submission ID for the frontend to poll
    return NextResponse.json({ submissionId: submission.id }, { status: 202 });

  } catch (error) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}