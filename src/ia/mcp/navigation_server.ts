import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server({
  name: "Navegacion-App-Server",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});

const PANTALLAS_APP = {
  dashboard: "Un panel con estadísticas y gráficos de uso ademas de recomendaciones de ia para mejorar la experiencia del usuario",
  mapa_espacios: "Un mapa interactivo con los espacios disponibles y su estado en tiempo real",
  reservar: "Una pantalla para reservar un espacio específico en una fecha y hora determinada",
  historial_reservas: "Donde el usuario puede ver, modificar o cancelar sus reservas pasadas y futuras",
  check_in: "Una pantalla para hacer check-in al llegar al espacio reservado",
  carpool: "Una sección para coordinar viajes compartidos con otros usuarios que van al mismo espacio",
  gamificacion: "Una sección con desafíos, logros y recompensas para incentivar el uso de la app y la interacción entre usuarios",
  perfil: "Donde el usuario cambia su nombre, foto o datos del vehículo",
  soporte: "Una sección para contactar al soporte, enviar feedback o reportar problemas con la app"
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ver_mapa_app",
        description: "Devuelve la lista de pantallas disponibles en la aplicación",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "navegar_a_pantalla",
        description: "Genera la orden para llevar al usuario a una pantalla específica, especificando el nombre de la pantalla a elegir y diciendo la accion",
        inputSchema: {
          type: "object",
          properties: {
            pantalla: { type: "string", description: "El nombre de la pantalla a la que ir" },
            accion: { type: "string", description: "La accion a realizar en la pantalla" }
          },
          required: ["pantalla", "accion"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params as any;

  if (name === "ver_mapa_app") {
    return {
      content: [{ type: "text", text: JSON.stringify(PANTALLAS_APP) }]
    };
  }

  if (name === "navegar_a_pantalla") {
    const destino = ((args as any).pantalla as string).toLowerCase().trim();
    const accion = (args as any).accion;

    if (!PANTALLAS_APP[destino]) {
      return { content: [{ type: "text", text: `Error: La pantalla '${destino}' no existe. Las pantallas disponibles son: ${Object.keys(PANTALLAS_APP).join(", ")}` }] };
    }

    const ordenDeNavegacion = {
      accion: accion || "redireccionar",
      ruta: `/${destino}`
    };

    return {
      content: [{ type: "text", text: JSON.stringify(ordenDeNavegacion) }]
    };
  }

  throw new Error("Herramienta no encontrada");
});

async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("Servidor MCP de Navegación corriendo...");
}

startServer();