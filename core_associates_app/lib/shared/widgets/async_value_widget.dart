import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Widget reutilizable para manejar AsyncValue de forma consistente.
/// Muestra loading, error con retry, o el contenido via [builder].
class AsyncValueWidget<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T data) builder;
  final Widget? loading;
  final Widget Function(Object error, StackTrace? stack)? errorBuilder;
  final VoidCallback? onRetry;

  const AsyncValueWidget({
    super.key,
    required this.value,
    required this.builder,
    this.loading,
    this.errorBuilder,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return value.when(
      data: builder,
      loading: () =>
          loading ?? const Center(child: CircularProgressIndicator()),
      error: (error, stack) =>
          errorBuilder?.call(error, stack) ??
          _DefaultErrorWidget(error: error.toString(), onRetry: onRetry),
    );
  }
}

class _DefaultErrorWidget extends StatelessWidget {
  final String error;
  final VoidCallback? onRetry;

  const _DefaultErrorWidget({required this.error, this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 12),
            Text(
              error,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
