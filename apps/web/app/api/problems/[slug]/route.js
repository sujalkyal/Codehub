// apps/web/app/api/problems/[slug]/route.js
//
// This API endpoint fetches the complete details for a single problem,
// identified by its unique slug.

import { NextResponse } from 'next/server';
import prisma from "@repo/db/client";

export async function GET(req, { params }) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json({ error: 'Problem slug is required' }, { status: 400 });
    }

    // 1. Find the unique problem by its slug
    const problem = await prisma.problem.findUnique({
      where: {
        slug: slug,
      },
      // 2. Include all relevant details for the problem page
      select: {
        id: true,
        title: true,
        description: true,
        inputFormat: true,
        outputFormat: true,
        constraints: true,
        difficulty: true,
        // 3. Also include the boilerplate code for each language
        boilerplates: {
          select: {
            id: true,
            code: true,
            fullcode: true,
            language: {
              select: {
                id: true,
                name: true,
                judge0Id: true,
              }
            }
          }
        }
      }
    });

    // 4. If no problem is found, return a 404 error
    if (!problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json(problem, { status: 200 });

  } catch (error) {
    console.error(`Failed to fetch problem ${params.slug}:`, error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
