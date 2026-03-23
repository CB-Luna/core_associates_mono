import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiClient before importing the matcher
vi.mock('@/lib/api-client', () => ({
  apiClient: vi.fn(),
}));

import { matchIntent, SUGERENCIAS } from '@/lib/chat/intent-matcher';
import { apiClient } from '@/lib/api-client';

const mockDashboard = {
  asociados: { total: 120, activos: 95, pendientes: 15, suspendidos: 5 },
  proveedores: { total: 30, activos: 25 },
  cupones: { delMes: 42 },
  casosLegales: { abiertos: 8 },
  documentos: { pendientes: 12 },
};

const mockAvanzado = {
  asociados: { registrados: 120, porEstado: { activo: 95, pendiente: 15 } },
  cupones: { generados: 200, porEstado: { activo: 100, canjeado: 80, vencido: 20 } },
  casosLegales: {
    porTipo: { accidente: 5, asalto: 3 },
    porEstado: { abierto: 4, en_atencion: 3, resuelto: 1 },
  },
  topProveedores: [
    { razonSocial: 'Taller Pérez', cuponesEmitidos: 50, cuponesCanjeados: 30 },
  ],
};

describe('Intent Matcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClient as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('avanzado')) return Promise.resolve(mockAvanzado);
      return Promise.resolve(mockDashboard);
    });
  });

  it('should match "cuantos asociados hay"', async () => {
    const result = await matchIntent('¿Cuántos asociados hay?');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('count_asociados');
    expect(result!.source).toBe('clasico');
    expect(result!.respuesta).toContain('120');
  });

  it('should match "cuantos proveedores"', async () => {
    const result = await matchIntent('¿Cuántos proveedores tengo?');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('count_proveedores');
    expect(result!.respuesta).toContain('30');
  });

  it('should match "casos abiertos"', async () => {
    const result = await matchIntent('¿Cuántos casos abiertos hay?');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('casos_abiertos');
    expect(result!.respuesta).toContain('8');
  });

  it('should match "cupones mes"', async () => {
    const result = await matchIntent('¿Cupones generados este mes?');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('cupones_mes');
    expect(result!.respuesta).toContain('42');
  });

  it('should match "mejor proveedor" / top proveedor', async () => {
    const result = await matchIntent('¿Cuál es el mejor proveedor?');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('top_proveedor_promociones');
    expect(result!.respuesta).toContain('Taller Pérez');
  });

  it('should match "documentos pendientes"', async () => {
    const result = await matchIntent('¿Documentos pendientes de revisión?');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('docs_pendientes');
    expect(result!.respuesta).toContain('12');
  });

  it('should match comparison asociados vs proveedores', async () => {
    const result = await matchIntent('¿Tengo más asociados que proveedores?');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('compare_asociados_proveedores');
    expect(result!.respuesta).toContain('90 más');
  });

  it('should match "hola"', async () => {
    const result = await matchIntent('Hola');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('saludo');
  });

  it('should match "ayuda"', async () => {
    const result = await matchIntent('ayuda');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('ayuda');
  });

  it('should return null for unknown input', async () => {
    const result = await matchIntent('¿Cómo está el clima hoy?');
    expect(result).toBeNull();
  });

  it('should normalize accents', async () => {
    const result = await matchIntent('cuantos asociados hay');
    expect(result).not.toBeNull();
    expect(result!.intent).toBe('count_asociados');
  });

  it('should export suggestion strings', () => {
    expect(SUGERENCIAS).toBeInstanceOf(Array);
    expect(SUGERENCIAS.length).toBeGreaterThan(0);
  });
});
