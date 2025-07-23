// apps/web/app/api/run/route.js
//
// This API endpoint is for the "Run" button. It executes code against
// the first 3 sample test cases and returns the results immediately.
// It uses Judge0's synchronous `wait=true` mode and does NOT create
// any permanent records in the database.
const { NextResponse } = require('next/server');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Zod schema for validating the incoming request
const runSchema = z.object({
  problemSlug: z.string(),
  languageId: z.number(),
  code: z.string(),
});

// Mock S3 function - this can be the same one used for submissions.
async function getTestCasesFromS3(slug) {
  console.log(`Fetching MOCK test cases for slug: ${slug}`);
  if (slug === 'two-sum') {
    return [
      { input: '2 7 11 15\n9', output: '0 1' }, // Sample 1
      { input: '3 2 4\n6', output: '1 2' },     // Sample 2
      { input: '3 3\n6', output: '0 1' },     // Sample 3
      { input: '10 20\n30', output: '0 1' },   // This is a hidden test case and will be ignored by "Run"
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

    const { problemSlug, languageId, code } = parsedBody.data;

    // 1. Fetch all test cases and take only the first three as samples
    const allTestCases = await getTestCasesFromS3(problemSlug);
    const sampleTestCases = allTestCases.slice(0, 3);

    if (sampleTestCases.length === 0) {
      return NextResponse.json({ error: 'No sample test cases found for this problem' }, { status: 404 });
    }

    // 2. Process each sample test case synchronously
    const results = [];
    for (const testCase of sampleTestCases) {
      // Call Judge0 and wait for the result
      console.log(`Running sample test case...`);
      const judge0Response = await axios.post(
        `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
        {
          source_code: code,
          language_id: languageId,
          stdin: testCase.input,
          expected_output: testCase.output,
        }
      );

      const resultData = judge0Response.data;
      results.push({
        status: resultData.status,
        stdout: resultData.stdout,
        stderr: resultData.stderr,
        compile_output: resultData.compile_output,
        expected_output: testCase.output,
        input: testCase.input,
      });
    }

    // 3. Return the array of detailed results directly to the frontend
    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('Run Code Error:', error.response ? error.response.data : error.message);
    return NextResponse.json({ error: 'An internal server error occurred during the run.' }, { status: 500 });
  }
}
