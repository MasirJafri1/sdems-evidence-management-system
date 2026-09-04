import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function testS3() {
  console.log("Testing AWS S3 Connection directly...");
  try {
    const response = await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME!,
        Key: "test-direct-upload.txt",
        Body: Buffer.from("This is a direct test of S3 permissions."),
        ContentType: "text/plain",
        ServerSideEncryption: "AES256",
        Metadata: {
          documentId: "test-doc-id",
          version: "1",
          sha256: "test-hash"
        }
      })
    );
    console.log("✅ AWS S3 Upload SUCCESS!", response);
  } catch (error) {
    console.error("❌ AWS S3 Upload FAILED!");
    console.error(error);
  }
}

testS3();
