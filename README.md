# ImageLab

ImageLab is a web application for image management and AI-assisted image analysis/editing.  
The project is built using a microservices architecture with Spring Boot, React, PostgreSQL, RabbitMQ, Traefik and Ollama.

## Architecture

The backend is split into multiple services:

- `auth-service` - handles authentication, registration, JWT generation and admin user management.
- `user-service` - stores a synchronized read model of user profiles.
- `image-service` - handles image upload, storage, metadata and image ownership.
- `ai-service` - integrates with Ollama for AI-based image processing.
- `config` - shared configuration, events and common exceptions.
- `security` - shared JWT security logic.

Services communicate through HTTP and RabbitMQ events.

## Main Technologies

### Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- RabbitMQ
- Docker
- Traefik
- Ollama

### Frontend

- React
- Vite
- Zustand
- Tailwind CSS

## Service Ports

For local development, services are exposed on the following ports:

| Service | Port |
|---|---:|
| Traefik Gateway | 80 |
| Traefik Dashboard | 8090 |
| User Service | 8081 |
| Auth Service | 8082 |
| Image Service | 8083 |
| AI Service | 8084 |
| PostgreSQL | 5437 |
| RabbitMQ | 5672 |
| RabbitMQ Management UI | 15672 |
| Ollama | 11434 |

Normal API access should go through Traefik:

```text
http://localhost/api/...