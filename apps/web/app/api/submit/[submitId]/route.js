// apps/web/app/api/submissions/[submissionId]/route.js
//
// This is the dedicated polling endpoint. The frontend will call this
// repeatedly with a submission ID to check for the final result.

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

export async function GET(req, context) {
  try {
    const { submitId } = await context.params;
    const numericId = parseInt(submitId);
    console.log(`Polling for submission ID: ${numericId}`);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid submission ID' }, { status: 400 });
    }

    // 1. Fetch the submission and its related test case results
    const submission = await prisma.submission.findUnique({
      where: { id: numericId },
      include: { results: true }, // 'results' is the relation to submissionTestCaseResults
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // 2. Check if all test cases have been processed (i.e., are no longer -1)
    const allFinished = submission.results.every((r) => r.passed !== -1);

    // 3. If not all results are in, return the current "Processing" state
    if (!allFinished) {
      const finishedCount = submission.results.filter(r => r.passed !== -1).length;
      return NextResponse.json({
        statusId: 2, // "Processing"
        message: 'Submission is still being processed.',
        finishedCount: finishedCount,
        totalTestCases: submission.results.length,
      }, { status: 200 });
    }

    // 4. If all results ARE in, calculate the final status and update the DB
    // This logic runs only once when the last test case is polled.
    if (submission.statusId === 2) { // Check if status is still "Processing"
        const passedCount = submission.results.filter(r => r.passed === 1).length;
        const allPassed = passedCount === submission.results.length;
        const finalStatusId = allPassed ? 3 : 4; // 3: Accepted, 4: Wrong Answer

        const finalSubmission = await prisma.submission.update({
            where: { id: numericId },
            data: { statusId: finalStatusId },
            include: { results: true },
        });
        
        return NextResponse.json({
            ...finalSubmission,
            passedCount: passedCount,
            totalTestCases: submission.results.length,
        }, { status: 200 });
    } else {
        // If the status is already updated, just return the final submission data
        const passedCount = submission.results.filter(r => r.passed === 1).length;
        return NextResponse.json({
            ...submission,
            passedCount: passedCount,
            totalTestCases: submission.results.length,
        }, { status: 200 });
    }

  } catch (error) {
    console.error('Polling Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}