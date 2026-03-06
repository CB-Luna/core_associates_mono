import { test, expect } from '@playwright/test';

// ─────────────────────────────────────────────────────────
// 1. LOGIN PAGE (no auth state needed)
// ─────────────────────────────────────────────────────────
test.describe('Login', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // unauthenticated

  test('muestra formulario de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('Iniciar sesión');
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
  });

  test('cartas de usuarios preset visibles', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('button:has-text("Administrador")')).toBeVisible();
    await expect(page.locator('button:has-text("Operador")')).toBeVisible();
    await expect(page.locator('button:has-text("Proveedor")')).toBeVisible();
  });

  test('redirige a login si no hay token', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});

// ─────────────────────────────────────────────────────────
// 2. DASHBOARD (uses stored auth state from setup)
// ─────────────────────────────────────────────────────────
test.describe('Dashboard', () => {
  test('carga sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });

  test('muestra stats cards', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const statsSection = page.locator('.grid').first();
    await expect(statsSection).toBeVisible({ timeout: 10000 });
  });
});

// ─────────────────────────────────────────────────────────
// 3. ASOCIADOS
// ─────────────────────────────────────────────────────────
test.describe('Asociados', () => {
  test('lista asociados sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/asociados');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();
    await expect(
      page.locator('table').or(page.locator('.animate-spin')).or(page.locator('text=No hay datos'))
    ).toBeVisible({ timeout: 10000 });

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });

  test('búsqueda no provoca errores', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/asociados');
    await page.waitForLoadState('networkidle');
    const searchInput = page.locator('input[placeholder*="uscar"]');
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(1500);
      await expect(page.locator('main')).toBeVisible();
    }

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────
// 4. PROVEEDORES
// ─────────────────────────────────────────────────────────
test.describe('Proveedores', () => {
  test('lista proveedores sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/proveedores');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────
// 5. CUPONES
// ─────────────────────────────────────────────────────────
test.describe('Cupones', () => {
  test('lista cupones sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/cupones');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────
// 6. CASOS LEGALES
// ─────────────────────────────────────────────────────────
test.describe('Casos Legales', () => {
  test('lista casos legales sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/casos-legales');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────
// 7. REPORTES
// ─────────────────────────────────────────────────────────
test.describe('Reportes', () => {
  test('carga reportes sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/reportes');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────
// 8. PROMOCIONES
// ─────────────────────────────────────────────────────────
test.describe('Promociones', () => {
  test('lista promociones sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/promociones');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────
// 9. CONFIGURACIÓN
// ─────────────────────────────────────────────────────────
test.describe('Configuración', () => {
  test('carga configuración sin errores JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/configuracion');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('main')).toBeVisible();

    const critical = errors.filter(e => !e.includes('ResizeObserver'));
    expect(critical).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────
// 10. NAVEGACIÓN COMPLETA
// ─────────────────────────────────────────────────────────
test.describe('Navegación completa', () => {
  test('navega por todas las rutas sin errores', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const routes = [
      '/dashboard',
      '/asociados',
      '/proveedores',
      '/promociones',
      '/cupones',
      '/casos-legales',
      '/reportes',
      '/configuracion',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main')).toBeVisible({ timeout: 10000 });
    }

    const critical = errors.filter(
      (e) => !e.includes('ResizeObserver') && !e.includes('hydration')
    );
    expect(critical).toEqual([]);
  });
});
