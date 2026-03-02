# FoilCTF

*This project has been created as part of the 42 curriculum by `yait-nas`, `souahidi`, `aindjare`, `asabir`.*

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

| Login | Role(s) | Responsibilities |
|-------|---------|------------------|
| `yait-nas` | Product Owner | Defines the product vision, prioritizes features, and ensures the project meets user needs. |
| `souahidi` | Project Manager | Facilitates team coordination and removes obstacles. |
| `aindjare` | Technical Lead | Oversees technical decisions and architecture. |
| `asabir` | Developer | Implement features and modules. |

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

| Feature | Description | Team Member(s) |
|---------|-------------|----------------|
| Sandbox | Secure, isolated container environments for challenges. | `aindjare` |
| Gateway | Centralized routing and SSL termination. | `souahidi` |
| Monitor | Real-time system health and performance metrics. | `souahidi` |
| Event | Tracking and logging of competition events and progress. | `asabir` |
| Chat | Real-time communication between participants. | `asabir` |
| Notification | Management and delivery of system-wide alerts. | `asabir` |
| Challenge | API for challenge lifecycle and state management. | `aindjare` |
| User Management | User authentication and profile administration. | `yait-nas` |

## Modules

**Total Points:** `32` points (`11` **Major** modules × 2pts + `10` **Minor** modules × 1pt)

### Major Modules (2 points each)

| Module | Justification | Implementation |
|--------|---------------|----------------|
| Use frameworks (frontend + backend) | Ensures scalability, maintainability, and rapid development using industry-standard tools. | **React (Vite)** for frontend; **Go** and **Node.js (Express)** for backend microservices. |
| Real-time features (WebSockets) | Essential for instant feedback in a competitive environment (chat, notifications, scoreboard updates). | Custom WebSocket handlers in **Go** (`chat`, `notification`) and client-side listeners in React. |
| Allow users to interact with other users | Enhances the social and competitive aspect, allowing teams to coordinate and organizers to broadcast. | Dedicated **Chat Service** supporting Global, Team, and Admin-only communication channels. |
| Public API (5 Endpoints) | Enables external integrations, automation, and transparency for participants and developers. | Exposed via the **Gateway** (e.g., `/api/profiles`, `/api/challenges`, `/api/teams`, `/api/events`, `/api/notifications`). |
| Complete accessibility compliance  | Ensures the platform is usable by all participants regardless of physical or technical constraints. | Implementation of **Semantic HTML**, ARIA labels, and keyboard-friendly navigation in the React UI. |
| Standard user management | Core foundation for tracking identity, security, and competition progress. | Centralized **User Service** handling JWT-based Auth, registration, and secure profile management. |
| Advanced permissions system | Securely isolates administrative capabilities from standard participant operations. | **Role-Based Access Control (RBAC)** implemented at both the API (Gateway/Middleware) and Database layers. |
| An organization system | Facilitates team-based play, which is the standard format for competitive cybersecurity events. | Logic in the **User Service** for team creation, member management (invites/requests), and leadership handover. |
| P + G monitoring | Provides critical visibility into system health, performance, and potential bottlenecks. | Integrated **Prometheus** for metric collection and **Grafana** for real-time visualization dashboards. |
| Backend as microservices | Allows for independent scaling, isolated failure domains, and flexible technology selection. | Decoupled architecture with **8+ services** communicating over internal networks and a central Gateway. |
| GateWay | Simplifies client-side logic by providing a single entry point and handling cross-cutting concerns. | Custom **Go Reverse Proxy** managing routing, SSL termination, and service-level rate limiting. |


### Minor Modules (1 point each)

| Module | Justification | Implementation |
|--------|---------------|----------------|
| Use a backend framework | Accelerates API development and follow standard middleware patterns. | **Express.js** (Node.js) and **Chi** (Go) for robust request handling. |
| Use a frontend framework | Enables reactive, component-based UI development for a seamless user experience. | **React 19** with Vite for fast HMR and optimized production builds. |
| Use an ORM | Provides type-safety and prevents SQL injection while simplifying schema migrations. | **Drizzle ORM** with TypeScript for a modern, performant database abstraction layer. |
| Notification system | Keeps participants informed of critical event changes and team interactions in real-time. | Event-driven **Notification Service** with persistent storage and WebSocket push updates. |
| Server-Side Rendering (SSR) | Improves initial page load performance and ensures content visibility for social sharing. | **React Router v7** with SSR capabilities enabled for critical routes. |
| Custom-made design system | Maintains visual consistency and brand identity across the entire platform. | Built from scratch using **Tailwind CSS v4** utility classes and custom component tokens. |
| Advanced search functionality | Allows users to quickly find specific challenges, teams, or players in large competitions. | SQL-based **ILIKE** pattern matching and indexed search in the User/Challenge services. |
| File upload and management | Necessary for profile customization and distributing challenge artifacts. | Integration with standard **multipart/form-data** processing and local volume persistence. |
| Support for additional browsers | Ensures a consistent experience for participants using diverse operating systems and browsers. | Cross-browser testing and use of standard-compliant CSS/JS (PostCSS/Autoprefixer). |
| Remote authentication (OAuth) | Simplifies the onboarding process by leveraging existing identity providers. | Native integration with the **42 School OAuth** provider for seamless registration. |



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

**AI Usage:**
- **Tasks:** [e.g, Documentation]
- **Parts of Project:** [e.g, Comments]
- **Tools Used:** [e.g, GitHub Copilot, ChatGPT, Claude]

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
