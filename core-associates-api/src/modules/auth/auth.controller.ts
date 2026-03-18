import { Controller, Post, Get, Put, Delete, Param, Body, HttpCode, HttpStatus, UseGuards, UseInterceptors, UploadedFile, Res, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('otp/send')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar OTP por SMS' })
  @ApiResponse({ status: 200, description: 'OTP enviado correctamente' })
  @ApiResponse({ status: 400, description: 'Teléfono inválido' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.telefono);
  }

  @Post('otp/verify')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar OTP y obtener JWT' })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa — retorna accessToken y refreshToken' })
  @ApiResponse({ status: 400, description: 'OTP inválido o expirado' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.telefono, dto.otp);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login admin/operador (email + contraseña)' })
  @ApiResponse({ status: 200, description: 'Login exitoso — retorna accessToken y refreshToken' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 429, description: 'Demasiados intentos' })
  login(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('otp/peek')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar OTP pendiente del asociado autenticado' })
  @ApiResponse({ status: 200, description: 'Código OTP y TTL restante (o null si no hay)' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  peekOtp(@CurrentUser() user: any) {
    if (user.tipo !== 'asociado' || !user.telefono) {
      return { codigo: null, ttlSegundos: 0 };
    }
    return this.authService.peekOtp(user.telefono);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMe(@CurrentUser() user: any) {
    return user;
  }

  @Get('mis-permisos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener permisos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de códigos de permisos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  getMisPermisos(@CurrentUser() user: any) {
    return this.authService.getPermisosByUsuarioId(user.id);
  }

  // ── Gestión de Usuarios CRM (solo admin) ──

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuarios del CRM' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  getUsers() {
    return this.authService.getUsers();
  }

  @Post('register-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario del CRM' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o email duplicado' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  createUser(@Body() dto: CreateUsuarioDto) {
    return this.authService.createUser(dto);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario del CRM' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.authService.updateUser(id, dto);
  }

  @Post('users/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resetear contraseña de usuario' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  @ApiResponse({ status: 403, description: 'Solo admin' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(id, dto.password);
  }

  // ── Avatar de Usuario ──

  @Post('users/:id/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir avatar de usuario' })
  @ApiResponse({ status: 200, description: 'Avatar subido' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  uploadAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.authService.uploadAvatar(id, file);
  }

  @Get('users/:id/avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener avatar de usuario' })
  @ApiResponse({ status: 200, description: 'Imagen del avatar' })
  @ApiResponse({ status: 404, description: 'Avatar no encontrado' })
  async getAvatar(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.authService.getAvatar(id);
    res.set({ 'Content-Type': contentType, 'Cache-Control': 'private, max-age=3600' });
    res.send(buffer);
  }

  @Delete('users/:id/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar avatar de usuario' })
  @ApiResponse({ status: 200, description: 'Avatar eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  deleteAvatar(@Param('id', ParseUUIDPipe) id: string) {
    return this.authService.deleteAvatar(id);
  }
}
