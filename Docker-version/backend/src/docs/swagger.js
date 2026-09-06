// Hand-written OpenAPI 3 description served at /docs via swagger-ui-express.
// Kept intentionally compact; it documents the public contract and the Bearer
// security scheme.
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ShopSphere API (Node.js/Express)',
    version: '1.0.0',
    description:
      'E-commerce REST API (Express + MySQL). Stateless JWT auth via Authorization: Bearer.',
  },
  servers: [{ url: '/', description: 'This host' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Error: { type: 'object', properties: { message: { type: 'string' } } },
      AuthResponse: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          isAdmin: { type: 'boolean' },
          token: { type: 'string' },
        },
      },
      Product: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          category: { type: 'string' },
          image: { type: 'string' },
          stock: { type: 'integer' },
          rating: { type: 'number' },
          numReviews: { type: 'integer' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/users/signup': {
      post: {
        tags: ['users'],
        security: [],
        summary: 'Register a new user',
        responses: { 201: { description: 'Created' }, 400: { description: 'Bad request' } },
      },
    },
    '/api/users/login': {
      post: {
        tags: ['users'],
        security: [],
        summary: 'Log in',
        responses: { 200: { description: 'OK' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/api/users/profile': {
      get: { tags: ['users'], summary: 'Current user profile', responses: { 200: { description: 'OK' } } },
    },
    '/api/products': {
      get: {
        tags: ['products'],
        security: [],
        summary: 'List products',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: { tags: ['products'], summary: 'Create product (admin, multipart)', responses: { 201: { description: 'Created' } } },
    },
    '/api/products/{id}': {
      get: { tags: ['products'], security: [], summary: 'Get product', responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } } },
      put: { tags: ['products'], summary: 'Update product (admin, multipart)', responses: { 200: { description: 'OK' } } },
      delete: { tags: ['products'], summary: 'Delete product (admin)', responses: { 200: { description: 'OK' } } },
    },
    '/api/orders': {
      post: { tags: ['orders'], summary: 'Create order', responses: { 201: { description: 'Created' } } },
    },
    '/api/orders/myorders': {
      get: { tags: ['orders'], summary: 'List my orders', responses: { 200: { description: 'OK' } } },
    },
    '/api/reviews/{productId}': {
      post: { tags: ['reviews'], summary: 'Create a review', responses: { 201: { description: 'Created' } } },
    },
    '/api/reviews/product/{productId}': {
      get: { tags: ['reviews'], security: [], summary: 'List reviews for a product', responses: { 200: { description: 'OK' } } },
    },
    '/api/admin/stats': { get: { tags: ['admin'], summary: 'Dashboard stats (admin)', responses: { 200: { description: 'OK' } } } },
    '/api/admin/users': { get: { tags: ['admin'], summary: 'List users (admin)', responses: { 200: { description: 'OK' } } } },
    '/api/admin/products': { get: { tags: ['admin'], summary: 'List products (admin)', responses: { 200: { description: 'OK' } } } },
    '/api/admin/users/{id}': { delete: { tags: ['admin'], summary: 'Delete a user (admin)', responses: { 200: { description: 'OK' } } } },
    '/health': { get: { tags: ['health'], security: [], summary: 'Liveness', responses: { 200: { description: 'OK' } } } },
  },
};
