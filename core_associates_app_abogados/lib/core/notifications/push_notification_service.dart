import 'dart:io' show Platform;
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';

// ── Top-level handler requerido por firebase_messaging ──
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No se necesita lógica extra — el system tray muestra la notificación.
  debugPrint('FCM background message: ${message.messageId}');
}

/// Provider del servicio de push notifications.
final pushNotificationServiceProvider = Provider<PushNotificationService>((
  ref,
) {
  return PushNotificationService(api: ref.watch(apiClientProvider));
});

class PushNotificationService {
  final ApiClient api;

  PushNotificationService({required this.api});

  final _messaging = FirebaseMessaging.instance;
  final _localNotifications = FlutterLocalNotificationsPlugin();

  /// Callback para cuando el usuario toca una notificación y hay que navegar.
  void Function(String casoId)? onNotificationTap;

  // ── Canal Android para notificaciones en foreground ──
  static const _androidChannel = AndroidNotificationChannel(
    'casos_channel',
    'Casos legales',
    description: 'Notificaciones de nuevos casos y actualizaciones',
    importance: Importance.high,
  );

  /// Inicializar todo el pipeline de FCM. Llamar una vez tras Firebase.initializeApp().
  Future<void> initialize() async {
    // Registrar handler de background
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Crear canal de notificaciones Android
    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_androidChannel);

    // Inicializar flutter_local_notifications
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    await _localNotifications.initialize(
      const InitializationSettings(android: androidInit),
      onDidReceiveNotificationResponse: _onLocalNotificationTap,
    );

    // Solicitar permisos (Android 13+, iOS)
    await _requestPermission();

    // Escuchar mensajes en foreground → mostrar local notification
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Tap en notificación cuando la app estaba en background
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Verificar si la app fue abierta desde una notificación (terminated)
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  /// Solicitar permisos de notificación.
  Future<void> _requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('FCM permission: ${settings.authorizationStatus}');
  }

  /// Obtener el token FCM actual del dispositivo.
  Future<String?> getToken() async {
    try {
      return await _messaging.getToken();
    } catch (e) {
      debugPrint('Error getting FCM token: $e');
      return null;
    }
  }

  /// Registrar el token FCM en el backend.
  Future<void> registerTokenInBackend() async {
    final token = await getToken();
    if (token == null) return;

    final platform = Platform.isAndroid ? 'android' : 'ios';
    try {
      await api.post(
        '/notificaciones/register-token-usuario',
        data: {'token': token, 'platform': platform},
      );
      debugPrint('FCM token registered in backend');
    } catch (e) {
      debugPrint('Error registering FCM token: $e');
    }

    // Escuchar renovaciones de token
    _messaging.onTokenRefresh.listen((newToken) async {
      try {
        await api.post(
          '/notificaciones/register-token-usuario',
          data: {'token': newToken, 'platform': platform},
        );
        debugPrint('FCM token refreshed in backend');
      } catch (e) {
        debugPrint('Error refreshing FCM token: $e');
      }
    });
  }

  /// Manejar mensaje recibido en foreground → mostrar notificación local.
  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _androidChannel.id,
          _androidChannel.name,
          channelDescription: _androidChannel.description,
          icon: '@mipmap/ic_launcher',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
      payload: message.data['casoId'] as String?,
    );
  }

  /// Tap en notificación FCM (background/terminated).
  void _handleNotificationTap(RemoteMessage message) {
    final casoId = message.data['casoId'] as String?;
    if (casoId != null && onNotificationTap != null) {
      onNotificationTap!(casoId);
    }
  }

  /// Tap en notificación local (foreground).
  void _onLocalNotificationTap(NotificationResponse response) {
    final casoId = response.payload;
    if (casoId != null && casoId.isNotEmpty && onNotificationTap != null) {
      onNotificationTap!(casoId);
    }
  }
}
