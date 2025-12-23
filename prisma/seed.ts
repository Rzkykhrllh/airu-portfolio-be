import { PrismaClient } from '@prisma/client';
import { connect } from 'http2';

const prisma = new PrismaClient();

async function main() {
  console.log("-----Starting Seed-----");
  
  console.log("-----Clearing Existing Data-----");
  await prisma.photo.deleteMany();
  // await prisma.collections.deleteMany();
  await prisma.photoCollections.deleteMany()
  await prisma.photoTags.deleteMany()
  
  // console.log("-----Creating Collections-----");
  // const collections = await Promise.all([
  //   prisma.collections.create({
  //     data: {
  //       slug: "portraits",
  //       name: "Portraits",
  //       description: "Captivating portrait photography from around the world",
  //     },
  //   }),
  //   prisma.collections.create({
  //     data: {
  //       slug: "street",
  //       name: "Street Photography",
  //       description: "Dynamic street photography capturing urban life and culture",
  //     },
  //   }),
  //   prisma.collections.create({
  //     data: {
  //       slug: "cityscapes",
  //       name: "Cityscapes",
  //       description: "Stunning cityscape photography showcasing urban skylines and architecture",
  //     },
  //   }),
  // ])
  // console.log(`Created new ${collections.length} collections`);

  const dummyPhotos = require('./dummy_photos.json');
  
  console.log("-----Seeding Photos-----");
  for (const photoData of dummyPhotos) {
    const {tags, collectionIds, imageId, ...photoInfo} = photoData;

    const createdPhoto =  await prisma.photo.create({
      data: {
        ...photoInfo,
        
        // Using picsum for placeholder images
        urlSmall: `https://picsum.photos/id/${imageId}/800/600`,
        urlMedium: `https://picsum.photos/id/${imageId}/1200/900`,
        urlLarge: `https://picsum.photos/id/${imageId}/1600/1200`,
        
        // Create Tags
        tags: {
          create: tags.map((tag: string) => ({tag}))
        },

        collections: {
          create: collectionIds.map((collectionId: string) => ({
            collection: {connect: {id: collectionId} },
          })),
        },
      },
    });
  }
        
  console.log(`Created ${dummyPhotos.length} photos with tags and collections`);
  console.log("-----Seed Completed!-----");
} 

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });