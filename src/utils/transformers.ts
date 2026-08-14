export const transformCollection = (collection: any, includeViewCount = false) => {
  return {
    id: collection.id,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    photos: collection.photos?.map((cp: any) => transformPhoto(cp.photo, includeViewCount)) || [], // Transform photos with full data
    photoCount: collection._count?.photos,
  };
}

export const transformCollections = (collections: any[], includeViewCount = false) => {
  return collections.map((c) => transformCollection(c, includeViewCount));
}

/**
 * Transform photo response to flatten collections
 * Converts: collections[{ photoId, collectionId, collection: {...} }]
 * To: collectionIds[string]
 *
 * `includeViewCount` defaults to false (opt-in, not opt-out) so the view
 * counter — a number the owner explicitly wants kept private, not shown
 * to visitors — never leaks into a public/unauthenticated API response
 * even if a caller forgets to pass the flag. Only the admin-authenticated
 * paths in photo.controller.ts pass `true`.
 */
export const transformPhoto = (photo: any, includeViewCount = false) => {
  if (!photo) return null;

  return {
    id: photo.id,
    title: photo.title,
    description: photo.description,
    location: photo.location,
    featured: photo.featured,
    visibility: photo.visibility,
    sortOrder: photo.sortOrder,
    metadata: photo.metadata,
    ...(includeViewCount ? { viewCount: photo.viewCount } : {}),
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
export const transformPhotos = (photos: any[], includeViewCount = false) => {
  return photos.map((p) => transformPhoto(p, includeViewCount));
}