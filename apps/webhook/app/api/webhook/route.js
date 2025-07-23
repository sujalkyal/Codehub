// apps/webhook/app/api/webhook/route.js
//
// This webhook has a single responsibility: to receive a callback from Judge0
// and update the corresponding SubmissionTestCaseResult record in the database.
// It does NOT update the parent Submission status.

const { NextResponse } = require('next/server');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Zod schema to validate the incoming callback data from Judge0.
const judge0CallbackSchema = z.object({
  status: z.object({
    id: z.number(), // The status ID (e.g., 3 for Accepted)
  }),
  // We only need the status, but it's good practice to define other expected fields
  stdout: z.string().nullable(),
  stderr: z.string().nullable(),
  token: z.string(),
});

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const submissionTestCaseResultId = searchParams.get('submissionTestCaseResultId');

  // 1. Validate that the required ID is present in the URL
  if (!submissionTestCaseResultId) {
    console.error('Webhook Error: Missing submissionTestCaseResultId query parameter.');
    return NextResponse.json({ error: 'Missing submissionTestCaseResultId' }, { status: 400 });
  }

  const numericId = parseInt(submissionTestCaseResultId, 10);
  if (isNaN(numericId)) {
    console.error(`Webhook Error: Invalid submissionTestCaseResultId format: ${submissionTestCaseResultId}`);
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsedBody = judge0CallbackSchema.safeParse(body);

    // 2. Validate the body of the request from Judge0
    if (!parsedBody.success) {
      console.error('Webhook Error: Invalid callback body from Judge0 for ID:', numericId, parsedBody.error);
      return NextResponse.json({ error: 'Invalid callback body' }, { status: 400 });
    }

    const { status } = parsedBody.data;

    // 3. Determine the outcome. Judge0 status ID 3 means "Accepted".
    const passed = status.id === 3;

    // 4. Update the single SubmissionTestCaseResult record in the database.
    // This is the webhook's only database operation.
    await prisma.submissionTestCaseResult.update({
      where: {
        id: numericId,
      },
      data: {
        passed: passed,
      },
    });

    console.log(`Successfully processed webhook for SubmissionTestCaseResult ID: ${numericId}. Result: ${passed ? 'Passed' : 'Failed'}`);

    // 5. Acknowledge receipt to Judge0
    return NextResponse.json({ message: 'Webhook received successfully.' }, { status: 200 });

  } catch (error) {
    console.error(`Webhook Error for ID ${numericId}:`, error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
