import 'package:flutter/material.dart';
import '../../../../shared/theme/app_theme.dart';
import '../../data/models/ai_analysis.dart';

/// Human-readable labels for validation keys
const _validationLabels = {
  'es_ine_valida': 'INE válida',
  'es_ine_reverso': 'INE reverso',
  'imagen_legible': 'Imagen legible',
  'vigencia_ok': 'Vigencia vigente',
  'formato_curp_valido': 'Formato CURP',
  'integridad_visual': 'Integridad visual',
  'es_tarjeta_circulacion': 'Tarjeta circulación',
  'formato_placas_valido': 'Formato placas',
  'formato_vin_valido': 'Formato VIN',
  'es_selfie_valida': 'Selfie válida',
  'calidad_aceptable': 'Calidad aceptable',
};

const _fieldLabels = {
  'nombre_completo': 'Nombre',
  'apellido_paterno': 'Ap. Paterno',
  'apellido_materno': 'Ap. Materno',
  'nombre': 'Nombre(s)',
  'curp': 'CURP',
  'clave_elector': 'Clave Elector',
  'vigencia': 'Vigencia',
  'fecha_nacimiento': 'Nacimiento',
  'sexo': 'Sexo',
  'domicilio': 'Domicilio',
  'placas': 'Placas',
  'numero_serie': 'VIN',
  'marca': 'Marca',
  'modelo': 'Modelo',
  'anio_modelo': 'Año',
  'color': 'Color',
  'nombre_propietario': 'Propietario',
  'rostro_detectado': 'Rostro',
  'solo_una_persona': 'Una persona',
  'imagen_nitida': 'Nítida',
  'genero_aparente': 'Género',
  'rango_edad_aparente': 'Edad aprox.',
};

class AiAnalysisCard extends StatefulWidget {
  final AiAnalysis? analisis;

  const AiAnalysisCard({super.key, this.analisis});

  @override
  State<AiAnalysisCard> createState() => _AiAnalysisCardState();
}

class _AiAnalysisCardState extends State<AiAnalysisCard> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final analisis = widget.analisis;

    if (analisis == null) return const SizedBox.shrink();

    if (analisis.isProcessing) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.blue.shade200),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.blue.shade600,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Analizando con IA...',
              style: TextStyle(
                fontSize: 12,
                color: Colors.blue.shade700,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      );
    }

    if (analisis.isError) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.red.shade50,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.red.shade200),
        ),
        child: Row(
          children: [
            Icon(Icons.error_outline, size: 16, color: Colors.red.shade600),
            const SizedBox(width: 8),
            Text(
              'Error en análisis IA',
              style: TextStyle(fontSize: 12, color: Colors.red.shade700),
            ),
          ],
        ),
      );
    }

    // Completed
    final confPct = analisis.confidencePercent;
    final confColor = confPct >= 85
        ? AppColors.secondary
        : confPct >= 60
            ? AppColors.warning
            : AppColors.error;

    return Container(
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.indigo.shade50.withValues(alpha: 0.8),
            Colors.purple.shade50.withValues(alpha: 0.5),
          ],
        ),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.indigo.shade200),
      ),
      child: Column(
        children: [
          // Header
          InkWell(
            onTap: () => setState(() => _expanded = !_expanded),
            borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Icon(Icons.psychology, size: 18, color: Colors.indigo.shade600),
                  const SizedBox(width: 8),
                  Text(
                    'IA',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.indigo.shade700,
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Confidence badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: confColor.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '$confPct%',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: confColor,
                      ),
                    ),
                  ),
                  const SizedBox(width: 6),
                  Icon(
                    analisis.allValidationsPassed
                        ? Icons.verified
                        : Icons.warning_amber_rounded,
                    size: 16,
                    color: analisis.allValidationsPassed
                        ? AppColors.secondary
                        : AppColors.warning,
                  ),
                  const Spacer(),
                  Icon(
                    _expanded ? Icons.expand_less : Icons.expand_more,
                    size: 18,
                    color: Colors.indigo.shade400,
                  ),
                ],
              ),
            ),
          ),

          // Expanded content
          if (_expanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Validations
                  if (analisis.validationEntries.isNotEmpty) ...[
                    Text(
                      'VALIDACIONES',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1,
                        color: Colors.indigo.shade500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: analisis.validationEntries.map((e) {
                        final label = _validationLabels[e.key] ??
                            e.key.replaceAll('_', ' ');
                        return Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              e.value
                                  ? Icons.check_circle
                                  : Icons.cancel,
                              size: 14,
                              color: e.value
                                  ? AppColors.secondary
                                  : AppColors.error,
                            ),
                            const SizedBox(width: 3),
                            Text(
                              label,
                              style: const TextStyle(fontSize: 11),
                            ),
                            const SizedBox(width: 8),
                          ],
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Extracted data
                  if (analisis.extractedFields.isNotEmpty) ...[
                    Text(
                      'DATOS EXTRAÍDOS',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1,
                        color: Colors.indigo.shade500,
                      ),
                    ),
                    const SizedBox(height: 6),
                    ...analisis.extractedFields.map((entry) {
                      final label = _fieldLabels[entry.key] ??
                          entry.key.replaceAll('_', ' ');
                      final field = entry.value;
                      final valor = field is Map ? field['valor'] : field;
                      final conf = field is Map
                          ? (field['confianza'] as num?)?.toDouble()
                          : null;

                      if (valor == null) return const SizedBox.shrink();

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(
                              width: 100,
                              child: Text(
                                label,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ),
                            Expanded(
                              child: Text(
                                valor is bool
                                    ? (valor ? 'Sí' : 'No')
                                    : valor.toString(),
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            if (conf != null)
                              _ConfBadge(value: conf),
                          ],
                        ),
                      );
                    }),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ConfBadge extends StatelessWidget {
  final double value;
  const _ConfBadge({required this.value});

  @override
  Widget build(BuildContext context) {
    final pct = (value * 100).round();
    final color = pct >= 85
        ? AppColors.secondary
        : pct >= 60
            ? AppColors.warning
            : AppColors.error;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '$pct%',
        style: TextStyle(
          fontSize: 9,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}
