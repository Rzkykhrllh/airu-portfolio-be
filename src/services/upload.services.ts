import sharp from "sharp";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

// AWS S3 Configuration
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true
});

interface ImageUrls {
  urlSmall: string;
  urlMedium: string;
  urlLarge: string;
}

// Size Definitions
const sizes = {
  small: 300,
  medium: 1600,
  large: 2400,
};

/**
 * Uploads an single file image to R2.
 * @param fileBuffer - The buffer of the image file to upload from multer.
 * @param mimetype - The MIME type of the image file.
 * @returns An object containing URLs for the small, medium, and large images.
 */
export async function uploadImageToR2(
  fileBuffer: Buffer,
  mimetype: string
): Promise<ImageUrls> {
  // Generate unique image ID and determine file extension
  const imageId = uuidv4(); // Unique identifier for the image
  const extension = mimetype.split("/")[1]; // e.g., "jpeg", "png"


  const uploadPromises = Object.entries(sizes).map(
    async ([sizeLabel, width]) => {
      // Resize Images
      const resizedBuffer = await sharp(fileBuffer)
        .resize(width, null, {
          withoutEnlargement: true,
          fit: "inside",
        })
        .jpeg({ quality: 90 })
        .toBuffer();

      // Upload to R2
      const key = `photos/${imageId}-${sizeLabel}.jpg`;
      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
          Body: resizedBuffer,
          ContentType: "image/jpeg",
        })
      );

      // Return URL
      return {
        sizeLabel,
        url: `${process.env.R2_PUBLIC_URL}/${key}`,
      };
    }
  );


  const result = await Promise.all(uploadPromises);

  return {
    urlSmall: result.find((r) => r.sizeLabel === "small")!.url,
    urlMedium: result.find((r) => r.sizeLabel === "medium")!.url,
    urlLarge: result.find((r) => r.sizeLabel === "large")!.url,
  };
}

/**
 * Delete image files from R2
 * @param imageUrls - Object with urlSmall, urlMedium, urlLarge
 */
export async function deleteImageFromR2(imageUrls: {
  urlSmall: string;
  urlMedium: string;
  urlLarge: string;
}): Promise<void> {
  const urls = [imageUrls.urlSmall, imageUrls.urlMedium, imageUrls.urlLarge];

  const deletePromises = urls.map(async (url) => {
    try {
      // Extract key from URL
      // Example: https://pub-abc.r2.dev/photos/uuid-small.jpg -> photos/uuid-small.jpg
      const urlObj = new URL(url);
      const key = urlObj.pathname.substring(1); // Remove leading "/"

      // Delete from R2
      await r2Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: key,
        })
      );

      console.log(`✅ Deleted from R2: ${key}`);
    } catch (error) {
      console.error(`❌ Failed to delete ${url}:`, error);
      // Don't throw - continue deleting other files even if one fails
    }
  });

  await Promise.all(deletePromises);
}
