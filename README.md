# FoilCTF

_This project has been created as part of the 42 curriculum by `yait-nas`, `souahidi`, `aindjare`, `asabir`._

## Description

**FoilCTF** is a CTF hosting platform. The goal of this project is to let you create, manage, and run cybersecurity Capture The Flag (CTF) competitions.

**Key Features:**

- **Microservices Architecture:** Decoupled services for high modularity and individual scalability.
- **Challenge Management:** Comprehensive API for creating and managing cybersecurity challenges.
- **Real-time Interaction:** Integrated chat and notification systems for seamless competition flow.
- **Sandboxed Execution:** Secure, isolated environments for running challenge instances using Podman.
- **Event Tracking:** Robust logging and tracking of user progress and competition events.
- **Micro-frontend Architecture:** Modern web interface built with React and Vite.
- **Monitoring & Metrics:** Integrated Prometheus and Grafana for system health and performance tracking.

### Project Overview

FoilCTF is a comprehensive ecosystem designed to facilitate the creation and management of cybersecurity competitions. By leveraging a **Microservices Architecture**, the platform ensures high availability and fault tolerance. Each service, from the challenge engine to the notification system, operates independently, allowing for granular scaling based on competition demands.

### Purpose

Developed as part of the 42 curriculum, FoilCTF serves as a practical implementation of advanced DevOps and Full-stack development concepts. The project's core objective is to provide a secure, scalable, and user-friendly environment where organizers can host diverse security challenges—ranging from web exploitation to reverse engineering—while providing participants with a seamless, real-time competitive experience.

### What Makes It Unique?

- **On-Demand Sandboxing:** Unlike platforms that use shared environments, FoilCTF utilizes **Podman** to spin up isolated, ephemeral containers for each participant. This ensures that every user interacts with a clean environment, preventing cross-contamination and enhancing security.
- **Real-Time Synchronization:** The platform integrates WebSockets to provide instant feedback on scoreboard changes, chat messages, and system notifications, creating a high-energy atmosphere typical of live CTF events.
- **Modular Frontend:** The **Micro-frontend** approach allows for a decoupled UI where different competition modules can be updated or replaced without a full site redeploy, ensuring the platform remains agile and extensible.

## Team Information

| Login      | Role(s)         | Responsibilities                                                                            |
| ---------- | --------------- | ------------------------------------------------------------------------------------------- |
| `yait-nas` | Product Owner   | Defines the product vision, prioritizes features, and ensures the project meets user needs. |
| `souahidi` | Project Manager | Facilitates team coordination and removes obstacles.                                        |
| `aindjare` | Technical Lead  | Oversees technical decisions and architecture.                                              |
| `asabir`   | Developer       | Implement features and modules.                                                             |

## Project Management

**Work Organization:**

- **Agile Methodology:** Iterative development with regular syncs and task prioritization.
- **Microservices Ownership:** Distributed responsibility across the team for different service layers.
- **Collaborative Git Workflow:** Use of feature branches, descriptive commits, and collaborative code reviews.

**Tools Used:**

- **Project Management:** Github Project / Google sheets
- **Communication:** Discord
- **Version Control:** Git/GitHub

## Technical Stack

### **Frontend:**

- **React (Vite):** Modern, fast frontend development.
- **React Router:** For client-side routing.
- **Tailwind CSS:** For fast and flexible styling.

### **Backend:**

**Service Layer (Go):**

- **Gateway:** Central entry point using Go's `net/http` reverse proxy for routing and SSL termination.
- **Chat:** Real-time messaging service.
- **Notification:** System-wide notification management.
- **Event:** Tracking and logging service.
- **Sandbox:** Isolated execution manager interfacing with Podman.

**Service Layer (Node.js/TypeScript):**

- **User:** Authentication and profile management using Drizzle ORM.
- **Challenge:** Logic for challenge lifecycle and states.
- **Web:** Server-side logic for the web frontend.

**Database:**

- **PostgreSQL:** Primary relational database.

**Infrastructure & Persistence:**

- **Drizzle ORM:** TypeScript ORM for type-safe database interactions.
- **Docker Compose:** Container orchestration for local development and deployment.
- **Podman:** Used within the Sandbox service for secure container isolation.

**Monitoring:**

- **Prometheus:** Metrics collection and alerting.
- **Grafana:** Visual dashboards for monitoring service health.

**Major Technical Choices Justification:**

- **Microservices Architecture**: Ensures high availability and individual service scalability, allowing the platform to handle varying loads during competitions.
- **Podman Sandboxing**: Guarantees secure, isolated, and clean environments for every participant, preventing infrastructure compromise and cross-contamination.
- **Micro-frontend Architecture**: Facilitates decoupled UI development, allowing for modular updates and a more maintainable codebase.
- **Go for Infrastructure Services**: Leverages Go's high performance and concurrency for the Gateway and Sandbox manager.
- **TypeScript & Drizzle ORM**: Provides end-to-end type safety and robust database interactions, minimizing bugs in core business logic.
- **Prometheus & Grafana**: Enables proactive monitoring and observability, ensuring system reliability through real-time metrics and dashboards.

### Database Schema

The FoilCTF database uses a **PostgreSQL** relational schema, managed and queried via **Drizzle ORM**. The architecture is designed to support multi-tenant CTF events, team-based participation, and real-time interactions.

**Core Tables:**

1.  **`users`**: Stores authentication data, roles (`user`, `admin`), and links to profiles and teams.
2.  **`profiles`**: Contains user-specific metadata like bio, avatar path, and aggregate statistics (solves, points).
3.  **`teams`**: Represents competition groups with a captain, member count, and locking mechanisms.
4.  **`team_members`**: Junction table mapping users to their respective teams.
5.  **`ctfs`**: Defines competition events, including start/end times and participant limits.
6.  **`challenges`**: Store global challenge definitions (category, base reward, author).
7.  **`ctfs_challenges`**: Links challenges to specific CTFs with event-specific flags and dynamic scoring parameters.
8.  **`solves`**: Records successful flag submissions for point calculation and "First Blood" tracking.
9.  **`notifications` & `notification_users`**: Manages system-wide and user-specific alerts.
10. **`chat_rooms` & `messages`**: Persists real-time communication logs across different scopes (global, team).
11. **`containers`**: Tracks sandboxed instances associated with participations.

**Key Relationships:**

- **One-to-One**: `users` <-> `profiles`
- **One-to-Many**: `teams` -> `team_members`, `ctfs` -> `participations`, `challenges` -> `hints`
- **Many-to-Many**: `ctfs` <-> `challenges` (via `ctfs_challenges`), `users` <-> `notifications` (via `notification_users`)

## Features List

| Feature         | Description                                              | Team Member(s) |
| --------------- | -------------------------------------------------------- | -------------- |
| Sandbox         | Secure, isolated container environments for challenges.  | `aindjare`     |
| Gateway         | Centralized routing and SSL termination.                 | `souahidi`     |
| Monitor         | Real-time system health and performance metrics.         | `souahidi`     |
| Event           | Tracking and logging of competition events and progress. | `asabir`       |
| Chat            | Real-time communication between participants.            | `asabir`       |
| Notification    | Management and delivery of system-wide alerts.           | `asabir`       |
| Challenge       | API for challenge lifecycle and state management.        | `aindjare`     |
| User Management | User authentication and profile administration.          | `yait-nas`     |

## Modules

**Total Points:** `33` points (`11` **Major** modules × 2pts + `11` **Minor** modules × 1pt)

### Major Modules (2 points each)

| Module                                      | Justification                                                                                                                                                               | Implementation                                                                                                                                                                                    |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use frameworks (frontend + backend)         | Ensures scalability, maintainability, and rapid development using industry-standard tools.                                                                                  | **React (Vite)** for frontend; **Go** and **Node.js (Express)** for backend microservices.                                                                                                        |
| Real-time features (WebSockets)             | Essential for instant feedback in a competitive environment (chat, notifications, scoreboard updates).                                                                      | Custom WebSocket handlers in **Go** (`chat`, `notification`) and client-side listeners in React.                                                                                                  |
| Allow users to interact with other users    | Enhances the social and competitive aspect, allowing teams to coordinate and organizers to broadcast.                                                                       | Dedicated **Chat Service** supporting Global, Team, and Admin-only communication channels.                                                                                                        |
| Public API (5 Endpoints)                    | Enables external integrations, automation, and transparency for participants and developers.                                                                                | Exposed via the **Gateway** (e.g., `/api/profiles`, `/api/challenges`, `/api/teams`, `/api/events`, `/api/notifications`).                                                                        |
| Complete accessibility compliance           | Ensures the platform is usable by all participants regardless of physical or technical constraints.                                                                         | Implementation of **Semantic HTML**, ARIA labels, and keyboard-friendly navigation in the React UI.                                                                                               |
| Standard user management                    | Core foundation for tracking identity, security, and competition progress.                                                                                                  | Centralized **User Service** handling JWT-based Auth, registration, and secure profile management.                                                                                                |
| Advanced permissions system                 | Securely isolates administrative capabilities from standard participant operations.                                                                                         | **Role-Based Access Control (RBAC)** implemented at both the API (Gateway/Middleware) and Database layers.                                                                                        |
| An organization system                      | Facilitates team-based play, which is the standard format for competitive cybersecurity events.                                                                             | Logic in the **User Service** for team creation, member management (invites/requests), and leadership handover.                                                                                   |
| P + G monitoring                            | Provides critical visibility into system health, performance, and potential bottlenecks.                                                                                    | Integrated **Prometheus** for metric collection and **Grafana** for real-time visualization dashboards.                                                                                           |
| Backend as microservices                    | Allows for independent scaling, isolated failure domains, and flexible technology selection.                                                                                | Decoupled architecture with **8+ services** communicating over internal networks and a central Gateway.                                                                                           |
| **Custom API Gateway** _(Module of Choice)_ | Simplifies client-side logic by providing a single, secure entry point while handling all cross-cutting concerns (TLS, auth, rate limiting) outside of individual services. | Custom **Go Reverse Proxy** with self-signed TLS termination, JWT/RBAC middleware, per-IP token-bucket rate limiting, WebSocket-aware routing, Prometheus instrumentation, and graceful shutdown. |

### Minor Modules (1 point each)

| Module                                                   | Justification                                                                                                                             | Implementation                                                                                                                                                                                                                                        |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Use a backend framework                                  | Accelerates API development and follow standard middleware patterns.                                                                      | **Express.js** (Node.js) and **Chi** (Go) for robust request handling.                                                                                                                                                                                |
| Use a frontend framework                                 | Enables reactive, component-based UI development for a seamless user experience.                                                          | **React 19** with Vite for fast HMR and optimized production builds.                                                                                                                                                                                  |
| Use an ORM                                               | Provides type-safety and prevents SQL injection while simplifying schema migrations.                                                      | **Drizzle ORM** with TypeScript for a modern, performant database abstraction layer.                                                                                                                                                                  |
| Notification system                                      | Keeps participants informed of critical event changes and team interactions in real-time.                                                 | Event-driven **Notification Service** with persistent storage and WebSocket push updates.                                                                                                                                                             |
| Server-Side Rendering (SSR)                              | Improves initial page load performance and ensures content visibility for social sharing.                                                 | **React Router v7** with SSR capabilities enabled for critical routes.                                                                                                                                                                                |
| Custom-made design system                                | Maintains visual consistency and brand identity across the entire platform.                                                               | Built from scratch using **Tailwind CSS v4** utility classes and custom component tokens.                                                                                                                                                             |
| Advanced search functionality                            | Allows users to quickly find specific challenges, teams, or players in large competitions.                                                | SQL-based **ILIKE** pattern matching and indexed search in the User/Challenge services.                                                                                                                                                               |
| File upload and management                               | Necessary for profile customization and distributing challenge artifacts.                                                                 | Integration with standard **multipart/form-data** processing and local volume persistence.                                                                                                                                                            |
| Support for additional browsers                          | Ensures a consistent experience for participants using diverse operating systems and browsers.                                            | Cross-browser testing and use of standard-compliant CSS/JS (PostCSS/Autoprefixer).                                                                                                                                                                    |
| Remote authentication (OAuth)                            | Simplifies the onboarding process by leveraging existing identity providers.                                                              | Native integration with the **42 School OAuth** provider for seamless registration.                                                                                                                                                                   |
| **CTF Lifecycle Automation Engine** _(Module of Choice)_ | Automates event state transitions and participant notifications without manual intervention, ensuring competitions run reliably at scale. | Background cron in the **Event Service** that atomically transitions CTF states (`published` → `active` → `ended`) inside DB transactions, creates per-participant notifications, and broadcasts real-time WebSocket events to all connected clients. |

---

### Modules of Choice

#### Major: Custom API Gateway

**Why we chose this module:**  
FoilCTF is built as a distributed microservices system with 7+ independently deployed services. Without a dedicated gateway, every client would need to know the individual address and port of each service, TLS would need to be configured redundantly across all of them, and cross-cutting concerns like authentication and rate limiting would have to be duplicated in every service. A purpose-built gateway was the only way to enforce a clean security boundary at the edge.

**What technical challenges it addresses:**

- **Self-signed TLS certificate generation at boot** — The gateway generates an RSA-2048 certificate and key at startup if none are present, enabling zero-configuration HTTPS for any deployment environment without an external CA.
- **WebSocket-aware reverse proxying** — Each service in the Service Registry declares whether it accepts WebSocket upgrades. For those that do, the gateway disables read/write deadlines on the response controller so long-lived WS connections are never prematurely killed.
- **JWT validation and RBAC enforcement** — A middleware layer parses `Authorization: Bearer` tokens, validates HMAC-SHA256 signatures, and checks the `role` claim against the per-route `RequiredRole` constraint before forwarding any request.
- **Per-IP token-bucket rate limiting** — A `sync.RWMutex`-guarded in-memory store maintains a `golang.org/x/time/rate` limiter per client IP, with configurable RPS and burst. A background goroutine evicts stale entries every 5 minutes to prevent unbounded memory growth.
- **Prometheus metrics** — Every proxied request is counted and timed; a `gateway_rate_limited_requests_total` counter tracks rejections — all scraped by the centralized Prometheus instance.
- **Graceful OS-signal shutdown** — SIGINT/SIGTERM triggers a context-bounded `srv.Shutdown()` with a 5-second timeout, allowing in-flight requests to drain cleanly.

**How it adds value to the project:**  
All client traffic — REST, WebSocket, and SSR — flows through a single address (`https://localhost:3443`). This eliminates redundant auth logic in individual services, centralizes security policy, and provides a unified `/health` and `/metrics` endpoint for the entire stack. No service exposes any host port except the gateway itself.

**Why it deserves Major status (2 points):**  
The gateway is implemented entirely from scratch in Go using only the standard library's `net/http/httputil` and a minimal router. It covers the same functional surface as production infrastructure products (Traefik, Kong, NGINX), implementing: TLS certificate lifecycle management, JWT RBAC middleware, per-IP adaptive rate limiting with automatic GC, protocol-aware proxying (HTTP + WebSocket), Prometheus instrumentation, Service Registry pattern, and graceful shutdown — all as a single-responsibility microservice.

---

#### Minor: CTF Lifecycle Automation Engine

**Why we chose this module:**  
A live CTF competition requires precise, reliable state transitions — a challenge event must automatically activate at its scheduled start time and close at its end time, even if no administrator is online. Without automation, organizers would have to manually trigger every state change, creating delays that corrupt competition fairness. This is a domain-specific automation problem with no equivalent in any standard module.

**What technical challenges it addresses:**

- **Atomic multi-step DB transactions** — Each cron tick executes inside a `gorm.DB.Transaction`, ensuring that CTF status updates and the corresponding participant notifications are committed atomically. A failure at any step rolls back the entire operation, preventing partial state corruption.
- **Fan-out notification creation** — When a CTF transitions to `active`, the engine queries all registered participants via a multi-join (`ctfs` → `participations` → `teams` → `users`), deduplicates notifications per CTF using an in-memory ID map, and bulk-inserts `notification_users` rows — minimizing DB round-trips while ensuring every participant receives exactly one notification.
- **Cross-service real-time broadcasting** — After the DB commit, the event is published to the WebSocket hub, which fans it out to all connected clients in real-time, giving participants instant in-browser feedback when their competition starts.
- **Idempotent design** — The `WHERE status = 'published' AND start_time < NOW()` predicate is naturally idempotent: re-running the cron on already-transitioned rows is a no-op, making the system safe under cron overlap or scheduler restarts.

**How it adds value to the project:**  
Competition organizers can schedule events in advance with full confidence that activation and notification delivery will happen on time without any manual intervention. This is a core operational requirement for a CTF hosting platform and directly enables the asynchronous, multi-event use case the platform is designed for.

**Why it deserves Minor status (1 point):**  
The automation engine is a self-contained background subsystem within the Event Service. It demonstrates real technical depth — transactional fan-out, cross-service integration, and idempotent scheduling — while being correctly scoped as a supporting facility rather than a primary platform feature.

---

## Instructions

### Prerequisites

Before running this project, ensure you have the following installed:

- **Podman** (or Docker) with Compose support.
- **Make** (standard build tool).
- **Node.js** (v24 or higher) - for local development/type-checking.
- **Go** (v1.25 or higher) - for local development.
- **pnpm** - for frontend and Node.js service dependency management.

**Configuration:**

- **.env setup**: A `.env` file must be created in the root directory. You can use `make init` to generate one from the template.
- **SSL Certificates**: The Gateway service automatically generates self-signed certificates in the `gateway-certs` volume for secure HTTPS/WSS communication.
- **Environment Variables**: Update `.env` with secure `ACCESS_TOKEN_SECRET`, `REFRSH_TOKEN_SECRET`, and database credentials.

### Installation

1. Clone the repository:

   ```bash
   git clone [repository-url]
   cd FoilCTF
   ```

2. Initialize, build and start all services:

   ```bash
   make run
   ```

3. Access the application at: `https://localhost:3443`

### Additional Commands

- **Help:** `make help`
- **Start services:** `make up`
- **Stop services:** `make down`
- **Show logs:** `make logs`
- **Hard reset (delete volumes):** `make fclean`
- **Check status:** `make ps`

## Resources

**Documentation & References:**

- [React Router v7 Documentation](https://reactrouter.com/en/main)
- [Go-Chi Router](https://go-chi.io/)
- [Drizzle ORM Guide](https://orm.drizzle.team/)
- [Prometheus Monitoring](https://prometheus.io/docs/introduction/overview/)
- [Grafana Dashboards](https://grafana.com/docs/grafana/latest/)

## AI Usage

- **Tasks:** Implementing large text, grammar correction, searching, writing Documentation.
- **Parts of Project:** README.md, Privacy and Policies, Documentation.
- **Tools Used:** GitHub Copilot, ChatGPT, Claude.

## Known Limitations

- **Self-Signed Certificates**: The current Gateway implementation uses self-signed SSL certificates, which may trigger browser warnings in local development.
- **Rootless Podman**: Sandbox service requires a properly configured Podman socket, which may vary across Linux distributions.

## Future Improvements

- **Kubernetes Manifests**: Transitioning from Docker Compose to K8s for better production orchestration.
- **Additional OAuth Providers**: Support for GitHub and Google authentication.
- **Automated CTF Templates**: Pre-configured challenge sets for quick competition deployment.

## License

BSD 3-Clause License

## Credits

- Special thanks to the creators of **React**, **Go**, and **Drizzle ORM** for providing such robust foundations.
