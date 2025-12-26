export const transformCollection = (collection: any) => {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    photos: collection.photos.map((cp: any) => cp.photo) || [],
    photoCount: collection._count?.photos,
  };
}

export const transformCollections = (collections: any[]) => {
  return collections.map(transformCollection);
}