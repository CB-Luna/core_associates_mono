import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('CRM Admin flow (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let asociadoToken: string;

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

    // Admin login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@coreassociates.com', password: 'Admin2026!' });
    if ([200, 201].includes(loginRes.status)) {
      adminToken = loginRes.body.accessToken;
    }

    // Asociado login via OTP
    const otpRes = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/verify')
      .send({ telefono: '+525510000001', otp: '000000' });
    if ([200, 201].includes(otpRes.status)) {
      asociadoToken = otpRes.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Asociados ────────────────────────────────────────────

  describe('Asociados (admin)', () => {
    it('GET /asociados — paginated list', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/asociados?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta.limit).toBe(5);
    });

    it('GET /asociados — search by name', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/asociados?search=carlos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('GET /asociados — filter by estado', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/asociados?estado=activo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /asociados/:id — detail with relations', async () => {
      if (!adminToken) return;
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/asociados?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (listRes.body.data?.length > 0) {
        const id = listRes.body.data[0].id;
        const res = await request(app.getHttpServer())
          .get(`/api/v1/asociados/${id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(id);
        expect(res.body.nombre).toBeDefined();
      }
    });

    it('GET /asociados — 403 for asociado role', async () => {
      if (!asociadoToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/asociados')
        .set('Authorization', `Bearer ${asociadoToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── Promociones ──────────────────────────────────────────

  describe('Promociones (admin)', () => {
    it('GET /promociones — paginated list', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/promociones')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
    });

    it('GET /promociones/:id — returns detail', async () => {
      if (!adminToken) return;
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/promociones?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (listRes.body.data?.length > 0) {
        const id = listRes.body.data[0].id;
        const res = await request(app.getHttpServer())
          .get(`/api/v1/promociones/${id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.titulo).toBeDefined();
      }
    });
  });

  // ── Cupones flow ─────────────────────────────────────────

  describe('Cupones (admin list + asociado generate)', () => {
    it('GET /cupones/admin/all — admin can list all coupons', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/cupones/admin/all')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('GET /cupones/estadisticas — admin stats', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/cupones/estadisticas')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /cupones/mis-cupones — asociado lists own coupons', async () => {
      if (!asociadoToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/cupones/mis-cupones')
        .set('Authorization', `Bearer ${asociadoToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /cupones — asociado generates coupon', async () => {
      if (!asociadoToken || !adminToken) return;

      // Get a valid promoción
      const promoRes = await request(app.getHttpServer())
        .get('/api/v1/promociones?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (promoRes.body.data?.length > 0) {
        const promocionId = promoRes.body.data[0].id;
        const res = await request(app.getHttpServer())
          .post('/api/v1/cupones')
          .set('Authorization', `Bearer ${asociadoToken}`)
          .send({ promocionId });

        // May succeed or fail if already has one — both are valid
        expect([200, 201, 400, 409]).toContain(res.status);
      }
    });
  });

  // ── Casos legales ────────────────────────────────────────

  describe('Casos legales', () => {
    it('GET /casos-legales — admin lists all cases', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/casos-legales')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it('GET /casos-legales/mis-casos — asociado lists own cases', async () => {
      if (!asociadoToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/casos-legales/mis-casos')
        .set('Authorization', `Bearer ${asociadoToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /casos-legales — 403 for asociado', async () => {
      if (!asociadoToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/casos-legales')
        .set('Authorization', `Bearer ${asociadoToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── Documentos ───────────────────────────────────────────

  describe('Documentos', () => {
    it('GET /documentos/mis-documentos — asociado lists own docs', async () => {
      if (!asociadoToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/documentos/mis-documentos')
        .set('Authorization', `Bearer ${asociadoToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /documentos — admin lists all docs', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/documentos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  // ── Dashboard / Reportes ─────────────────────────────────

  describe('Reportes', () => {
    it('GET /reportes/dashboard — admin gets stats', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/reportes/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('GET /reportes/dashboard — 403 for asociado', async () => {
      if (!asociadoToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/reportes/dashboard')
        .set('Authorization', `Bearer ${asociadoToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ── Menu ─────────────────────────────────────────────────

  describe('Menu', () => {
    it('GET /menu — admin gets menu items', async () => {
      if (!adminToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/menu')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // ── Imagen streaming ─────────────────────────────────────

  describe('Image streaming', () => {
    it('GET /promociones/:id/imagen — streams image or 404', async () => {
      if (!adminToken) return;

      const promoRes = await request(app.getHttpServer())
        .get('/api/v1/promociones?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (promoRes.body.data?.length > 0) {
        const id = promoRes.body.data[0].id;
        const res = await request(app.getHttpServer())
          .get(`/api/v1/promociones/${id}/imagen`)
          .set('Authorization', `Bearer ${adminToken}`);

        // Image exists → 200 with binary, or 404 if no image
        expect([200, 404]).toContain(res.status);
        if (res.status === 200) {
          expect(res.headers['content-type']).toMatch(/^image\//);
        }
      }
    });

    it('GET /asociados/me/foto — asociado gets photo or JSON null', async () => {
      if (!asociadoToken) return;
      const res = await request(app.getHttpServer())
        .get('/api/v1/asociados/me/foto')
        .set('Authorization', `Bearer ${asociadoToken}`);

      // Photo exists → 200 image, or JSON { url: null }
      expect([200]).toContain(res.status);
    });
  });

  // ── Refresh token ────────────────────────────────────────

  describe('Refresh token', () => {
    it('POST /auth/refresh — renews access token', async () => {
      // Get a fresh refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@coreassociates.com', password: 'Admin2026!' });

      if ([200, 201].includes(loginRes.status)) {
        const refreshToken = loginRes.body.refreshToken;
        const res = await request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .send({ refreshToken });

        expect([200, 201]).toContain(res.status);
        expect(res.body.accessToken).toBeDefined();
      }
    });

    it('POST /auth/refresh — rejects invalid token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
    });
  });
});
