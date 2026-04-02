# Hangbeats Project Documentation

Last updated: 2026-04-02

## 1) What This App Is (Layman Explanation)

Hangbeats is a small web app where:
- A user can create a profile.
- The app gives that user a secure login token.
- Signed-in users can create, view, edit, and delete user profiles.

Think of it like:
- Frontend = the control dashboard users click on.
- Backend = the secure engine that validates requests and talks to the database.
- Database = the storage locker where user profiles are saved.

## 2) What We Have Built So Far

### Frontend (React + TypeScript + Vite)

Implemented features:
- Backend health check from UI (`Check Backend`).
- New user profile signup (`Create Profile & Sign In`).
- Existing user auth token generation (`Get JWT Token`).
- Current profile check (`Refresh Profile`).
- User management table:
- Load users
- Search/filter users
- Create user
- Edit user
- Delete user
- JWT helper UX:
- Token preview
- Expiry info
- Copy token button

Main frontend files:
- `frontend/src/App.tsx`
- `frontend/src/api.ts`
- `frontend/src/styles.css`
- `frontend/src/App.test.tsx`
- `frontend/src/api.test.ts`

### Backend (Spring Boot + JWT + JPA + MySQL)

Implemented features:
- Health endpoint.
- JWT token issuance endpoint.
- Public registration endpoint (creates profile + returns JWT).
- Authenticated current-user endpoint.
- Full user CRUD endpoints.
- User search by query.
- Validation and structured API error responses.
- Stateless JWT security filter chain.

Main backend files:
- `src/main/java/dev/storm/hangbeats/auth/AuthController.java`
- `src/main/java/dev/storm/hangbeats/user/UserController.java`
- `src/main/java/dev/storm/hangbeats/config/SecurityConfig.java`
- `src/main/java/dev/storm/hangbeats/common/GlobalExceptionHandler.java`
- `src/main/java/dev/storm/hangbeats/user/UserAccountRepository.java`

## 3) API Endpoints (Current)

Public:
- `GET /api/v1/health`
- `POST /api/v1/auth/token`
- `POST /api/v1/auth/register`

JWT required:
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users`
- `PUT /api/v1/users/{id}`
- `DELETE /api/v1/users/{id}`

## 4) Database Documentation

Database engine:
- MySQL

Current main table:
- `user_accounts`

Columns used:
- `id` (auto increment primary key)
- `username` (unique)
- `display_name`
- `created_at`

Environment variables used by backend:
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MINUTES`
- `CORS_ALLOWED_ORIGIN`

Current behavior:
- JPA `ddl-auto=update` is enabled for development convenience.

## 5) Git Documentation (How to Work Safely)

Recommended branch model:
- `main` = production-ready code.
- `develop` = integration branch (optional, if team grows).
- Feature branches per task: `feature/<short-name>`.
- Bugfix branches: `fix/<short-name>`.

Recommended workflow:
1. Pull latest `main`.
2. Create feature branch.
3. Make small commits with clear messages.
4. Run tests locally before push.
5. Open PR.
6. Code review + CI pass.
7. Merge to `main`.
8. Tag release when ready.

Commit message style:
- `feat: add public register endpoint`
- `fix: handle mysql auth error in docs`
- `test: cover user update conflict case`
- `docs: add production deployment guide`

## 6) Current Local Run Commands

Backend:
```bash
cd /Users/sumanthnimmagadda/Downloads/Hangbeats
mvn spring-boot:run
```

Frontend:
```bash
cd /Users/sumanthnimmagadda/Downloads/Hangbeats/frontend
npm install
npm run dev
```

Tests:
```bash
cd /Users/sumanthnimmagadda/Downloads/Hangbeats
mvn test

cd /Users/sumanthnimmagadda/Downloads/Hangbeats/frontend
npm test
```

## 7) Production Readiness Plan (Step-by-Step)

### Step 1: Harden Configuration
- Move all secrets to a secret manager (not `.env` in repo).
- Use separate configs for `dev`, `staging`, `prod`.
- Set strict CORS origin in production.

### Step 2: Database for Production
- Use managed MySQL (RDS/Cloud SQL/Azure Database for MySQL).
- Create least-privilege DB user for app.
- Enable automated backups + retention.
- Add migration tool (Flyway or Liquibase) instead of relying on `ddl-auto=update`.

### Step 3: Containerize the App
- Backend Docker image (Spring Boot jar).
- Frontend Docker image (build static assets, serve via Nginx or similar).
- Keep image tags immutable (example: `hangbeats-backend:1.0.0`).

### Step 4: CI Pipeline
- Trigger on pull requests and pushes to main.
- Run:
- Backend unit tests (`mvn test`)
- Frontend tests (`npm test`)
- Frontend build (`npm run build`)
- Backend package (`mvn package -DskipTests`)
- Build Docker images for backend/frontend.
- Optionally run vulnerability scan on images.

### Step 5: CD Pipeline
- Auto deploy to staging after CI success on `main`.
- Run smoke tests on staging.
- Manual approval gate for production.
- Deploy production with zero-downtime strategy (rolling/blue-green).
- Run post-deploy health checks.

### Step 6: Runtime Operations
- Centralized logs (ELK/OpenSearch/Cloud logs).
- Metrics and alerts (CPU, memory, error rate, response time, DB connections).
- Uptime checks for `/api/v1/health`.
- Incident playbook and rollback procedure.

## 8) Suggested CI/CD Pipeline Stages

1. `checkout`
2. `backend_test`
3. `frontend_test`
4. `frontend_build`
5. `backend_package`
6. `docker_build`
7. `security_scan`
8. `publish_images`
9. `deploy_staging`
10. `smoke_tests`
11. `manual_approval`
12. `deploy_production`
13. `post_deploy_checks`

## 9) Docker and Deployment Notes

Recommended image split:
- `hangbeats-backend` image for Spring Boot API.
- `hangbeats-frontend` image for static web app.

Recommended deployment targets:
- Container platforms like ECS/EKS/AKS/GKE or Kubernetes clusters.
- Reverse proxy/load balancer in front of backend.
- TLS certificates via cloud load balancer or ingress.

## 10) Next Improvements (Engineering Backlog)

- Add role-based auth (admin/user).
- Add pagination to users endpoint.
- Add audit fields (`updatedAt`, `updatedBy`).
- Add integration tests with Testcontainers.
- Add Flyway migrations.
- Add rate limiting and request tracing.
- Add Dockerfiles and production docker-compose/k8s manifests.
