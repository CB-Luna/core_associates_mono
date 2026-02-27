import 'package:flutter_test/flutter_test.dart';

import 'package:core_associates_app/features/profile/data/models/vehiculo.dart';
import '../helpers/fixtures.dart';

void main() {
  group('Vehiculo', () {
    test('fromJson parses complete JSON correctly', () {
      final vehiculo = Vehiculo.fromJson(vehiculoJson);

      expect(vehiculo.id, 'v-1');
      expect(vehiculo.marca, 'Toyota');
      expect(vehiculo.modelo, 'Corolla');
      expect(vehiculo.anio, 2020);
      expect(vehiculo.color, 'Blanco');
      expect(vehiculo.placas, 'ABC-123');
      expect(vehiculo.numeroSerie, '1HGBH41JXMN109186');
      expect(vehiculo.esPrincipal, isTrue);
    });

    test('fromJson handles nullable fields', () {
      final vehiculo = Vehiculo.fromJson({
        'id': 'v-2',
        'marca': 'Nissan',
        'modelo': 'Versa',
        'anio': 2018,
        'color': 'Gris',
        'placas': 'XYZ-789',
      });

      expect(vehiculo.numeroSerie, isNull);
      expect(vehiculo.esPrincipal, isFalse);
    });
  });
}
