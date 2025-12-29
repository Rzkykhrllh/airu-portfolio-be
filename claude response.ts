  Buat file prisma/seed.ts:

  import { PrismaClient } from '@prisma/client';

  const prisma = new PrismaClient();

  async function main() {
    console.log('🌱 Starting seed...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    await prisma.photoTags.deleteMany();
    await prisma.photoCollections.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.collections.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Create Collections first
    const collections = await Promise.all([
      prisma.collections.create({
        data: {
          slug: 'landscapes',
          name: 'Landscapes',
          description: 'Beautiful landscape photography from around the world',
        },
      }),
      prisma.collections.create({
        data: {
          slug: 'urban',
          name: 'Urban Life',
          description: 'City streets, architecture, and urban exploration',
        },
      }),
      prisma.collections.create({
        data: {
          slug: 'nature',
          name: 'Nature',
          description: 'Wildlife, forests, and natural wonders',
        },
      }),
    ]);

    console.log(`✅ Created ${collections.length} collections`);

    // Sample photo data with real images from Picsum
    const photosData = [
      {
        title: 'Mountain Peak at Sunset',
        description: 'Golden hour illuminates the majestic mountain peaks',
        location: 'Swiss Alps, Switzerland',
        featured: true,
        tags: ['landscape', 'mountain', 'sunset'],
        collectionIds: [collections[0].id], // Landscapes
        imageId: '1018', // Picsum photo ID for consistency
      },
      {
        title: 'Tokyo Night Streets',
        description: 'Neon lights reflecting on wet pavement in Shibuya',
        location: 'Tokyo, Japan',
        featured: true,
        tags: ['urban', 'night', 'city'],
        collectionIds: [collections[1].id], // Urban
        imageId: '1031',
      },
      {
        title: 'Forest Path',
        description: 'A serene pathway through ancient woodland',
        location: 'Black Forest, Germany',
        featured: false,
        tags: ['nature', 'forest', 'green'],
        collectionIds: [collections[2].id], // Nature
        imageId: '1015',
      },
      {
        title: 'City Skyline',
        description: 'Downtown skyline during blue hour',
        location: 'New York City, USA',
        featured: true,
        tags: ['urban', 'architecture', 'skyline'],
        collectionIds: [collections[1].id],
        imageId: '1013',
      },
      {
        title: 'Ocean Waves',
        description: 'Crashing waves on a rocky coastline',
        location: 'Big Sur, California',
        featured: false,
        tags: ['landscape', 'ocean', 'water'],
        collectionIds: [collections[0].id],
        imageId: '1016',
      },
      {
        title: 'Desert Dunes',
        description: 'Sand patterns in the morning light',
        location: 'Sahara Desert, Morocco',
        featured: false,
        tags: ['landscape', 'desert', 'sand'],
        collectionIds: [collections[0].id],
        imageId: '1017',
      },
      {
        title: 'Wildlife Portrait',
        description: 'A curious fox in its natural habitat',
        location: 'Yellowstone National Park, USA',
        featured: true,
        tags: ['nature', 'wildlife', 'animal'],
        collectionIds: [collections[2].id],
        imageId: '1025',
      },
      {
        title: 'Street Art',
        description: 'Vibrant mural in the arts district',
        location: 'Berlin, Germany',
        featured: false,
        tags: ['urban', 'art', 'street'],
        collectionIds: [collections[1].id],
        imageId: '1032',
      },
    ];

    // Create photos
    for (const photoData of photosData) {
      const { tags, collectionIds, imageId, ...photoInfo } = photoData;

      await prisma.photo.create({
        data: {
          ...photoInfo,
          // Use Picsum Photos - different sizes for responsive images
          urlSmall: `https://picsum.photos/id/${imageId}/800/600`,
          urlMedium: `https://picsum.photos/id/${imageId}/1600/1200`,
          urlLarge: `https://picsum.photos/id/${imageId}/2400/1800`,
          tags: {
            create: tags.map((tag) => ({ tag })),
          },
          collections: {
            create: collectionIds.map((collectionId) => ({
              collection: { connect: { id: collectionId } },
            })),
          },
        },
      });
    }

    console.log(`✅ Created ${photosData.length} photos with tags and collections`);
    console.log('🎉 Seed completed!');
  }

  main()
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });

  ---
  2. Update package.json

  Tambahkan prisma seed config di package.json:

  {
    "prisma": {
      "seed": "tsx prisma/seed.ts"
    },
    "scripts": {
      // ... existing scripts
      "db:seed": "prisma db seed"
    }
  }

  ---
  3. Install dependency (kalau belum ada)

  npm install -D tsx

  ---
  4. Run Seed

  npm run db:seed

  ---
  Image URLs Explained:

  Pakai Picsum Photos (https://picsum.photos):
  - urlSmall: 800x600 - untuk thumbnails/list view
  - urlMedium: 1600x1200 - untuk detail view
  - urlLarge: 2400x1800 - untuk full resolution/download

  Benefits:
  - ✅ Real photos, bukan placeholder blocks
  - ✅ Consistent - sama photo ID, beda size aja
  - ✅ Free & reliable
  - ✅ No API key needed
  - ✅ CDN-backed

  ---
  Setelah seed, test API:
  # Get all photos
  curl http://localhost:3000/api/photos

  # Get featured only
  curl http://localhost:3000/api/photos?featured=true

  # Filter by tag
  curl http://localhost:3000/api/photos?tag=landscape

  Mau saya bantu run seed-nya, atau kamu mau coba sendiri dulu?

  Todos
  ☐ Create Prisma seed file with dummy photo data
  ☐ Update package.json with seed script
  ☐ Run seed to populate database