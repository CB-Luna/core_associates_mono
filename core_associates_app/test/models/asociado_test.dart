import 'package:flutter_test/flutter_test.dart';

import 'package:core_associates_app/features/profile/data/models/asociado.dart';
import '../helpers/fixtures.dart';

void main() {
  group('Asociado', () {
    test('fromJson parses complete JSON correctly', () {
      final asociado = Asociado.fromJson(asociadoJson);

      expect(asociado.id, 'uuid-1');
      expect(asociado.idUnico, 'ASC-0001');
      expect(asociado.nombre, 'Juan');
      expect(asociado.apellidoPat, 'Pérez');
      expect(asociado.apellidoMat, 'López');
      expect(asociado.telefono, '+525512345678');
      expect(asociado.email, 'juan@example.com');
      expect(asociado.fechaNacimiento, '1990-01-15');
      expect(asociado.fotoUrl, 'https://example.com/foto.jpg');
      expect(asociado.estado, 'activo');
      expect(asociado.vehiculos, hasLength(1));
      expect(asociado.vehiculos.first.marca, 'Toyota');
    });

    test('fromJson handles minimal JSON with nullable fields', () {
      final asociado = Asociado.fromJson(asociadoMinimalJson);

      expect(asociado.nombre, '');
      expect(asociado.apellidoPat, '');
      expect(asociado.apellidoMat, isNull);
      expect(asociado.email, isNull);
      expect(asociado.fechaNacimiento, isNull);
      expect(asociado.fotoUrl, isNull);
      expect(asociado.vehiculos, isEmpty);
    });

    test('nombreCompleto joins name parts', () {
      final asociado = Asociado.fromJson(asociadoJson);
      expect(asociado.nombreCompleto, 'Juan Pérez López');
    });

    test('nombreCompleto without apellidoMat', () {
      final asociado = Asociado.fromJson({
        ...asociadoJson,
        'apellidoMat': null,
      });
      expect(asociado.nombreCompleto, 'Juan Pérez');
    });

    test('nombreCompleto returns Asociado when name is empty', () {
      final asociado = Asociado.fromJson(asociadoMinimalJson);
      expect(asociado.nombreCompleto, 'Asociado');
    });

    test('iniciales returns first letters of nombre and apellidoPat', () {
      final asociado = Asociado.fromJson(asociadoJson);
      expect(asociado.iniciales, 'JP');
    });

    test('iniciales returns ? when nombre is empty', () {
      final asociado = Asociado.fromJson(asociadoMinimalJson);
      expect(asociado.iniciales, '?');
    });
  });
}
