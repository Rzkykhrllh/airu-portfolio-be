import { Worker } from "worker_threads";
import path from "path";

import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";


interface ImageUrls {
  urlSmall: string;
  urlMedium: string;
  urlLarge: string;
}

interface WorkerResult {
  success: boolean;
  urls?: ImageUrls;
  error?: string;
}

export function uploadImageToR2(
  buffer: Buffer,
  mimetype: string,
): Promise<ImageUrls> {
  return new Promise((resolve, reject) => {
    const isDev = __filename.endsWith(".ts");
    const ext = isDev ? "ts" : "js";
    const workerPath = path.join(__dirname, `../workers/image.worker.${ext}`);

    // Spawn a new worker thread (inherit tsx loader flags in dev)
    const worker = new Worker(workerPath, {
      execArgv: isDev ? process.execArgv : [],
    });

    // send data to the worker
    worker.postMessage({ buffer, mimetype });

    // Listen for messages from the worker
    worker.on("message", (result: WorkerResult) => {
      if (result.success && result.urls) {
        resolve(result.urls);
      } else {
        reject(new Error(result.error || "Unknown error from worker"));
      }

      // Terminate the worker after processing
      worker.terminate();
    });

    // Handle worker errors
    worker.on("error", (err) => {
      reject(err);
      worker.terminate();
    });

    // Handle worker unexpected exit
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, 
  }
)

export async function deleteImageFromR2(imageUrls: ImageUrls): Promise<void> {
  const urls = [imageUrls.urlSmall, imageUrls.urlMedium, imageUrls.urlLarge];
  
  const deletePromises = urls.map(async url => {
    try{
      const urlObj = new URL(url);
      const key = urlObj.pathname.substring(1);

      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
        })
      );

      console.log(`Deleted ${key} from r2`);
    } catch (err) {
      console.error(`Failed to delete image at ${url}:`, err);
    }
  });

  await Promise.all(deletePromises);
}