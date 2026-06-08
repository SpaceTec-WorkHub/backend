import { Controller, Post, Body } from '@nestjs/common';
import { McpNavigationService, RespuestaBackend } from './mcp_navigation.service';

@Controller('navigation-ai') 
export class McpNavigationController {
  constructor(private readonly navigationService: McpNavigationService) {}

  @Post('chat') 
  async chatConIaDeNavegacion(@Body('mensaje') mensaje: string, @Body('usuarioId') usuarioId: string, ): Promise<RespuestaBackend | { error: string }> {
    if (!mensaje || !usuarioId) {
      return { error: "Debes enviar un mensaje y el ID del usuario" };
    }
    return await this.navigationService.procesarMensaje(mensaje, usuarioId);
  }
}