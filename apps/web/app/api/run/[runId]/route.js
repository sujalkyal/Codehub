// apps/web/app/api/run/[runId]/route.js
//
// This is the simplified polling endpoint for the "Run" feature.
// It returns the results and cleans up the database entry upon completion.

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

export async function GET(req, { params }) {
  try {
    const { runId } = params;
    const numericId = parseInt(runId, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid Run ID' }, { status: 400 });
    }

    // 1. Fetch only the results for the given run session
    const results = await prisma.submissionTestCaseResult.findMany({
      where: {
        submissionId: numericId,
      },
      select: {
        id: true, // This is the submissionTestCaseResultId
        passed: true,
      },
    });

    if (!results || results.length === 0) {
      // This can happen if the records were already deleted by a previous poll.
      // It's not an error, it just means the job is done.
      return NextResponse.json({ status: 'Completed', results: [] }, { status: 200 });
    }

    // 2. Check if all test cases have been processed (are no longer -1)
    const allFinished = results.every((r) => r.passed !== -1);

    // 3. If the run is complete, return the final results and delete the records.
    if (allFinished) {
      // IMPORTANT: After returning the results, we trigger a delete operation.
      // This cleans up the temporary Submission and SubmissionTestCaseResult records.
      // This assumes a cascading delete is set up in your Prisma schema.
      await prisma.submission.delete({
        where: {
          id: numericId,
        },
      });
      console.log(`Cleaned up Run Session with ID: ${numericId}`);
      
      return NextResponse.json({
        status: 'Completed',
        results: results,
      }, { status: 200 });
    }

    // 4. If still processing, return the current status and results.
    return NextResponse.json({
      status: 'Processing',
      results: results,
    }, { status: 200 });

  } catch (error) {
    console.error('Run Polling Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
