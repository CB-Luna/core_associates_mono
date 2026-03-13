import 'package:flutter/material.dart';
import '../../shared/theme/app_theme.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;
  final Color? borderColor;
  final List<BoxShadow>? shadow;
  final Gradient? gradient;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
    this.borderColor,
    this.shadow,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: gradient == null ? Colors.white : null,
        gradient: gradient,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: gradient == null
            ? Border.all(
                color: borderColor ?? AppColors.border.withValues(alpha: 0.5),
              )
            : null,
        boxShadow: shadow ?? AppShadows.sm,
      ),
      child: child,
    );

    if (onTap == null) return card;

    return GestureDetector(onTap: onTap, child: card);
  }
}
