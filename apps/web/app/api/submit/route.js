// apps/web/app/api/submissions/route.js

// !! FOR LOCAL TESTING ONLY !!
// This version uses Judge0's `wait=true` parameter to get results immediately,
// bypassing the need for a separate webhook service. This is great for testing
// but not recommended for production, as it can lead to long-running API requests.

// const { NextResponse } = require('next/server');
// const { z } = require('zod');
// const { PrismaClient } = require('@prisma/client');
// const axios = require('axios');

// const prisma = new PrismaClient();

// const submissionSchema = z.object({
//   userId: z.number(),
//   problemSlug: z.string(),
//   languageId: z.number(),
//   code: z.string(),
// });

// // Mock S3 function - perfect for local testing.
// // You can add more problems and test cases here.
// async function getTestCasesFromS3(slug) {
//   console.log(`Fetching MOCK test cases for slug: ${slug}`);
//   if (slug === 'two-sum') {
//     return [
//       { input: '2 7 11 15\n9', output: '0 1' }, // Should pass
//       { input: '3 2 4\n6', output: '1 2' },     // Should pass
//       { input: '3 3\n7', output: '0 1' },     // Should fail
//     ];
//   }
//   // Return empty array for any other slug to simulate "not found"
//   return [];
// }

// export async function POST(req) {
//   try {
//     const body = await req.json();
//     const parsedBody = submissionSchema.safeParse(body);

//     if (!parsedBody.success) {
//       return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
//     }

//     const { userId, problemSlug, languageId, code } = parsedBody.data;

//     // 1. Find the problem
//     const problem = await prisma.problem.findUnique({ where: { slug: problemSlug } });
//     if (!problem) {
//       return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
//     }

//     // 2. Get mock test cases
//     const testCases = await getTestCasesFromS3(problemSlug);
//     if (testCases.length === 0) {
//       return NextResponse.json({ error: 'No test cases found' }, { status: 404 });
//     }

//     // 3. Create the main Submission record with a "Processing" status
//     const submission = await prisma.submission.create({
//       data: {
//         userId,
//         problemId: problem.id,
//         languageId,
//         code,
//         statusId: 2, // Judge0 "Processing" status
//         token: 'local-test-submission',
//       },
//     });

//     // 4. Process each test case synchronously
//     let allTestCasesPassed = true;
//     const submissionTestResults = [];

//     for (const testCase of testCases) {
//       // Call Judge0 and wait for the result
//       console.log(`Sending test case to Judge0 and waiting...`);
//       const judge0Response = await axios.post(
//         // Note: `wait=true` and `base64_encoded=false`
//         `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
//         {
//           source_code: code,
//           language_id: languageId,
//           stdin: testCase.input,
//           expected_output: testCase.output,
//         }
//       );

//       const resultData = judge0Response.data;
//       const passed = resultData.status.id === 3; // 3 is "Accepted" in Judge0

//       if (!passed) {
//         allTestCasesPassed = false;
//       }

//       // Create the SubmissionTestCaseResult with the final result
//       const testCaseResult = await prisma.submissionTestCaseResult.create({
//         data: {
//           submissionId: submission.id,
//           passed: passed,
//           // You could store more details from `resultData` here if needed
//         },
//       });
//       submissionTestResults.push(testCaseResult);
//     }

//     // 5. Update the main submission with the final status
//     const finalStatusId = allTestCasesPassed ? 3 : 4; // 3: Accepted, 4: Wrong Answer
//     const finalSubmission = await prisma.submission.update({
//       where: { id: submission.id },
//       data: {
//         statusId: finalStatusId,
//       },
//       include: {
//         results: true, // Include the individual test case results in the final response
//       },
//     });

//     // 6. Return the final, completed submission object
//     return NextResponse.json(finalSubmission, { status: 201 });

//   } catch (error) {
//     console.error('Submission Error:', error.response ? error.response.data : error.message);
//     return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
//   }
// }


// apps/web/app/api/submissions/route.js

const { NextResponse } = require('next/server');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

const submissionSchema = z.object({
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
    ];
  }
  return [];
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsedBody = submissionSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ error: 'Invalid request body', issues: parsedBody.error.issues }, { status: 400 });
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
      return NextResponse.json({ error: 'No test cases found for this problem' }, { status: 404 });
    }

    // 3. Create the main Submission record with a "Processing" status
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId: problem.id,
        languageId,
        code,
        statusId: 2, // Status: "Processing"
        token: '', 
      },
    });

    // 4. Create SubmissionTestCaseResult records with an initial `null` state
    const testCaseResults = await Promise.all(
      testCases.map((testCase) =>
        prisma.submissionTestCaseResult.create({
          data: {
            submissionId: submission.id,
            passed: null, // CRITICAL: `null` indicates "pending", not yet true or false
          },
        })
      )
    );

    // 5. Dispatch each test case to Judge0
    const judge0Promises = testCaseResults.map((tc, index) => {
      const callbackUrl = `${process.env.WEBHOOK_URL}/api/webhook?submissionTestCaseResultId=${tc.id}`;
      console.log(`Sending to Judge0 with callback: ${callbackUrl}`);
      return axios.post(
        `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
        {
          source_code: code,
          language_id: languageId,
          stdin: testCases[index].input,
          expected_output: testCases[index].output,
          callback_url: callbackUrl,
        }
      );
    });
    await Promise.all(judge0Promises);

    // 6. IMPROVED Polling Logic
    const pollForResults = async () => {
      const interval = 2000; // 2 seconds
      const timeout = 60000; // 60 seconds
      let elapsedTime = 0;

      while (elapsedTime < timeout) {
        const results = await prisma.submissionTestCaseResult.findMany({
          where: { submissionId: submission.id },
        });

        // Check if all test cases have received a result (are not null)
        const allFinished = results.every((r) => r.passed !== null);

        if (allFinished) {
          console.log(`Polling complete for submission ${submission.id}.`);
          return results; // Return all results when finished
        }

        await new Promise(resolve => setTimeout(resolve, interval));
        elapsedTime += interval;
      }

      // If the loop finishes without returning, it timed out
      throw new Error(`Polling timed out for submission ${submission.id}.`);
    };
    
    let finalResults;
    try {
        finalResults = await pollForResults();
    } catch (error) {
        console.error(error.message);
        // Update submission to a "Timeout" status
        await prisma.submission.update({
            where: { id: submission.id },
            data: { statusId: 5 }, // 5: "Time Limit Exceeded" or a custom timeout status
        });
        return NextResponse.json({ error: 'Submission processing timed out.' }, { status: 408 });
    }

    // 7. Calculate final results and update the main submission
    const passedCount = finalResults.filter(r => r.passed === true).length;
    const allPassed = passedCount === testCases.length;
    const finalStatusId = allPassed ? 3 : 4; // 3: Accepted, 4: Wrong Answer

    const finalSubmission = await prisma.submission.update({
        where: { id: submission.id },
        data: { statusId: finalStatusId },
        include: { results: true },
    });

    // 8. Return the final submission object WITH the test case counts
    return NextResponse.json({
        ...finalSubmission,
        passedCount: passedCount,
        totalTestCases: testCases.length,
    }, { status: 201 });

  } catch (error) {
    console.error('Submission Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
