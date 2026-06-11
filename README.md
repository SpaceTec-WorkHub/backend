<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Backend de **WorkHub**, construido con [NestJS](https://github.com/nestjs/nest) (Node.js + TypeScript).

## Arquitectura

El backend sigue una arquitectura modular tipo "monolito modular":

- Cada dominio de negocio se implementa como un módulo de Nest independiente (`module` + `controller` + `service` + `dto` + `entities`), registrado en [src/app.module.ts](src/app.module.ts).
- **Persistencia**: PostgreSQL mediante TypeORM (`TypeOrmModule.forRootAsync`), con migraciones en `src/migrations/`. La conexión se configura con variables de entorno validadas en [src/env.validation.ts](src/env.validation.ts).
- **Autenticación/autorización**: `AuthModule` (JWT) y `RoleModule` para control de acceso por rol.
- **Documentación de API**: Swagger, expuesto en `/api/docs` (ver [src/main.ts](src/main.ts)).
- **IA**: `IaModule` integra Google Generative AI y un servidor de navegación basado en MCP (Model Context Protocol) para el asistente del sistema.
- **Tareas programadas**: `@nestjs/schedule` (p. ej. seeds de desarrollo y procesamiento de reservas/eventos de check-in).
- **Base de datos local**: PostgreSQL 16 vía Docker Compose ([docker-compose.yml](docker-compose.yml)).

## Uso del sistema

Requisitos: Node.js >= 18, [pnpm](https://pnpm.io/), Docker (para la base de datos local).

```bash
# 1. Instalar dependencias
$ pnpm install

# 2. Levantar PostgreSQL local
$ docker compose up -d

# 3. Configurar variables de entorno (.env): DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, RESEND_ENABLED

# 4. Ejecutar migraciones
$ pnpm migration:run

# 5. Iniciar en modo desarrollo (watch mode)
$ pnpm start:dev
```

La API queda disponible en `http://localhost:3000` y la documentación Swagger en `http://localhost:3000/api/docs`.

## Enlaces clave

- Organización del proyecto: https://github.com/SpaceTec-WorkHub/
- Repositorio Frontend: https://github.com/SpaceTec-WorkHub/WorkHub
- Repositorio Backend: https://github.com/SpaceTec-WorkHub/backend
- Backend en producción: https://backend-wh.onrender.com/
- Frontend en producción: https://work-hub-theta.vercel.app/login
- Azure DevOps: https://dev.azure.com/SpaceTec/

## Árbol de componentes

```
src/
├── app.module.ts          # Módulo raíz, registra todos los módulos
├── main.ts                 # Bootstrap, Swagger y CORS
├── env.validation.ts       # Validación de variables de entorno
├── data-source.ts          # Configuración TypeORM (CLI/migraciones)
├── dev-seed.service.ts      # Seed de datos de desarrollo
├── migrations/             # Migraciones de base de datos
├── shared/                  # Entidades y utilidades compartidas
├── auth/                    # Autenticación y autorización (JWT)
├── user/                    # Usuarios
├── role/                    # Roles
├── site/ building/ floor/ zone/ block/   # Jerarquía física de ubicaciones
├── space/ space_type/                    # Espacios reservables y sus tipos
├── space_user_usage/        # Uso de espacios por usuario
├── reservation/             # Reservas
├── release/                 # Liberación de reservas
├── check_event/             # Eventos de check-in/check-out
├── priority_level/          # Niveles de prioridad
├── visit/                   # Visitas
├── user_need/               # Necesidades/preferencias de usuario
├── event/                   # Eventos generales
├── points_ledger/           # Registro de puntos (gamificación)
├── badge/                   # Insignias
├── gamification/            # Lógica de gamificación
├── carpool_trip/            # Viajes compartidos (carpool)
├── vehicle/                 # Vehículos
├── notifications/           # Notificaciones
└── ia/                      # Asistente IA y servidor de navegación MCP
    └── mcp/
```

Cada módulo de dominio sigue la misma convención interna: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, `entities/`.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
