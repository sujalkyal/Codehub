// apps/web/app/api/run/route.js
//
const { NextResponse } = require('next/server');
const { z } = require('zod');
const axios = require('axios');
import prisma from "@repo/db";

const runSchema = z.object({
  userId: z.number(),
  problemSlug: z.string(),
  languageId: z.number(),
  code: z.string(),
});

async function getTestCasesFromS3(slug) {
  console.log(`Fetching MOCK test cases for slug: ${slug}`);
  if (slug === 'two-sum') {
    return [
      { input: '2 7 11 15\n9', output: '0 1' },
      { input: '3 2 4\n6', output: '1 2' },
      { input: '3 3\n6', output: '0 1' },
      { input: '10 20\n30', output: '0 1' },
    ];
  }
  return [];
}

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
      },
    });

    // 2. Create SubmissionTestCaseResult records AND prepare the detailed map for the frontend
    const testCaseMap = [];
    const judge0Promises = [];

    for (const testCase of sampleTestCases) {
      const resultRecord = await prisma.submissionTestCaseResult.create({
        data: {
          submissionId: runSession.id,
          passed: null,
        },
      });

      // Add the detailed info to our map
      testCaseMap.push({
        submissionTestCaseResultId: resultRecord.id,
        input: testCase.input,
        output: testCase.output,
      });

      // Prepare the call to Judge0
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

    // 4. Return immediately with the runId AND the detailed test case map
    return NextResponse.json({
        runId: runSession.id,
        testCases: testCaseMap,
    }, { status: 202 });

  } catch (error) {
    console.error('Run API Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}