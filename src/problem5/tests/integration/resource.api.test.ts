import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../src/app';
import { ResourceFactory } from '../factories/resource.factory';

const prisma = new PrismaClient();
const app = createApp();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // Ensure the DB is fully clean after all tests complete
  await prisma.resource.deleteMany();
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean slate before each test
  await prisma.resource.deleteMany();
});

// ── Helpers ─────────────────────────────────────────────────────────────────

const createPayload = (overrides = {}) => ({
  name: 'Test Resource',
  type: 'compute',
  quantity: 5,
  ...overrides,
});

// ── POST /api/resources ──────────────────────────────────────────────────────

describe('POST /api/resources', () => {
  it('creates a resource and returns 201', async () => {
    const res = await request(app).post('/api/resources').send(createPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ name: 'Test Resource', type: 'compute', quantity: 5 });
    expect(res.body.data.id).toBeDefined();
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app).post('/api/resources').send({ type: 'compute' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 when type is missing', async () => {
    const res = await request(app).post('/api/resources').send({ name: 'Test' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ── GET /api/resources ───────────────────────────────────────────────────────

describe('GET /api/resources', () => {
  it('returns paginated list of resources', async () => {
    await ResourceFactory.create(prisma, { name: 'Resource A' });
    await ResourceFactory.create(prisma, { name: 'Resource B' });

    const res = await request(app).get('/api/resources');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('filters by type', async () => {
    await ResourceFactory.create(prisma, { type: 'compute' });
    await ResourceFactory.create(prisma, { type: 'network' });

    const res = await request(app).get('/api/resources?type=compute');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].type).toBe('compute');
  });

  it('filters by status', async () => {
    await ResourceFactory.create(prisma, { status: 'ACTIVE' });
    await ResourceFactory.create(prisma, { status: 'INACTIVE' });

    const res = await request(app).get('/api/resources?status=ACTIVE');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('searches by name', async () => {
    await ResourceFactory.create(prisma, { name: 'Alpha Node' });
    await ResourceFactory.create(prisma, { name: 'Beta Node' });

    const res = await request(app).get('/api/resources?search=alpha');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].name).toBe('Alpha Node');
  });

  it('respects pagination params', async () => {
    await ResourceFactory.createMany(prisma, 5);

    const res = await request(app).get('/api/resources?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.totalPages).toBe(3);
  });
});

// ── GET /api/resources/:id ───────────────────────────────────────────────────

describe('GET /api/resources/:id', () => {
  it('returns the resource by ID', async () => {
    const { id } = await ResourceFactory.create(prisma, { name: 'My Resource' });

    const res = await request(app).get(`/api/resources/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
    expect(res.body.data.name).toBe('My Resource');
  });

  it('returns 404 for unknown ID', async () => {
    const res = await request(app).get('/api/resources/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid UUID format', async () => {
    const res = await request(app).get('/api/resources/not-a-uuid');

    expect(res.status).toBe(400);
  });
});

// ── PUT /api/resources/:id ───────────────────────────────────────────────────

describe('PUT /api/resources/:id', () => {
  it('updates and returns the resource', async () => {
    const { id } = await ResourceFactory.create(prisma, { name: 'Old Name' });

    const res = await request(app).put(`/api/resources/${id}`).send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('New Name');
  });

  it('returns 404 for unknown ID', async () => {
    const res = await request(app)
      .put('/api/resources/00000000-0000-0000-0000-000000000000')
      .send({ name: 'X' });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/resources/:id ────────────────────────────────────────────────

describe('DELETE /api/resources/:id', () => {
  it('soft-deletes and returns success', async () => {
    const { id } = await ResourceFactory.create(prisma);

    const res = await request(app).delete(`/api/resources/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('makes the resource unavailable after deletion', async () => {
    const { id } = await ResourceFactory.create(prisma);
    await request(app).delete(`/api/resources/${id}`);

    const res = await request(app).get(`/api/resources/${id}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent resource', async () => {
    const res = await request(app).delete('/api/resources/00000000-0000-0000-0000-000000000000');

    expect(res.status).toBe(404);
  });
});
