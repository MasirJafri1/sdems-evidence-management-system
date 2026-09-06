import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  BLOCKCHAIN_RPC_URL: z.string().url().default("http://127.0.0.1:8545"),
  BLOCKCHAIN_CHAIN_ID: z.coerce.number().default(31337),
  BLOCKCHAIN_PRIVATE_KEY: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .default(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    ),
  BLOCKCHAIN_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .default("0x5FbDB2315678afecb367f032d93F642f64180aa3"),
  ELASTICSEARCH_URL: z.string().url().default("http://localhost:9200"),
  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_EMBEDDING_MODEL: z
    .string()
    .default("sentence-transformers/all-minilm-l6-v2"),
  GROQ_API_KEY: z.string().optional().default(""),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
