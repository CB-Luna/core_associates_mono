import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/api/api_client.dart';

final pushNotificationServiceProvider = Provider<PushNotificationService>((
  ref,
) {
  return PushNotificationService(apiClient: ref.watch(apiClientProvider));
});

/// Top-level handler required by Firebase Messaging for background messages.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // No-op — message will be shown as notification by the OS.
}

class PushNotificationService {
  final ApiClient _apiClient;
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  PushNotificationService({required ApiClient apiClient})
    : _apiClient = apiClient;

  /// Initialize push notifications & local notifications channel.
  Future<void> initialize() async {
    // Request permission (iOS + Android 13+)
    await _messaging.requestPermission(alert: true, badge: true, sound: true);

    // Android notification channel
    const androidChannel = AndroidNotificationChannel(
      'core_associates_default',
      'Notificaciones',
      description: 'Notificaciones de Core Associates',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(androidChannel);

    // Init local notifications
    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      iOS: DarwinInitializationSettings(),
    );
    await _localNotifications.initialize(settings: initSettings);

    // Register background handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Foreground messages → show as local notification
    FirebaseMessaging.onMessage.listen(_showLocalNotification);

    // Get token and register with backend
    final token = await _messaging.getToken();
    if (token != null) {
      await _registerToken(token);
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen(_registerToken);
  }

  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      id: notification.hashCode,
      title: notification.title,
      body: notification.body,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'core_associates_default',
          'Notificaciones',
          channelDescription: 'Notificaciones de Core Associates',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: DarwinNotificationDetails(),
      ),
      payload: jsonEncode(message.data),
    );
  }

  Future<void> _registerToken(String token) async {
    try {
      await _apiClient.post(
        '/notificaciones/register-token',
        data: {'token': token, 'platform': 'android'},
      );
    } catch (_) {
      // Silent fail — token registration is best-effort
    }
  }
}
