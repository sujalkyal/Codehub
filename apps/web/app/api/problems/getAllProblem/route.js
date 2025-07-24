// apps/web/app/api/problems/route.js
//
// This API endpoint fetches a list of all problems from the database,
// intended for display on a main problems page.

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

export async function GET(req) {
  try {
    // 1. Fetch all problems from the database
    console.log('Fetching all problems from the database...');
    const problems = await prisma.problem.findMany({
      // 2. Select only the necessary fields to keep the payload light
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        // 3. Include the names of the tags associated with each problem
        tags: {
          select: {
            tag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: 'asc', // Order by ID to ensure a consistent order
      }
    });

    // 4. Transform the data to a cleaner format for the frontend
    const formattedProblems = problems.map(problem => ({
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      tags: problem.tags.map(pt => pt.tag.name), // Flatten the tags array
    }));

    return NextResponse.json(formattedProblems, { status: 200 });

  } catch (error) {
    console.error('Failed to fetch problems:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
