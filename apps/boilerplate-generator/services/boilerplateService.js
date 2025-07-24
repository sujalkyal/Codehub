import { uploadFile } from "@repo/s3-client/client";
import { generatePythonBoilerplates } from "./templates/toPython.js";
import { generateJavaBoilerplates } from "./templates/toJava.js";
import { generateCppBoilerplates } from "./templates/toCpp.js";
import prisma from "@repo/db/client";

export async function handleGeneration(problemData, inputOutputFile) {
  // Fix double-escaped newlines in relevant fields
  ["structure", "inputFormat", "outputFormat", "constraints", "sampleInput", "sampleOutput"].forEach(field => {
    if (problemData[field]) {
      problemData[field] = problemData[field].replace(/\\n/g, '\n');
    }
  });
  // debug 
  console.log("[DEBUG] Problem data received for generation:", problemData);
  // create slug from title
  const slug = (problemData.title || '')
    .toLowerCase()
    .normalize('NFD')                       // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '')        // Remove diacritical marks
    .replace(/[^a-z0-9]+/g, '-')            // Replace non-alphanumerics with hyphen
    .replace(/^-+|-+$/g, '');               // Trim leading/trailing hyphens

  // add input and output files to S3
  const inputOutputKey = `problems/${slug}/input_output.json`;

  await uploadFile({
    Bucket: process.env.BUCKET_NAME,
    Key: inputOutputKey,
    Body: inputOutputFile.buffer,
    ContentType: inputOutputFile.mimetype
  });

  // generate boilerplate and full-boilerplate code
  // Generate code for each language
  const structure = problemData.structure;
  const cpp = generateCppBoilerplates(structure);
  const java = generateJavaBoilerplates(structure);
  const python = generatePythonBoilerplates(structure);

  // Get language IDs from DB
  const languages = await prisma.language.findMany({
    where: {
      name: { in: ["C++", "Java", "Python"] }
    }
  });
  const langMap = {};
  languages.forEach(lang => { langMap[lang.name.toLowerCase()] = lang; });

  // create problem in database
  const problem = await prisma.problem.create({
    data: {
      title: problemData.title,
      slug,
      structure: problemData.structure,
      description: problemData.description,
      inputFormat: problemData.inputFormat,
      outputFormat: problemData.outputFormat,
      constraints: problemData.constraints,
      sampleInput: problemData.sampleInput,
      sampleOutput: problemData.sampleOutput,
      difficulty: problemData.difficulty,
    }
  });

  // create ProblemBoilerplate entry in database for each language
  const boilerplates = [
    {
      language: "c++",
      code: cpp.boilerplate,
      fullcode: cpp.fullBoilerplate
    },
    {
      language: "java",
      code: java.boilerplate,
      fullcode: java.fullBoilerplate
    },
    {
      language: "python",
      code: python.boilerplate,
      fullcode: python.fullBoilerplate
    }
  ];

  for (const bp of boilerplates) {
    const lang = langMap[bp.language];
    if (lang) {
      await prisma.problemBoilerplate.create({
        data: {
          problemId: problem.id,
          languageId: lang.id,
          code: bp.code,
          fullcode: bp.fullcode
        }
      });
    }
  }

  // create ProblemTag entries in database for each tag
  for (const tagName of problemData.tags) {
    let tag = await prisma.tag.findUnique({ where: { name: tagName } });
    if (!tag) {
      tag = await prisma.tag.create({ data: { name: tagName } });
    }
    await prisma.problemTag.create({
      data: {
        problemId: problem.id,
        tagId: tag.id
      }
    });
  }

  return problem;
}
