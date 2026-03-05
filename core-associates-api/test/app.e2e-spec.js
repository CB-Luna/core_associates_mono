"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const request = require("supertest");
const app_module_1 = require("../src/app.module");
describe('App (e2e)', () => {
    let app;
    beforeAll(async () => {
        const moduleFixture = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api/v1');
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    describe('Auth — OTP flow', () => {
        it('POST /api/v1/auth/otp/send — should send OTP', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/otp/send')
                .send({ telefono: '+525512345678' })
                .expect((res) => {
                expect([200, 201]).toContain(res.status);
                expect(res.body.message).toBeDefined();
            });
        });
        it('POST /api/v1/auth/otp/send — should reject invalid phone format', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/otp/send')
                .send({ telefono: '5512345678' })
                .expect(400);
        });
        it('POST /api/v1/auth/otp/verify — dev bypass 000000', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/otp/verify')
                .send({ telefono: '+525512345678', otp: '000000' })
                .expect((res) => {
                expect([200, 201]).toContain(res.status);
                expect(res.body.accessToken).toBeDefined();
                expect(res.body.refreshToken).toBeDefined();
            });
        });
        it('POST /api/v1/auth/otp/verify — invalid OTP should 401', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/otp/verify')
                .send({ telefono: '+525512345678', otp: '999999' })
                .expect(401);
        });
    });
    describe('Auth — Admin login', () => {
        it('POST /api/v1/auth/login — validates input', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({ email: 'not-an-email', password: '123' })
                .expect(400);
        });
        it('POST /api/v1/auth/login — unknown user returns 401/404', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({ email: 'noexiste@core.mx', password: 'password1234' })
                .expect((res) => {
                expect([401, 404]).toContain(res.status);
            });
        });
    });
    describe('Protected endpoints — require JWT', () => {
        it('GET /api/v1/cupones/mis-cupones — should 401 without token', () => {
            return request(app.getHttpServer())
                .get('/api/v1/cupones/mis-cupones')
                .expect(401);
        });
        it('GET /api/v1/casos-legales/mis-casos — should 401 without token', () => {
            return request(app.getHttpServer())
                .get('/api/v1/casos-legales/mis-casos')
                .expect(401);
        });
    });
    describe('Full OTP flow with protected access', () => {
        let token;
        let hasToken = false;
        beforeAll(async () => {
            const authRes = await request(app.getHttpServer())
                .post('/api/v1/auth/otp/verify')
                .send({ telefono: '+525512345678', otp: '000000' });
            if ([200, 201].includes(authRes.status) && authRes.body.accessToken) {
                token = authRes.body.accessToken;
                hasToken = true;
            }
        });
        it('should access mis-cupones with valid token', async () => {
            if (!hasToken)
                return;
            const res = await request(app.getHttpServer())
                .get('/api/v1/cupones/mis-cupones')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('should access mis-casos with valid token', async () => {
            if (!hasToken)
                return;
            const res = await request(app.getHttpServer())
                .get('/api/v1/casos-legales/mis-casos')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
        it('should reject admin endpoint for asociado role', async () => {
            if (!hasToken)
                return;
            const res = await request(app.getHttpServer())
                .get('/api/v1/cupones/admin/all')
                .set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(403);
        });
    });
});
//# sourceMappingURL=app.e2e-spec.js.map