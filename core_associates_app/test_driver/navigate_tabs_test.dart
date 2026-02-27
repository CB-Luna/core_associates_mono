// ignore_for_file: avoid_print
import 'dart:io';

import 'package:flutter_driver/flutter_driver.dart';
import 'package:test/test.dart';

void main() {
  late FlutterDriver driver;

  setUpAll(() async {
    driver = await FlutterDriver.connect();
  });

  tearDownAll(() async {
    await driver.close();
  });

  test('navigate all tabs and take screenshots', () async {
    await driver.runUnsynchronized(() async {
      // We should already be on Home screen after login
      await Future.delayed(const Duration(seconds: 1));

      // Navigate to Promociones
      await driver.tap(find.text('Promociones'));
      await Future.delayed(const Duration(seconds: 3));
      final promo = await driver.screenshot();
      File('/tmp/sim_tab_promociones.png').writeAsBytesSync(promo);
      print('Screenshot: Promociones tab saved');

      // Navigate to Legal SOS
      await driver.tap(find.text('Legal SOS'));
      await Future.delayed(const Duration(seconds: 3));
      final legal = await driver.screenshot();
      File('/tmp/sim_tab_legal.png').writeAsBytesSync(legal);
      print('Screenshot: Legal SOS tab saved');

      // Navigate to Perfil
      await driver.tap(find.text('Perfil'));
      await Future.delayed(const Duration(seconds: 3));
      final perfil = await driver.screenshot();
      File('/tmp/sim_tab_perfil.png').writeAsBytesSync(perfil);
      print('Screenshot: Perfil tab saved');

      // Back to Inicio
      await driver.tap(find.text('Inicio'));
      await Future.delayed(const Duration(seconds: 2));
      final home = await driver.screenshot();
      File('/tmp/sim_tab_inicio.png').writeAsBytesSync(home);
      print('Screenshot: Inicio tab saved');
    });
  });
}
