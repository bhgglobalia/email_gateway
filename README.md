# Email Gateway Monorepo
 
A full-stack email gateway solution with a modern dashboard and robust backend.
 
## Short Description
This project provides a unified platform for managing email integrations (Gmail, Outlook, etc.) for multiple clients. It features a React/Next.js-based admin dashboard and a scalable NestJS API backend.
 
## Tech Stack
- **Frontend:** Next.js, TailwindCSS
- **Backend:**  NestJS, TypeORM
- **Database:** PostgreSQL
- **Other:** Docker, Socket.IO, REST API
 
## Project Structure
```
Email_Gateway/
├── frontend/             # Next.js admin dashboard
└── nest-email-gateway/   # NestJS backend API
```
 
## Setup Instructions
 
### Backend (NestJS)
```bash
cd nest-email-gateway
cp .env.example .env
npm install
npm run start:dev      
```
 
### Frontend (Next.js)
```bash
cd frontend
cp .env.example .env.local
npm install  
npm run dev      
```
 
## Usage / Run Commands
 
### Backend
- Development: `npm run start:dev`
- Production:  `npm run start:prod`
-
 
### Frontend
- Development: `npm run dev`
- Production:  `npm run build && npm start`
 
---
