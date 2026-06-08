import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory } from './chat-history.entity';
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { GoogleGenerativeAI, FunctionDeclaration, Tool } from "@google/generative-ai";

export interface OrdenNavegacion {
  accion: string;
  ruta: string;
}

export interface RespuestaBackend {
  tipo: "navegacion" | "texto";
  datos: OrdenNavegacion | string;
}

@Injectable()
export class McpNavigationService implements OnModuleInit, OnModuleDestroy {
  private mcpClient: Client;
  private transport: StdioClientTransport;

  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatHistoryRepository: Repository<ChatHistory>,
  ) {
    this.transport = new StdioClientTransport({
      command: "npx",
      args: ["tsx", "./src/ia/mcp/navigation_server.ts"]
    });

    this.mcpClient = new Client({
      name: "Backend-NestJS-Navigation",
      version: "1.0.0"
    }, {
      capabilities: {}
    });
  }

  async onModuleInit() {
    await this.mcpClient.connect(this.transport);
    console.log("Cliente MCP conectado exitosamente 🚀 con Memoria BD");
  }

  async onModuleDestroy() {
    if (this.transport) {
      await this.transport.close();
    }
  }

  async procesarMensaje(mensajeUsuario: string, usuarioId: string): Promise<RespuestaBackend> {

    const historialDb = await this.chatHistoryRepository.find({
      where: { usuarioId },
      order: { createdAt: 'ASC' },
      take: 15
    });

    const geminiHistory = historialDb.map(historial => ({
      role: historial.role,
      parts: [{ text: historial.message }]
    }));

    const mcpTools = await this.mcpClient.listTools();

    const geminiFunctionDeclarations: FunctionDeclaration[] = mcpTools.tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema as any
    }));

    const geminiTools: Tool[] = [{ functionDeclarations: geminiFunctionDeclarations }];

    const apiKey = process.env.GEMINI_API_KEY || "TU_API_KEY_AQUI";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      tools: geminiTools,
      systemInstruction: `Eres un asistente de navegación de la app WorkHub. Reglas estrictas:
1. Si el usuario escribe SOLO el nombre de una pantalla (ej: "carpool", "perfil", "gamificacion"), navega inmediatamente a esa pantalla.
2. Si el usuario pide ir a algún lugar con frases como "llévame", "ir a", "abre", "me llevas", "quiero ir", navega a esa pantalla.
3. Si el usuario hace una pregunta sobre una pantalla (ej: "qué es gamificación", "cómo funciona el carpool"), responde con texto explicando brevemente y luego pregunta si quiere ir ahí.
4. Las pantallas disponibles son: dashboard, mapa_espacios, reservar, historial_reservas, check_in, carpool, gamificacion, perfil, soporte.
5. Nunca digas que una pantalla no existe si está en la lista anterior.`
    });

    const chat = model.startChat({
      history: geminiHistory
    });

    const result = await chat.sendMessage(mensajeUsuario);
    const response = result.response;
    const functionCall = response.functionCalls()?.[0];

    await this.chatHistoryRepository.save({
      usuarioId,
      role: 'user',
      message: mensajeUsuario
    });

    if (functionCall) {
      const mcpResult = await this.mcpClient.callTool({
        name: functionCall.name,
        arguments: functionCall.args as Record<string, any>
      });

      const contenido = (mcpResult as any).content || [];
      const textContent = contenido.find((c: any) => c.type === "text");
      const ordenString = textContent ? textContent.text : "{}";

      let parsedOrden: OrdenNavegacion;
      try {
        parsedOrden = JSON.parse(ordenString);
      } catch {
        await this.chatHistoryRepository.save({
          usuarioId,
          role: 'model',
          message: ordenString
        });
        return {
          tipo: "texto",
          datos: ordenString
        };
      }

      await this.chatHistoryRepository.save({
        usuarioId,
        role: 'model',
        message: `Acción de navegación ejecutada: ${ordenString}`
      });

      return {
        tipo: "navegacion",
        datos: parsedOrden
      };
    } else {
      const respuestaTexto = response.text();

      await this.chatHistoryRepository.save({
        usuarioId,
        role: 'model',
        message: respuestaTexto
      });

      return {
        tipo: "texto",
        datos: respuestaTexto
      };
    }
  }
}