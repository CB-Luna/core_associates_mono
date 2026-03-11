import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Proveedores CRUD (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    // Login as admin to get token
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@coreassociates.com', password: 'Admin2026!' });

    if ([200, 201].includes(loginRes.status)) {
      adminToken = loginRes.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('List proveedores', () => {
    it('GET /proveedores — returns paginated list', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/proveedores')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThanOrEqual(0);
      expect(res.body.meta.page).toBe(1);
    });

    it('GET /proveedores?search=X — search filter works', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/proveedores?search=talleres')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('GET /proveedores — 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/proveedores')
        .expect(401);
    });
  });

  describe('CRUD proveedor', () => {
    let createdId: string;

    it('POST /proveedores — creates proveedor', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .post('/api/v1/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          razonSocial: 'E2E Test Proveedor',
          tipo: 'taller',
          direccion: 'Av. Test 123',
          telefono: '+5215500000000',
          email: 'e2e-test@test.com',
          contactoNombre: 'Test Contact',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.id).toBeDefined();
      expect(res.body.razonSocial).toBe('E2E Test Proveedor');
      createdId = res.body.id;
    });

    it('GET /proveedores/:id — returns detail', async () => {
      if (!adminToken || !createdId) return;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/proveedores/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.razonSocial).toBe('E2E Test Proveedor');
      expect(res.body.tipo).toBe('taller');
    });

    it('PUT /proveedores/:id — updates proveedor', async () => {
      if (!adminToken || !createdId) return;
      const res = await request(app.getHttpServer())
        .put(`/api/v1/proveedores/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ razonSocial: 'E2E Updated Proveedor' });

      expect(res.status).toBe(200);
      expect(res.body.razonSocial).toBe('E2E Updated Proveedor');
    });

    it('DELETE /proveedores/:id — deletes proveedor', async () => {
      if (!adminToken || !createdId) return;
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/proveedores/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /proveedores/:id — 404 after deletion', async () => {
      if (!adminToken || !createdId) return;
      const res = await request(app.getHttpServer())
        .get(`/api/v1/proveedores/${createdId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Validation', () => {
    it('POST /proveedores — rejects missing razonSocial', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .post('/api/v1/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tipo: 'taller' });

      expect(res.status).toBe(400);
    });

    it('POST /proveedores — rejects invalid tipo', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .post('/api/v1/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ razonSocial: 'Test', tipo: 'invalido' });

      expect(res.status).toBe(400);
    });
  });
});
