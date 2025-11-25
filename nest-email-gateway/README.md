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

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
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

---

# Email Gateway Backend

This backend is a NestJS service that exposes REST endpoints for authentication, clients, mailboxes, events, health, settings, a WebSocket gateway for real-time updates, and webhook receivers for Gmail and Microsoft. It also ships with Docker/Compose and GitHub Actions pipelines.

## Quick Start

### Prerequisites

- Node.js 18+
- Postgres 16+
- Redis 7+

### Environment variables

Create a `.env` in `Email_Gateway/nest-email-gateway`:

```
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgres://postgres:newpassword @localhost:5432/email_gateway

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Auth
JWT_SECRET=your_jwt_secret

# OAuth (optional for redirects)
PUBLIC_URL=http://localhost:3000
FRONTEND_ORIGIN=http://localhost:3001
GMAIL_CLIENT_ID=your_google_client_id
MS_CLIENT_ID=your_microsoft_client_id
MICROSOFT_CLIENT_ID=

# Webhook/event security (optional)
EVENTS_SHARED_SECRET=change_me
```

### Run locally (no Docker)

```
npm ci
npm run start:dev
```

### Run with Docker Compose

From `Email_Gateway/nest-email-gateway`:

```
docker compose up -d
```

App will be on http://localhost:3000

### Tests and lint

```
npm test           # unit
npm run test:cov   # coverage
npm run test:e2e   # e2e (requires DB/Redis)
npm run lint       # eslint
```

## CI/CD

GitHub Actions configured:

- `.github/workflows/backend-ci.yml`: Lint, tests, build on push/PR.
- `.github/workflows/backend-docker-publish.yml`: Build and push Docker image to GHCR.
- `.github/workflows/backend-deploy.yml`: SSH to server, `docker compose pull && up -d` using `docker-compose.prod.yml`.

Server-side requirements for deploy:

- Docker + Docker Compose plugin.
- `${DEPLOY_PATH}/.env` file with the environment variables above.

Repo secrets required:

- `DEPLOY_HOST`, `DEPLOY_USER`, `SSH_PRIVATE_KEY`, `DEPLOY_PATH`.

## API Endpoints

Base URL: `http://localhost:3000`

- Auth (`/auth`)
  - `POST /auth/login` — body: `{ email, password }` → `{ success, access_token, ... }`
  - `GET /auth/me` — requires Bearer token → `{ success, user }`
  - `POST /auth/change-password` — requires Bearer token, body: `{ currentPassword, newPassword }`

- Clients (`/clients`) — requires Bearer token
  - `GET /clients?skip=&take=` → `{ success, data }`
  - `POST /clients` body: `CreateClientDto` → `{ success, data }`

- Mailboxes (`/mailboxes`) — requires Bearer token
  - `GET /mailboxes?skip=&take=` → list with `{ status: 'active'|'expired' }`
  - `PATCH /mailboxes/:id/refresh` → extend token expiry
  - `GET /mailboxes/active/count`
  - `GET /mailboxes/oauth/:provider` → returns `{ redirectUrl }` for `google|microsoft|outlook`
  - `GET /mailboxes/callback/:provider` → redirects to frontend with result

- Events (`/events`)
  - `POST /events` — body: `CreateEventDto` — secured via `EVENTS_SHARED_SECRET` header `x-events-secret` if set
  - `GET /events?limit=&provider=&clientId=&date=` — requires Bearer token

- Mail (`/mail`) — requires Bearer token
  - `POST /mail/send` — body: `SendMailDto`, optional file `attachment` (multipart)
  - `GET /mail/queue` — list queued jobs

- Webhooks (`/webhook`)
  - `POST /webhook/gmail` — body includes `mailboxId`|`resourceId`|`subscription` and optional fields; secured with `x-events-secret` when configured
  - `POST /webhook/microsoft` — similar: `mailboxId`|`resourceId`|`subscriptionId`

- Settings (`/settings`) — requires Bearer token
  - `GET /settings/masked-keys`
  - `GET /settings/webhooks`
  - `GET /settings/worker-health`
  - `GET /settings/token-expiry`
  - `GET /settings` — aggregate view
  - `GET /settings/ping/app`
  - `GET /settings/ping/worker`

- System (`/system`) — requires Bearer token
  - `GET /system/status`

- Health (`/health`)
  - `GET /health` — Terminus DB health

## WebSockets

WebSocket gateway emits events on the default namespace. Configure CORS via `FRONTEND_ORIGIN`. Server publishes internal events via Redis Pub/Sub channel `ws-events`.

## Architecture

```mermaid
flowchart LR
  Browser/Frontend -- REST --> API[NestJS API]
  Browser/Frontend -- WS --> WS[WebSocket Gateway]
  API -- TypeORM --> PG[(Postgres)]
  API -- BullMQ --> Redis[(Redis)]
  WS -- Pub/Sub --> Redis
  Webhooks[Email Provider Webhooks] -- HTTP --> API
```

### Deployment (compose)

```mermaid
flowchart TB
  subgraph Server
    App[Backend Container]
    DB[(Postgres Container)]
    Cache[(Redis Container)]
  end
  GH[GitHub Actions] -- docker pull/up --> Server
  App -- connects --> DB
  App -- connects --> Cache
```

