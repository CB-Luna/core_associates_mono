import { Controller, Post, Get, Put, Param, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.telefono);
  }

  @Post('otp/verify')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar OTP y obtener JWT' })
  @ApiResponse({ status: 200, description: 'Autenticación exitosa' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.telefono, dto.otp);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login admin/operador (email + contraseña)' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  login(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  @ApiResponse({ status: 200, description: 'Token renovado' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  getMe(@CurrentUser() user: any) {
    return user;
  }

  // ── Gestión de Usuarios CRM (solo admin) ──

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuarios del CRM' })
  getUsers() {
    return this.authService.getUsers();
  }

  @Post('register-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario del CRM' })
  @ApiResponse({ status: 201, description: 'Usuario creado' })
  createUser(@Body() dto: CreateUsuarioDto) {
    return this.authService.createUser(dto);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario del CRM' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUsuarioDto) {
    return this.authService.updateUser(id, dto);
  }

  @Post('users/:id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resetear contraseña de usuario' })
  resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(id, dto.password);
  }
}
