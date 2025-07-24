import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import path from "path";

let s3Instance = null;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export function getS3Client() {
  if (!s3Instance) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("Missing AWS credentials");
    }
    s3Instance = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
    console.log("🔹 S3Client initialized");
  }
  return s3Instance;
}

export async function uploadFile({ Bucket, Key, Body, ContentType }) {
  const client = getS3Client();
  await client.send(new PutObjectCommand({ Bucket, Key, Body, ContentType }));
}

export async function downloadFile({ Bucket, Key }) {
  const client = getS3Client();
  const resp = await client.send(new GetObjectCommand({ Bucket, Key }));
  const chunks = [];
  for await (const chunk of resp.Body) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf-8");
}
