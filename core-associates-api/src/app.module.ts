import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { SmsModule } from './common/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';
import { AsociadosModule } from './modules/asociados/asociados.module';
import { VehiculosModule } from './modules/vehiculos/vehiculos.module';
import { DocumentosModule } from './modules/documentos/documentos.module';
import { ProveedoresModule } from './modules/proveedores/proveedores.module';
import { PromocionesModule } from './modules/promociones/promociones.module';
import { CuponesModule } from './modules/cupones/cupones.module';
import { CasosLegalesModule } from './modules/casos-legales/casos-legales.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificacionesModule } from './modules/notificaciones/notificaciones.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { MenuModule } from './modules/menu/menu.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 1 minuto
      limit: 30,    // 30 requests por minuto por IP
    }]),
    PrismaModule,
    RedisModule,
    SmsModule,
    AuthModule,
    AsociadosModule,
    VehiculosModule,
    DocumentosModule,
    ProveedoresModule,
    PromocionesModule,
    CuponesModule,
    CasosLegalesModule,
    StorageModule,
    NotificacionesModule,
    ReportesModule,
    MenuModule,
    AuditoriaModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
