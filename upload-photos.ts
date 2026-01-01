import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import sharp from 'sharp';

// ============================================
// CONFIGURATION - EDIT THIS SECTION
// ============================================
const CONFIG = {
  // Folder yang isinya foto-foto lu
  photoDir: './photos-to-upload',

  // API URL (ganti kalau production)
  apiUrl: 'http://localhost:8080',

  // JWT Token dari login (paste token lu disini)
  token: 'your-jwt-token-here',

  // Default values (optional)
  defaults: {
    featured: false,
    visibility: 'PUBLIC' as const, // 'PUBLIC' | 'COLLECTION_ONLY' | 'PRIVATE'
    tags: [] as string[], // ['landscape', 'nature']
  },

  // Upload settings
  delayBetweenUploads: 1000, // ms delay between uploads (avoid overwhelming server)
  retryAttempts: 3,
  dryRun: false, // Set to true to test without actually uploading
};

// Collection mapping - organize by folder name
// Example: photos-to-upload/bali/*.jpg -> collection "bali"
const COLLECTION_MAP: Record<string, string> = {
  // 'folder-name': 'collection-slug',
  // 'bali': 'bali-trip',
  // 'jakarta': 'jakarta-street',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

interface UploadResult {
  success: boolean;
  file: string;
  error?: string;
}

/**
 * Extract EXIF data from image
 */
async function extractExif(filePath: string): Promise<any> {
  try {
    const metadata = await sharp(filePath).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      density: metadata.density,
      exif: metadata.exif,
      // Add more fields as needed
    };
  } catch (error) {
    console.warn(`⚠️  Could not extract EXIF from ${filePath}`);
    return {};
  }
}

/**
 * Generate clean title from filename
 */
function generateTitle(filename: string): string {
  // Remove extension and clean up
  return path.basename(filename, path.extname(filename))
    .replace(/[-_]/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ') // Remove multiple spaces
    .trim();
}

/**
 * Get collection ID from folder structure
 */
async function getCollectionId(filePath: string): Promise<string | undefined> {
  const dirname = path.basename(path.dirname(filePath));
  const collectionSlug = COLLECTION_MAP[dirname];

  if (!collectionSlug) return undefined;

  try {
    // Fetch collection by slug
    const response = await axios.get(
      `${CONFIG.apiUrl}/collections/slug/${collectionSlug}`
    );
    return response.data.data.id;
  } catch (error) {
    console.warn(`⚠️  Collection not found: ${collectionSlug}`);
    return undefined;
  }
}

/**
 * Upload single photo
 */
async function uploadPhoto(filePath: string, attempt = 1): Promise<UploadResult> {
  try {
    const filename = path.basename(filePath);

    // Read file
    const buffer = fs.readFileSync(filePath);

    // Extract EXIF
    const exif = await extractExif(filePath);

    // Generate title
    const title = generateTitle(filename);

    // Get collection ID (if mapped)
    const collectionId = await getCollectionId(filePath);

    // Create FormData
    const form = new FormData();
    form.append('image', buffer, filename);
    form.append('title', title);
    form.append('featured', CONFIG.defaults.featured.toString());
    form.append('visibility', CONFIG.defaults.visibility);

    if (Object.keys(exif).length > 0) {
      form.append('exif', JSON.stringify(exif));
    }

    if (CONFIG.defaults.tags.length > 0) {
      CONFIG.defaults.tags.forEach(tag => {
        form.append('tags[]', tag);
      });
    }

    if (collectionId) {
      form.append('collectionIds[]', collectionId);
    }

    // Dry run mode
    if (CONFIG.dryRun) {
      console.log(`🔍 [DRY RUN] Would upload: ${filename}`);
      console.log(`   Title: ${title}`);
      console.log(`   Collection: ${collectionId || 'None'}`);
      console.log(`   EXIF: ${Object.keys(exif).length > 0 ? 'Yes' : 'No'}`);
      return { success: true, file: filename };
    }

    // Upload to API
    const response = await axios.post(
      `${CONFIG.apiUrl}/photos`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${CONFIG.token}`,
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    return { success: true, file: filename };
  } catch (error: any) {
    // Retry logic
    if (attempt < CONFIG.retryAttempts) {
      console.log(`⚠️  Retry ${attempt}/${CONFIG.retryAttempts} for ${path.basename(filePath)}...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
      return uploadPhoto(filePath, attempt + 1);
    }

    const errorMsg = error.response?.data?.message || error.message;
    return {
      success: false,
      file: path.basename(filePath),
      error: errorMsg
    };
  }
}

/**
 * Get all image files from directory (recursive)
 */
function getImageFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return files;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Recursive: get files from subdirectories
      files.push(...getImageFiles(fullPath));
    } else if (stat.isFile()) {
      // Check if it's an image file
      if (/\.(jpg|jpeg|png|webp)$/i.test(item)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('📸 Bulk Photo Upload Script\n');

  // Validation
  if (!CONFIG.token || CONFIG.token === 'your-jwt-token-here') {
    console.error('❌ Error: Please set your JWT token in CONFIG.token');
    process.exit(1);
  }

  if (!fs.existsSync(CONFIG.photoDir)) {
    console.error(`❌ Error: Photo directory not found: ${CONFIG.photoDir}`);
    console.log(`\n💡 Create the directory or update CONFIG.photoDir`);
    process.exit(1);
  }

  // Get all image files
  console.log(`📁 Scanning directory: ${CONFIG.photoDir}`);
  const files = getImageFiles(CONFIG.photoDir);

  if (files.length === 0) {
    console.log('❌ No image files found!');
    process.exit(0);
  }

  console.log(`✅ Found ${files.length} image(s)\n`);

  if (CONFIG.dryRun) {
    console.log('🔍 Running in DRY RUN mode (no actual uploads)\n');
  }

  // Upload files
  const results: UploadResult[] = [];
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = path.basename(file);

    console.log(`[${i + 1}/${files.length}] Uploading: ${filename}...`);

    const result = await uploadPhoto(file);
    results.push(result);

    if (result.success) {
      console.log(`   ✅ Success\n`);
      successCount++;
    } else {
      console.log(`   ❌ Failed: ${result.error}\n`);
      failCount++;
    }

    // Delay between uploads
    if (i < files.length - 1) {
      await sleep(CONFIG.delayBetweenUploads);
    }
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 UPLOAD SUMMARY');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Total: ${files.length}`);

  if (failCount > 0) {
    console.log('\n❌ Failed uploads:');
    results
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   - ${r.file}: ${r.error}`);
      });
  }

  console.log('\n✨ Done!\n');
}

// Run the script
main().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
