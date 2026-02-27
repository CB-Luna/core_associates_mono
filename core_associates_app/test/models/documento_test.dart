import 'package:flutter_test/flutter_test.dart';

import 'package:core_associates_app/features/documents/data/models/documento.dart';
import '../helpers/fixtures.dart';

void main() {
  group('Documento', () {
    test('fromJson parses complete JSON correctly', () {
      final doc = Documento.fromJson(documentoJson);

      expect(doc.id, 'doc-1');
      expect(doc.tipo, 'ine_frente');
      expect(doc.estado, 'aprobado');
      expect(doc.contentType, 'image/jpeg');
      expect(doc.fileSize, 1048576);
      expect(doc.motivoRechazo, isNull);
      expect(doc.createdAt, '2026-02-01T00:00:00.000Z');
    });

    test('fromJson handles rejected document with motivoRechazo', () {
      final doc = Documento.fromJson(documentoRechazadoJson);

      expect(doc.estado, 'rechazado');
      expect(doc.motivoRechazo, 'Imagen borrosa');
    });

    test('fromJson defaults contentType and fileSize', () {
      final doc = Documento.fromJson(documentoRechazadoJson);

      expect(doc.contentType, 'image/jpeg');
      expect(doc.fileSize, 0);
    });

    group('tipoLabel', () {
      test('returns INE Frente for ine_frente', () {
        final doc = Documento.fromJson(documentoJson);
        expect(doc.tipoLabel, 'INE Frente');
      });

      test('returns INE Reverso for ine_reverso', () {
        final doc = Documento.fromJson({
          ...documentoJson,
          'tipo': 'ine_reverso',
        });
        expect(doc.tipoLabel, 'INE Reverso');
      });

      test('returns Selfie for selfie', () {
        final doc = Documento.fromJson(documentoRechazadoJson);
        expect(doc.tipoLabel, 'Selfie');
      });

      test('returns Tarjeta de Circulación for tarjeta_circulacion', () {
        final doc = Documento.fromJson({
          ...documentoJson,
          'tipo': 'tarjeta_circulacion',
        });
        expect(doc.tipoLabel, 'Tarjeta de Circulación');
      });

      test('returns Otro for unknown tipo', () {
        final doc = Documento.fromJson({
          ...documentoJson,
          'tipo': 'licencia',
        });
        expect(doc.tipoLabel, 'Otro');
      });
    });
  });
}
