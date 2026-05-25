# ImageLab

ImageLab is a full-stack web application for image upload, editing and AI-assisted recommendations.

## Architecture

The application uses a microservice-based architecture:

- Frontend: React + Vite
- Auth Service: authentication, registration, JWT generation and admin user management
- User Service: user profile storage synchronized through RabbitMQ
- Image Service: image upload, storage, listing and editing
- AI Service: AI-powered recommendations
- PostgreSQL: persistence
- RabbitMQ: event-driven synchronization between services
- Traefik: reverse proxy/API routing

## Service Responsibilities

### Auth Service

The auth service is responsible for:

- user registration
- login
- password storage
- JWT generation
- admin CRUD operations for users
- publishing user events to RabbitMQ

It stores data in the `users` table.

### User Service

The user service stores public user profiles in the `user_profiles` table.

It does not store passwords and does not create authentication accounts directly.

Profiles are synchronized from auth-service through RabbitMQ events:

- `user.created`
- `user.updated`
- `user.deleted`

### Image Service

The image service stores uploaded images in the `images` table.

Images are linked to users through `user_id`, extracted from the JWT.

The service does not store or load a `User` entity.

### AI Service

The AI service provides AI-based image recommendations and uses JWT authentication.

## Authentication Flow

1. User logs in or registers through auth-service.
2. Auth-service returns a JWT containing user id, email and role.
3. Frontend stores the token using Zustand.
4. Protected services validate the JWT.
5. Image ownership is based on the user id extracted from the JWT.

## User Synchronization

When a user is created, updated or deleted in auth-service, auth-service publishes a RabbitMQ event.

User-service consumes the event and updates `user_profiles`.

This avoids sharing the same `users` table across multiple services.

## Running the Project

Start backend services:

```bash
cd backend/docker
docker compose up --build