import 'package:flutter_test/flutter_test.dart';

import 'package:core_associates_app/features/promotions/data/models/cupon.dart';
import '../helpers/fixtures.dart';

void main() {
  group('CuponPromocionResumen', () {
    test('fromJson parses correctly', () {
      final resumen = CuponPromocionResumen.fromJson(cuponPromocionJson);

      expect(resumen.titulo, '20% en cambio de aceite');
      expect(resumen.tipoDescuento, 'porcentaje');
      expect(resumen.valorDescuento, 20.0);
    });

    test('fromJson parses valorDescuento from string', () {
      final resumen = CuponPromocionResumen.fromJson({
        ...cuponPromocionJson,
        'valorDescuento': '25',
      });
      expect(resumen.valorDescuento, 25.0);
    });
  });

  group('CuponProveedorResumen', () {
    test('fromJson parses correctly', () {
      final resumen = CuponProveedorResumen.fromJson(cuponProveedorJson);

      expect(resumen.razonSocial, 'El Rápido S.A.');
      expect(resumen.tipo, 'taller');
    });
  });

  group('Cupon', () {
    test('fromJson parses complete JSON correctly', () {
      final cupon = Cupon.fromJson(cuponJson);

      expect(cupon.id, 'cup-1');
      expect(cupon.codigo, 'CUP-ABC123');
      expect(cupon.qrPayload, '{"code":"CUP-ABC123"}');
      expect(cupon.qrFirma, 'firma-hash-xyz');
      expect(cupon.estado, 'activo');
      expect(cupon.fechaCanje, isNull);
      expect(cupon.promocion.titulo, '20% en cambio de aceite');
      expect(cupon.proveedor.razonSocial, 'El Rápido S.A.');
    });

    test('fromJson handles redeemed cupon with fechaCanje', () {
      final cupon = Cupon.fromJson(cuponCanjeadoJson);

      expect(cupon.estado, 'canjeado');
      expect(cupon.fechaCanje, isNotNull);
    });

    test('fromJson defaults qrFirma to empty string', () {
      final cupon = Cupon.fromJson({
        ...cuponJson,
        'qrFirma': null,
      });
      expect(cupon.qrFirma, '');
    });

    test('isActive returns true for activo estado', () {
      final cupon = Cupon.fromJson(cuponJson);
      expect(cupon.isActive, isTrue);
    });

    test('isActive returns false for canjeado estado', () {
      final cupon = Cupon.fromJson(cuponCanjeadoJson);
      expect(cupon.isActive, isFalse);
    });

    test('qrData returns formatted JSON string', () {
      final cupon = Cupon.fromJson(cuponJson);
      expect(
        cupon.qrData,
        '{"payload":{"code":"CUP-ABC123"},"firma":"firma-hash-xyz"}',
      );
    });
  });
}
