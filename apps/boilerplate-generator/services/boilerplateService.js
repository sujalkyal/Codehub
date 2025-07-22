import { uploadFile } from "@repo/s3-client";
import { prisma } from "../prisma.js"; // assumes prisma client is setup here
import { v4 as uuidv4 } from "uuid";

export async function handleGeneration(problemData, inputFile, outputFile) {
  // 1. Upload files to S3
  const slug = problemData.slug;
  const inputKey = `problems/${slug}/input.json`;
  const outputKey = `problems/${slug}/output.json`;

  await uploadFile({
    Bucket: process.env.S3_BUCKET,
    Key: inputKey,
    Body: inputFile.buffer,
    ContentType: inputFile.mimetype
  });

  await uploadFile({
    Bucket: process.env.S3_BUCKET,
    Key: outputKey,
    Body: outputFile.buffer,
    ContentType: outputFile.mimetype
  });

  // 2. Create Problem
  const problem = await prisma.problem.create({
    data: {
      ...problemData,
      tags: {
        create: problemData.tags.map(tag => ({
          tag: {
            connectOrCreate: {
              where: { name: tag },
              create: { name: tag }
            }
          }
        }))
      },
      boilerplates: {
        create: problemData.boilerplates.map(bp => ({
          code: bp.code,
          fullcode: bp.fullcode,
          language: { connect: { id: bp.languageId } }
        }))
      }
    }
  });

  return problem;
}
