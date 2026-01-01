# Portfolio API Documentation

Base URL: `http://localhost:8080` (development)

---

## Table of Contents
1. [Authentication](#authentication)
2. [Photos](#photos)
3. [Collections](#collections)
4. [Visibility System](#visibility-system)
5. [Scope Parameter](#scope-parameter)
6. [Error Responses](#error-responses)

---

## Authentication

### Register User
Create a new user account.

**Endpoint:** `POST /auth/register`

**Authentication:** None required

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "username": "username"
  }
}
```

**Error Responses:**
- `400` - Missing username or password
- `409` - Username already taken
- `500` - Internal server error

---

### Login
Authenticate an existing user.

**Endpoint:** `POST /auth/login`

**Authentication:** None required

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-id",
    "username": "username"
  }
}
```

**Usage:**
Include token in subsequent protected requests:
```
Authorization: Bearer <token>
```

**Error Responses:**
- `400` - Missing username or password
- `401` - Invalid credentials
- `500` - Internal server error

---

## Photos

### Get Photos (List)
Retrieve a paginated list of photos with optional filtering.

**Endpoint:** `GET /photos`

**Authentication:** Optional (required for `scope=admin`)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 100 | Number of items per page |
| `featured` | boolean | - | Filter by featured status |
| `tag` | string | - | Filter by tag name |
| `collectionId` | string | - | Filter by collection ID |
| `scope` | enum | `public` | Visibility scope: `public`, `collection`, `admin` |

**Scope Behavior:**
- `scope=public` (default): Returns only PUBLIC photos
- `scope=collection`: Returns PUBLIC + COLLECTION_ONLY photos
- `scope=admin`: Returns ALL photos (PUBLIC + COLLECTION_ONLY + PRIVATE)
  - **Requires authentication** - returns 401 if no valid token provided

**Request Examples:**
```bash
# Public access (no auth needed)
GET /photos?page=1&limit=10&scope=public

# Collection scope (no auth needed)
GET /photos?page=1&limit=10&scope=collection

# Admin scope (auth required)
GET /photos?page=1&limit=10&scope=admin
Authorization: Bearer <token>

# With filters
GET /photos?featured=true&tag=landscape&scope=public
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "photo-id",
      "title": "Photo Title",
      "description": "Photo description",
      "location": "Location name",
      "urlSmall": "https://cdn.example.com/small.webp",
      "urlMedium": "https://cdn.example.com/medium.webp",
      "urlLarge": "https://cdn.example.com/large.jpg",
      "featured": false,
      "visibility": "PUBLIC",
      "capturedAt": "2024-01-01T00:00:00.000Z",
      "metadata": {},
      "tags": ["nature", "landscape"],
      "collections": [
        {
          "id": "collection-id",
          "name": "Collection Name",
          "slug": "collection-slug"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Error Responses:**
- `401` - Authentication required for admin scope

---

### Get Photo by ID
Retrieve a single photo by its ID.

**Endpoint:** `GET /photos/:id`

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "photo-id",
    "title": "Photo Title",
    "description": "Photo description",
    "location": "Location name",
    "urlSmall": "https://cdn.example.com/small.webp",
    "urlMedium": "https://cdn.example.com/medium.webp",
    "urlLarge": "https://cdn.example.com/large.jpg",
    "featured": false,
    "visibility": "PUBLIC",
    "capturedAt": "2024-01-01T00:00:00.000Z",
    "metadata": {},
    "tags": ["nature", "landscape"],
    "collections": [
      {
        "id": "collection-id",
        "name": "Collection Name",
        "slug": "collection-slug"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404` - Photo not found

---

### Create Photo 🔒
Upload and create a new photo.

**Endpoint:** `POST /photos`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | file | Yes | Image file (JPEG, PNG, WebP) |
| `title` | string | Yes | Photo title |
| `description` | string | No | Photo description |
| `location` | string | No | Location where photo was taken |
| `featured` | boolean | No | Mark as featured (default: false) |
| `visibility` | enum | No | PUBLIC, COLLECTION_ONLY, PRIVATE (default: PUBLIC) |
| `tags` | string[] | No | Array of tag names |
| `collectionIds` | string[] | No | Array of collection IDs |
| `exif` | string (JSON) | No | EXIF metadata as JSON string |
| `capturedAt` | string (ISO date) | No | Date photo was captured |

**Request Example:**
```bash
curl -X POST http://localhost:8080/photos \
  -H "Authorization: Bearer <token>" \
  -F "image=@photo.jpg" \
  -F "title=Beautiful Sunset" \
  -F "description=Sunset at the beach" \
  -F "location=Bali, Indonesia" \
  -F "featured=true" \
  -F "visibility=PUBLIC" \
  -F "tags[]=sunset" \
  -F "tags[]=beach" \
  -F "collectionIds[]=collection-id-1"
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "photo-id",
    "title": "Beautiful Sunset",
    "description": "Sunset at the beach",
    "location": "Bali, Indonesia",
    "urlSmall": "https://cdn.example.com/small.webp",
    "urlMedium": "https://cdn.example.com/medium.webp",
    "urlLarge": "https://cdn.example.com/large.jpg",
    "featured": true,
    "visibility": "PUBLIC",
    "capturedAt": null,
    "metadata": {},
    "tags": ["sunset", "beach"],
    "collections": [
      {
        "id": "collection-id-1",
        "name": "Collection Name",
        "slug": "collection-slug"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Image Processing:**
The uploaded image is automatically processed into 3 sizes:
- **Small** (300px width): WebP format, quality 75
- **Medium** (1600px width): WebP format, quality 80
- **Large** (2400px width): JPEG format, quality 85

**Error Responses:**
- `400` - Image file is required / Validation error
- `401` - Authentication required
- `403` - Invalid or expired token

---

### Update Photo 🔒
Update an existing photo's metadata.

**Endpoint:** `PUT /photos/:id`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "location": "Updated location",
  "featured": true,
  "visibility": "COLLECTION_ONLY",
  "tags": ["tag1", "tag2"],
  "collectionIds": ["collection-id-1", "collection-id-2"],
  "capturedAt": "2024-01-01T00:00:00.000Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "photo-id",
    "title": "Updated Title",
    // ... full photo object
  }
}
```

**Note:**
- Tags and collections will be **replaced** (not merged) with new values
- Omitted fields remain unchanged

**Error Responses:**
- `400` - Validation error
- `401` - Authentication required
- `403` - Invalid or expired token
- `404` - Photo not found

---

### Delete Photo 🔒
Delete a photo and its associated images from storage.

**Endpoint:** `DELETE /photos/:id`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Photo deleted successfully"
}
```

**Behavior:**
- Deletes all 3 image files (small, medium, large) from Cloudflare R2
- Deletes photo record from database
- Cascades to delete associated tags and collection relationships

**Error Responses:**
- `401` - Authentication required
- `403` - Invalid or expired token
- `404` - Photo not found

---

## Collections

### Get Collections (List)
Retrieve a paginated list of collections.

**Endpoint:** `GET /collections`

**Authentication:** Optional (required for `scope=admin`)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 100 | Number of items per page |
| `scope` | enum | `public` | Visibility scope: `public`, `admin` |

**Scope Behavior:**
- `scope=public` (default): Returns collections with PUBLIC + COLLECTION_ONLY photos only
- `scope=admin`: Returns collections with ALL photos (including PRIVATE)
  - **Requires authentication** - returns 401 if no valid token provided

**Request Examples:**
```bash
# Public access (no auth needed)
GET /collections?page=1&limit=10&scope=public

# Admin scope (auth required)
GET /collections?page=1&limit=10&scope=admin
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "collection-id",
      "name": "Collection Name",
      "slug": "collection-name",
      "description": "Collection description",
      "photoCount": 15,
      "photos": [
        {
          "id": "photo-id",
          "title": "Photo Title",
          "urlSmall": "https://cdn.example.com/small.webp",
          "urlMedium": "https://cdn.example.com/medium.webp",
          "urlLarge": "https://cdn.example.com/large.jpg"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

**Error Responses:**
- `401` - Authentication required for admin scope

---

### Get Collection by Slug
Retrieve a single collection by its slug.

**Endpoint:** `GET /collections/slug/:slug`

**Authentication:** Optional (required for `scope=admin`)

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `scope` | enum | `public` | Visibility scope: `public`, `admin` |

**Scope Behavior:**
- `scope=public` (default): Returns PUBLIC + COLLECTION_ONLY photos
- `scope=admin`: Returns ALL photos (including PRIVATE)
  - **Requires authentication** - returns 401 if no valid token provided

**Request Examples:**
```bash
# Public access
GET /collections/slug/landscapes?scope=public

# Admin access
GET /collections/slug/landscapes?scope=admin
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "collection-id",
    "name": "Collection Name",
    "slug": "collection-name",
    "description": "Collection description",
    "photoCount": 15,
    "photos": [
      {
        "id": "photo-id",
        "title": "Photo Title",
        "urlSmall": "https://cdn.example.com/small.webp",
        "urlMedium": "https://cdn.example.com/medium.webp",
        "urlLarge": "https://cdn.example.com/large.jpg",
        "tags": ["nature", "landscape"]
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401` - Authentication required for admin scope
- `404` - Collection not found

---

### Create Collection 🔒
Create a new collection.

**Endpoint:** `POST /collections`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Collection Name",
  "slug": "custom-slug",  // Optional, auto-generated from name if not provided
  "description": "Collection description"  // Optional
}
```

**Slug Generation:**
If `slug` is not provided, it will be auto-generated from the `name`:
- Converts to lowercase
- Replaces spaces with hyphens
- Removes special characters
- Example: "My Collection" → "my-collection"

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "collection-id",
    "name": "Collection Name",
    "slug": "collection-name",
    "description": "Collection description",
    "photoCount": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Collection with this slug already exists / Validation error
- `401` - Authentication required
- `403` - Invalid or expired token

---

### Update Collection by ID 🔒
Update a collection's metadata by ID.

**Endpoint:** `PUT /collections/:id`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Collection Name",
  "description": "Updated description"
}
```

**Note:** Slug cannot be updated via this endpoint.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "collection-id",
    "name": "Updated Collection Name",
    "slug": "original-slug",
    "description": "Updated description",
    "photoCount": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Authentication required
- `403` - Invalid or expired token
- `404` - Collection not found

---

### Update Collection by Slug 🔒
Update a collection's metadata by slug.

**Endpoint:** `PUT /collections/slug/:slug`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Collection Name",
  "description": "Updated description"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "collection-id",
    "name": "Updated Collection Name",
    "slug": "collection-slug",
    "description": "Updated description",
    "photoCount": 10,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Validation error
- `401` - Authentication required
- `403` - Invalid or expired token
- `404` - Collection not found

---

### Delete Collection by ID 🔒
Delete a collection by ID.

**Endpoint:** `DELETE /collections/:id`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

**Behavior:**
- Deletes collection record from database
- Does NOT delete associated photos
- Deletes only the relationship between photos and the collection

**Error Responses:**
- `401` - Authentication required
- `403` - Invalid or expired token
- `404` - Collection not found

---

### Delete Collection by Slug 🔒
Delete a collection by slug.

**Endpoint:** `DELETE /collections/slug/:slug`

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

**Behavior:**
- Deletes collection record from database
- Does NOT delete associated photos
- Deletes only the relationship between photos and the collection

**Error Responses:**
- `401` - Authentication required
- `403` - Invalid or expired token
- `404` - Collection not found

---

## Visibility System

The API implements a three-level visibility system for photos:

### Visibility Levels

| Level | Value | Behavior |
|-------|-------|----------|
| **Public** | `PUBLIC` | Photo appears everywhere: homepage gallery, collections, search results |
| **Collection Only** | `COLLECTION_ONLY` | Photo appears ONLY in collections it's assigned to, NOT in homepage gallery |
| **Private** | `PRIVATE` | Photo visible ONLY to authenticated admin users, hidden from public |

### Use Cases

- **PUBLIC**: Portfolio highlights, featured work, photos you want everyone to see
- **COLLECTION_ONLY**: Photos that make sense only within specific collections, not standalone
- **PRIVATE**: Drafts, work in progress, photos pending review, admin-only content

### Example Scenarios

1. **Homepage Gallery**: Only PUBLIC photos appear
2. **Collection Page (Public View)**: PUBLIC + COLLECTION_ONLY photos appear
3. **Collection Page (Admin View)**: ALL photos appear (PUBLIC + COLLECTION_ONLY + PRIVATE)
4. **Photo Search**: Respects visibility based on scope parameter

---

## Scope Parameter

The `scope` query parameter controls what data is returned based on visibility levels.

### For Photos API

| Scope Value | Auth Required | Returns | Use Case |
|-------------|---------------|---------|----------|
| `public` (default) | No | PUBLIC photos only | Homepage gallery, public portfolio |
| `collection` | No | PUBLIC + COLLECTION_ONLY photos | Collection pages for public users |
| `admin` | **Yes** | ALL photos | Admin dashboard, CMS interface |

### For Collections API

| Scope Value | Auth Required | Returns | Use Case |
|-------------|---------------|---------|----------|
| `public` (default) | No | Collections with PUBLIC + COLLECTION_ONLY photos | Public collection browsing |
| `admin` | **Yes** | Collections with ALL photos (including PRIVATE) | Admin collection management |

### Authentication Behavior

**Optional Authentication (optionalAuth middleware):**
- Applied to all GET routes for photos and collections
- Validates token if present in Authorization header
- Sets `req.user` if token is valid
- Does NOT fail if token is missing or invalid (for public access)

**Strict Authentication for Admin Scope:**
- Using `scope=admin` **requires** a valid authentication token
- Returns `401 Unauthorized` if no token or invalid token provided
- Frontend should handle this error and fallback to public scope if needed

**Example Error:**
```json
{
  "success": false,
  "message": "Authentication required for admin scope"
}
```

### Frontend Implementation Guide

```javascript
// Fetch photos with admin scope (requires auth)
async function fetchPhotosAdmin(token) {
  try {
    const response = await fetch('/photos?scope=admin', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Token invalid or missing, fallback to public
      return fetchPhotosPublic();
    }

    return await response.json();
  } catch (error) {
    // Handle error
  }
}

// Fetch photos for public (no auth needed)
async function fetchPhotosPublic() {
  const response = await fetch('/photos?scope=public');
  return await response.json();
}

// Fetch collection photos (public + collection_only)
async function fetchPhotosCollection() {
  const response = await fetch('/photos?scope=collection');
  return await response.json();
}
```

---

## Error Responses

### Standard Error Format

```json
{
  "success": false,
  "message": "Error message description",
  "error": "Optional detailed error information"
}
```

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| `400` | Bad Request | Missing required fields, validation errors, malformed data |
| `401` | Unauthorized | Missing authentication token, admin scope without auth |
| `403` | Forbidden | Invalid or expired token |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate username, slug already exists |
| `500` | Internal Server Error | Server-side errors, database issues |

### Common Error Examples

**Missing Token (for protected routes):**
```json
{
  "error": "Access token required"
}
```

**Invalid or Expired Token:**
```json
{
  "error": "Invalid or expired token"
}
```

**Admin Scope Without Auth:**
```json
{
  "success": false,
  "message": "Authentication required for admin scope"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Resource Not Found:**
```json
{
  "success": false,
  "message": "Photo not found"
}
```

**Duplicate Slug:**
```json
{
  "success": false,
  "message": "Collection with this slug already exists"
}
```

---

## Additional Notes

### Image Formats & Optimization
- **Small/Medium sizes**: WebP format for 60-70% smaller file size, optimal for web display
- **Large size**: JPEG format for better download compatibility and quality
- All images maintain aspect ratio and are automatically optimized

### Image Size Recommendations
- **urlSmall** (300px WebP): Thumbnails, list views, mobile displays
- **urlMedium** (1600px WebP): Detail views, modals, desktop displays
- **urlLarge** (2400px JPEG): Full-screen views, downloads, high-resolution needs

### Pagination
- Default page size: 100 items
- Pages are 1-indexed (first page = 1)
- Use `totalPages` to determine if there are more pages

### Slug Generation
- Auto-generated from collection name if not provided
- Lowercase, hyphen-separated
- Special characters removed
- Uniqueness enforced at database level

### Token Management
- JWT tokens are issued on login/register
- Include in Authorization header: `Bearer <token>`
- Frontend should handle token refresh/re-login when tokens expire
- Store tokens securely (httpOnly cookies recommended for production)

### CORS
- Currently enabled for all origins in development
- Configure allowed origins for production deployment

---

**Legend:**
- 🔒 = Requires authentication (Bearer token in Authorization header)
- All timestamps are in ISO 8601 format (UTC)
- All IDs are UUIDs
