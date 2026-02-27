import 'package:flutter_test/flutter_test.dart';

import 'package:core_associates_app/features/legal_support/data/models/caso_legal.dart';
import '../helpers/fixtures.dart';

void main() {
  group('NotaCaso', () {
    test('fromJson parses correctly', () {
      final nota = NotaCaso.fromJson(notaCasoJson);

      expect(nota.id, 'nota-1');
      expect(nota.contenido, 'Se asignó abogado al caso.');
      expect(nota.createdAt, '2026-02-20T12:00:00.000Z');
    });
  });

  group('CasoLegal', () {
    test('fromJson parses complete JSON correctly', () {
      final caso = CasoLegal.fromJson(casoLegalJson);

      expect(caso.id, 'caso-1');
      expect(caso.codigo, 'LEG-001');
      expect(caso.tipoPercance, 'accidente');
      expect(caso.descripcion, 'Choque por alcance en Reforma');
      expect(caso.latitud, 19.4326);
      expect(caso.longitud, -99.1332);
      expect(caso.direccionAprox, 'Av. Reforma 500');
      expect(caso.estado, 'abierto');
      expect(caso.prioridad, 'alta');
      expect(caso.fechaCierre, isNull);
      expect(caso.notas, hasLength(1));
      expect(caso.notas.first.contenido, 'Se asignó abogado al caso.');
    });

    test('fromJson handles minimal JSON with nullable fields', () {
      final caso = CasoLegal.fromJson(casoLegalMinimalJson);

      expect(caso.descripcion, isNull);
      expect(caso.direccionAprox, isNull);
      expect(caso.fechaCierre, isNotNull);
      expect(caso.notas, isEmpty);
    });

    test('fromJson parses latitud/longitud from string', () {
      final caso = CasoLegal.fromJson(casoLegalMinimalJson);
      expect(caso.latitud, 19.4326);
      expect(caso.longitud, -99.1332);
    });

    group('tipoPercanceLabel', () {
      test('returns Accidente for accidente', () {
        final caso = CasoLegal.fromJson(casoLegalJson);
        expect(caso.tipoPercanceLabel, 'Accidente');
      });

      test('returns Infracción for infraccion', () {
        final caso = CasoLegal.fromJson({
          ...casoLegalJson,
          'tipoPercance': 'infraccion',
        });
        expect(caso.tipoPercanceLabel, 'Infracción');
      });

      test('returns Robo for robo', () {
        final caso = CasoLegal.fromJson(casoLegalMinimalJson);
        expect(caso.tipoPercanceLabel, 'Robo');
      });

      test('returns Asalto for asalto', () {
        final caso = CasoLegal.fromJson({
          ...casoLegalJson,
          'tipoPercance': 'asalto',
        });
        expect(caso.tipoPercanceLabel, 'Asalto');
      });

      test('returns Otro for unknown value', () {
        final caso = CasoLegal.fromJson({
          ...casoLegalJson,
          'tipoPercance': 'desconocido',
        });
        expect(caso.tipoPercanceLabel, 'Otro');
      });
    });

    group('estadoLabel', () {
      test('returns Abierto for abierto', () {
        final caso = CasoLegal.fromJson(casoLegalJson);
        expect(caso.estadoLabel, 'Abierto');
      });

      test('returns En atención for en_atencion', () {
        final caso = CasoLegal.fromJson({
          ...casoLegalJson,
          'estado': 'en_atencion',
        });
        expect(caso.estadoLabel, 'En atención');
      });

      test('returns Resuelto for resuelto', () {
        final caso = CasoLegal.fromJson(casoLegalMinimalJson);
        expect(caso.estadoLabel, 'Resuelto');
      });

      test('returns raw value for unknown estado', () {
        final caso = CasoLegal.fromJson({
          ...casoLegalJson,
          'estado': 'custom_state',
        });
        expect(caso.estadoLabel, 'custom_state');
      });
    });
  });
}
