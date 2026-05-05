const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'BildyApp API',
    version: '1.0.0',
    description: 'REST API for managing delivery notes between clients and suppliers.',
  },
  servers: [{ url: 'http://localhost:3000/api' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Address: {
        type: 'object',
        properties: {
          street: { type: 'string' },
          number: { type: 'string' },
          postal: { type: 'string' },
          city: { type: 'string' },
          province: { type: 'string' },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'guest'] },
          status: { type: 'string', enum: ['pending', 'active'] },
          company: { $ref: '#/components/schemas/Company' },
        },
      },
      Company: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          cif: { type: 'string' },
          isFreelance: { type: 'boolean' },
          address: { $ref: '#/components/schemas/Address' },
          logo: { type: 'string' },
        },
      },
      Client: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          cif: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          address: { $ref: '#/components/schemas/Address' },
          deleted: { type: 'boolean' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          name: { type: 'string' },
          projectCode: { type: 'string' },
          client: { $ref: '#/components/schemas/Client' },
          address: { $ref: '#/components/schemas/Address' },
          email: { type: 'string' },
          notes: { type: 'string' },
          active: { type: 'boolean' },
          deleted: { type: 'boolean' },
        },
      },
      DeliveryNote: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          format: { type: 'string', enum: ['material', 'hours'] },
          description: { type: 'string' },
          workDate: { type: 'string', format: 'date' },
          material: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          hours: { type: 'number' },
          workers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                hours: { type: 'number' },
              },
            },
          },
          signed: { type: 'boolean' },
          signedAt: { type: 'string', format: 'date-time' },
          pdfPath: { type: 'string' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          statusCode: { type: 'integer' },
          message: { type: 'string' },
        },
      },
      PaginatedClients: {
        type: 'object',
        properties: {
          totalItems: { type: 'integer' },
          totalPages: { type: 'integer' },
          currentPage: { type: 'integer' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Client' } },
        },
      },
      PaginatedProjects: {
        type: 'object',
        properties: {
          totalItems: { type: 'integer' },
          totalPages: { type: 'integer' },
          currentPage: { type: 'integer' },
          data: { type: 'array', items: { $ref: '#/components/schemas/Project' } },
        },
      },
      PaginatedDeliveryNotes: {
        type: 'object',
        properties: {
          totalItems: { type: 'integer' },
          totalPages: { type: 'integer' },
          currentPage: { type: 'integer' },
          data: { type: 'array', items: { $ref: '#/components/schemas/DeliveryNote' } },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/user/register': {
      post: {
        tags: ['User'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', example: 'Password123!' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'User registered, verification email sent' },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['User'],
        summary: 'Update personal profile',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Juan' },
                  lastName: { type: 'string', example: 'Ramos' },
                  nif: { type: 'string', example: '12345678Z' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Profile updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/user/validation': {
      put: {
        tags: ['User'],
        summary: 'Verify email with code',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'code'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  code: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Email verified successfully' },
          400: { description: 'Invalid code', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/user/login': {
      post: {
        tags: ['User'],
        summary: 'Login and receive JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { status: { type: 'string' }, token: { type: 'string' } },
                },
              },
            },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/user/company': {
      patch: {
        tags: ['User'],
        summary: 'Create or update company info',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'cif'],
                properties: {
                  isFreelance: { type: 'boolean' },
                  name: { type: 'string' },
                  cif: { type: 'string' },
                  address: { $ref: '#/components/schemas/Address' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Company saved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Company' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/user/logo': {
      patch: {
        tags: ['User'],
        summary: 'Upload company logo',
        requestBody: {
          required: true,
          content: { 'multipart/form-data': { schema: { type: 'object', properties: { logo: { type: 'string', format: 'binary' } } } } },
        },
        responses: {
          200: { description: 'Logo uploaded' },
          400: { description: 'No file provided', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/user': {
      get: {
        tags: ['User'],
        summary: 'Get current authenticated user',
        responses: {
          200: { description: 'User data', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['User'],
        summary: 'Soft delete user account',
        responses: {
          200: { description: 'Account deactivated' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/client': {
      post: {
        tags: ['Client'],
        summary: 'Create a new client',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'cif', 'email'],
                properties: {
                  name: { type: 'string', example: 'ACME Corp' },
                  cif: { type: 'string', example: 'B12345678' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { $ref: '#/components/schemas/Address' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Client created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'CIF already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Client'],
        summary: 'List all clients (paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'name', in: 'query', schema: { type: 'string' }, description: 'Partial name search' },
          { name: 'sort', in: 'query', schema: { type: 'string', default: 'createdAt' } },
        ],
        responses: {
          200: { description: 'Paginated client list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedClients' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/client/archived': {
      get: {
        tags: ['Client'],
        summary: 'List soft-deleted (archived) clients',
        responses: {
          200: { description: 'Archived clients', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Client' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/client/{id}': {
      get: {
        tags: ['Client'],
        summary: 'Get a specific client by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Client data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Client not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Client'],
        summary: 'Update a client',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  cif: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  phone: { type: 'string' },
                  address: { $ref: '#/components/schemas/Address' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Client updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Client not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'CIF already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Client'],
        summary: 'Archive (soft) or permanently delete a client',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'soft', in: 'query', schema: { type: 'boolean', default: true }, description: 'true = soft delete, false = hard delete' },
        ],
        responses: {
          200: { description: 'Client deleted or archived' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Client not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/client/{id}/restore': {
      patch: {
        tags: ['Client'],
        summary: 'Restore an archived client',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Client restored', content: { 'application/json': { schema: { $ref: '#/components/schemas/Client' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Archived client not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/project': {
      post: {
        tags: ['Project'],
        summary: 'Create a new project',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'projectCode', 'client'],
                properties: {
                  name: { type: 'string', example: 'Office Renovation' },
                  projectCode: { type: 'string', example: 'PRJ-001' },
                  client: { type: 'string', example: '64abc123...' },
                  email: { type: 'string', format: 'email' },
                  notes: { type: 'string' },
                  address: { $ref: '#/components/schemas/Address' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Project created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Project code already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['Project'],
        summary: 'List all projects (paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'name', in: 'query', schema: { type: 'string' } },
          { name: 'client', in: 'query', schema: { type: 'string' } },
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-createdAt' } },
        ],
        responses: {
          200: { description: 'Paginated project list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedProjects' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/project/archived': {
      get: {
        tags: ['Project'],
        summary: 'List archived projects',
        responses: {
          200: { description: 'Archived projects', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/project/{id}': {
      get: {
        tags: ['Project'],
        summary: 'Get a specific project by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Project data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Project not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      put: {
        tags: ['Project'],
        summary: 'Update a project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  projectCode: { type: 'string' },
                  email: { type: 'string' },
                  notes: { type: 'string' },
                  active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Project updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Project not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Project code already in use', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Project'],
        summary: 'Archive (soft) or permanently delete a project',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'soft', in: 'query', schema: { type: 'boolean', default: true } },
        ],
        responses: {
          200: { description: 'Project deleted or archived' },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Project not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/project/{id}/restore': {
      patch: {
        tags: ['Project'],
        summary: 'Restore an archived project',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Project restored', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Archived project not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/deliverynote': {
      post: {
        tags: ['DeliveryNote'],
        summary: 'Create a new delivery note',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['client', 'project', 'format', 'description', 'workDate'],
                properties: {
                  client: { type: 'string', example: '64abc...' },
                  project: { type: 'string', example: '64def...' },
                  format: { type: 'string', enum: ['material', 'hours'] },
                  description: { type: 'string' },
                  workDate: { type: 'string', format: 'date', example: '2025-01-15' },
                  material: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  hours: { type: 'number' },
                  workers: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, hours: { type: 'number' } } } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Delivery note created', content: { 'application/json': { schema: { $ref: '#/components/schemas/DeliveryNote' } } } },
          400: { description: 'Validation error', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      get: {
        tags: ['DeliveryNote'],
        summary: 'List delivery notes (paginated)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'project', in: 'query', schema: { type: 'string' } },
          { name: 'client', in: 'query', schema: { type: 'string' } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['material', 'hours'] } },
          { name: 'signed', in: 'query', schema: { type: 'boolean' } },
          { name: 'from', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter from workDate' },
          { name: 'to', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Filter to workDate' },
          { name: 'sort', in: 'query', schema: { type: 'string', default: '-workDate' } },
        ],
        responses: {
          200: { description: 'Paginated delivery notes', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedDeliveryNotes' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/deliverynote/{id}': {
      get: {
        tags: ['DeliveryNote'],
        summary: 'Get a delivery note by ID (with populated data)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Delivery note with populated user, client, project', content: { 'application/json': { schema: { $ref: '#/components/schemas/DeliveryNote' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['DeliveryNote'],
        summary: 'Delete a delivery note (only if unsigned)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Delivery note deleted' },
          400: { description: 'Cannot delete a signed note', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/deliverynote/pdf/{id}': {
      get: {
        tags: ['DeliveryNote'],
        summary: 'Download delivery note as PDF',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'PDF file stream', content: { 'application/pdf': {} } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'PDF not found or note not signed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/deliverynote/{id}/sign': {
      patch: {
        tags: ['DeliveryNote'],
        summary: 'Sign a delivery note with a base64 signature image',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['signatureData'],
                properties: {
                  signatureData: { type: 'string', description: 'Base64 encoded signature image', example: 'data:image/png;base64,iVBOR...' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Delivery note signed, PDF generated', content: { 'application/json': { schema: { $ref: '#/components/schemas/DeliveryNote' } } } },
          400: { description: 'Already signed or missing signature data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
  },
};

export default swaggerSpec;