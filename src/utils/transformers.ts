export const transformCollection = (collection: any) => {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    photos: collection.photos?.map((cp: any) => cp.photo) || [], // Extract photo objects, Photos not always included
    photoCount: collection._count?.photos,
  };
}

export const transformCollections = (collections: any[]) => {
  return collections.map(transformCollection);
}

/**
 * Transform photo response to flatten collections
 * Converts: collections[{ photoId, collectionId, collection: {...} }]
 * To: collectionIds[string]
 */
export const transformPhoto = (photo: any) => {
  if (!photo) return null;

  console.log("🔄 Transforming photo:", photo.id);

  return {
    id: photo.id,
    title: photo.title,
    description: photo.description,
    location: photo.location,
    featured: photo.featured,
    visibility: photo.visibility,
    sortOrder: photo.sortOrder,
    metadata: photo.metadata,
    urlSmall: photo.urlSmall,
    urlMedium: photo.urlMedium,
    urlLarge: photo.urlLarge,
    createdAt: photo.createdAt,
    capturedAt: photo.capturedAt,
    updatedAt: photo.updatedAt,
    tags: photo.tags?.map((t: any) => t.tag) || [], // Extract tag strings
    collections: photo.collections?.map((c: any) => ({
      id: c.collection.id,
      name: c.collection.name,
      slug: c.collection.slug,
    })) || [], // Extract collection id, name, slug
  };
}

/**
 * Transform array of photos
 */
export const transformPhotos = (photos: any[]) => {
  return photos.map(transformPhoto);
}