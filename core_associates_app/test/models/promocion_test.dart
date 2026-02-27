import 'package:flutter_test/flutter_test.dart';

import 'package:core_associates_app/features/promotions/data/models/promocion.dart';
import '../helpers/fixtures.dart';

void main() {
  group('ProveedorResumen', () {
    test('fromJson parses correctly', () {
      final proveedor = ProveedorResumen.fromJson(proveedorResumenJson);

      expect(proveedor.id, 'prov-1');
      expect(proveedor.razonSocial, 'El Rápido S.A.');
      expect(proveedor.tipo, 'taller');
      expect(proveedor.logotipoUrl, 'https://example.com/logo.png');
    });

    test('fromJson handles null logotipoUrl', () {
      final proveedor = ProveedorResumen.fromJson({
        'id': 'prov-2',
        'razonSocial': 'Test',
        'tipo': 'comida',
      });
      expect(proveedor.logotipoUrl, isNull);
    });
  });

  group('Promocion', () {
    test('fromJson parses complete JSON correctly', () {
      final promo = Promocion.fromJson(promocionJson);

      expect(promo.id, 'promo-1');
      expect(promo.titulo, '20% en cambio de aceite');
      expect(promo.tipoDescuento, 'porcentaje');
      expect(promo.valorDescuento, 20.0);
      expect(promo.vigenciaCupon, 7);
      expect(promo.terminos, 'Aplican restricciones');
      expect(promo.maxCupones, 100);
      expect(promo.estado, 'activa');
      expect(promo.proveedor.razonSocial, 'El Rápido S.A.');
    });

    test('fromJson handles nullable fields', () {
      final promo = Promocion.fromJson(promocionMontoJson);

      expect(promo.terminos, isNull);
      expect(promo.imagenUrl, isNull);
      expect(promo.maxCupones, isNull);
    });

    test('fromJson parses valorDescuento from string', () {
      final promo = Promocion.fromJson({
        ...promocionJson,
        'valorDescuento': '15.5',
      });
      expect(promo.valorDescuento, 15.5);
    });

    test('descuentoFormateado shows percentage for porcentaje type', () {
      final promo = Promocion.fromJson(promocionJson);
      expect(promo.descuentoFormateado, '20%');
    });

    test('descuentoFormateado shows dollar amount for monto type', () {
      final promo = Promocion.fromJson(promocionMontoJson);
      expect(promo.descuentoFormateado, '\$200');
    });
  });
}
