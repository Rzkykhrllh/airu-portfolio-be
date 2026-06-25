import { parentPort } from "worker_threads";

import sharp from "sharp";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

import dotenv from "dotenv";

// load environment variables
dotenv.config();

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true,
});

// size definitions
const sizes = {
  small: { width: 300, quality: 75, format: "webp" as const },
  medium: { width: 1600, quality: 80, format: "webp" as const },
  large: { width: 2400, quality: 85, format: "jpeg" as const },
};

interface WorkerInput {
  buffer: Buffer;
  mimetype: string;
}

interface WorkerOutput {
  success: boolean;
  urls?: {
    urlSmall: string;
    urlMedium: string;
    urlLarge: string;
  };
  error?: string;
}

async function processImage(input: WorkerInput): Promise<WorkerOutput> {
  try {
    const { buffer, mimetype } = input;
    const imageId = uuidv4();

    const uploadPromises = Object.entries(sizes).map(
      // Resize Images
      async ([sizelabel, config]) => {
        let sharpInstance = sharp(buffer).resize(config.width, null, {
          withoutEnlargement: true,
          fit: "inside",
        });

        // Apply format-specific settings
        let resizedBuffer: Buffer;
        let extension: string;
        let contentType: string;

        if (config.format === "webp") {
          resizedBuffer = await sharpInstance
            .webp({
              quality: config.quality,
              effort: 4, // 0-6, higher = better compression but slower
            })
            .toBuffer();

          extension = "webp";
          contentType = "image/webp";
        } else {
          resizedBuffer = await sharpInstance
            .jpeg({
              quality: config.quality,
              progressive: true,
              mozjpeg: true,
            })
            .toBuffer();

          extension = "jpeg";
          contentType = "image/jpeg";
        }

        // Upload to R2
        const key = `photos/${imageId}-${sizelabel}.${extension}`;
        await r2Client.send(
          new PutObjectCommand({
            Bucket: process.env.R2_BUCKET!,
            Key: key,
            Body: resizedBuffer,
            ContentType: contentType,
          }),
        );

        return {
          sizelabel,
          url: `${process.env.R2_PUBLIC_URL}/${key}`,
        };
      },
    );

    const result = await Promise.all(uploadPromises);

    return {
      success: true,
      urls: {
        urlSmall: result.find((r) => r.sizelabel === "small")!.url,
        urlMedium: result.find((r) => r.sizelabel === "medium")!.url,
        urlLarge: result.find((r) => r.sizelabel === "large")!.url,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}

// Listen for messages from the main thread
// Main Program
parentPort?.on("message", async (input: WorkerInput) => {
  const result = await processImage(input);
  parentPort?.postMessage(result);
});
