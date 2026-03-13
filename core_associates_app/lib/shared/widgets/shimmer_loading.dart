import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

import '../theme/app_theme.dart';

/// Shimmer placeholder for loading states — replaces raw CircularProgressIndicator.
class ShimmerLoading extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerLoading({
    super.key,
    this.width = double.infinity,
    required this.height,
    this.borderRadius = AppRadius.md,
  });

  /// Simulates a card-shaped loading placeholder.
  const ShimmerLoading.card({super.key})
    : width = double.infinity,
      height = 120,
      borderRadius = AppRadius.lg;

  /// Simulates a list item.
  const ShimmerLoading.listItem({super.key})
    : width = double.infinity,
      height = 80,
      borderRadius = AppRadius.md;

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.border,
      highlightColor: AppColors.surface,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Column of shimmer placeholders to simulate a loading list.
class ShimmerList extends StatelessWidget {
  final int itemCount;
  final double itemHeight;
  final double spacing;

  const ShimmerList({
    super.key,
    this.itemCount = 3,
    this.itemHeight = 80,
    this.spacing = 12,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(
        itemCount,
        (i) => Padding(
          padding: EdgeInsets.only(bottom: i < itemCount - 1 ? spacing : 0),
          child: ShimmerLoading(height: itemHeight),
        ),
      ),
    );
  }
}
