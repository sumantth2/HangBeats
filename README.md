# Hangbeats

Full project documentation:
- `docs/PROJECT_DOCUMENTATION.md`

Hangbeats is a full-stack app with:
- Backend: Spring Boot (Java 21), JWT auth, MySQL
- Frontend: React + TypeScript (Vite)

## 1) Local Setup

### Prepare MySQL

Use root `.env` values:
- `DB_URL=jdbc:mysql://127.0.0.1:3306/hangbeats?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `DB_USERNAME=<your_db_user>`
- `DB_PASSWORD=<your_db_password>`
- `JWT_SECRET=<32+ chars>`
- `JWT_EXPIRATION_MINUTES=15`
- `CORS_ALLOWED_ORIGIN=http://localhost:5173`

Create DB if needed:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS hangbeats;"
```

### Run Backend

```bash
cd /Users/sumanthnimmagadda/Downloads/Hangbeats
mvn spring-boot:run
```

### Run Frontend

```bash
cd /Users/sumanthnimmagadda/Downloads/Hangbeats/frontend
npm install
npm run dev
```

Frontend URL:
- `http://localhost:5173`

## 2) Current API Endpoints

Public:
- `GET /api/v1/health`
- `POST /api/v1/auth/token`
- `POST /api/v1/auth/register`
- `GET /api/v1/auth/username-availability?username=<value>`

JWT required:
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `GET /api/v1/users/page?page=0&size=10&query=<optional>`
- `GET /api/v1/users/stats`
- `GET /api/v1/users/{id}`
- `POST /api/v1/users`
- `PUT /api/v1/users/{id}`
- `DELETE /api/v1/users/{id}`

## 3) Basic Validation Commands

Backend tests:
```bash
cd /Users/sumanthnimmagadda/Downloads/Hangbeats
mvn test
```

Frontend tests/build:
```bash
cd /Users/sumanthnimmagadda/Downloads/Hangbeats/frontend
npm test
npm run build
```

## 4) Deployment Lifecycle (Complete Stages and Gates)

This is the full release path from code change to production.

### Stage 1: Change Planning
Goal:
- Define what is changing (feature/bug/security patch).
Gate to pass:
- Scope agreed, acceptance criteria written, rollback plan noted.

### Stage 2: Development on Feature Branch
Goal:
- Implement code in `feature/*` or `fix/*` branch.
Gate to pass:
- Code compiles, no obvious local runtime errors.

### Stage 3: Local Quality Gate
Goal:
- Verify before opening PR.
Must pass:
- `mvn test`
- `npm test`
- `npm run build`

### Stage 4: Pull Request + Code Review
Goal:
- Technical review and maintainability check.
Must pass:
- Reviewer approval
- CI checks green
- No blocking comments

### Stage 5: Merge to Main
Goal:
- Integrate approved change.
Must pass:
- Merge policy satisfied (required checks + approvals)

### Stage 6: Build Release Artifacts
Goal:
- Produce immutable artifacts.
Typical outputs:
- Backend jar
- Docker image `hangbeats-backend:<version>`
- Docker image `hangbeats-frontend:<version>`
Must pass:
- Build success
- Version/tag applied

### Stage 7: Security and Compliance Gate
Goal:
- Ensure deployable artifact is safe.
Must pass:
- Dependency vulnerability scan
- Container image scan
- No high/critical unresolved issues (or approved exception)

### Stage 8: Deploy to Staging
Goal:
- Production-like validation.
Must pass:
- Deployment succeeds
- Health endpoint up
- Smoke/API tests pass

### Stage 9: UAT/QA Sign-off
Goal:
- Confirm business behavior.
Must pass:
- UAT scenarios pass
- Product/QA sign-off

### Stage 10: Production Approval
Goal:
- Controlled promotion to production.
Must pass:
- Manual approval gate from release owner
- Change window confirmed

### Stage 11: Production Deployment
Goal:
- Release new version safely.
Must pass:
- Rolling/blue-green deploy successful
- No startup/migration failures

### Stage 12: Post-Deploy Verification
Goal:
- Confirm stable production behavior.
Must pass:
- Health checks green
- Error rate normal
- Critical business flows work

### Stage 13: Monitoring + Rollback Readiness
Goal:
- Keep system stable and recover quickly if needed.
Must pass:
- Alerts configured
- Rollback tested or documented for current release

## 5) If Code Changes Again: Re-Deployment Steps

When any code changes (frontend or backend), repeat this flow:

1. Create a new branch from latest `main`.
```bash
git checkout main
git pull origin main
git checkout -b feature/<short-change-name>
```

2. Make code changes and commit.
```bash
git add .
git commit -m "feat: <what changed>"
```

3. Run local checks.
```bash
mvn test
cd frontend && npm test && npm run build
```

4. Push branch and open PR.
```bash
git push -u origin feature/<short-change-name>
```

5. Wait for CI to pass and get review approval.

6. Merge PR to `main`.

7. CI/CD pipeline automatically:
- Builds artifacts/images
- Deploys staging
- Runs smoke tests
- Waits for production approval
- Deploys production

8. Verify production (health + user flow).

## 6) CI/CD Pipeline Template (Recommended Jobs)

Recommended CI jobs:
1. `backend_test`
2. `frontend_test`
3. `frontend_build`
4. `backend_package`
5. `docker_build`
6. `security_scan`
7. `publish_images`

Recommended CD jobs:
1. `deploy_staging`
2. `staging_smoke_tests`
3. `manual_approval`
4. `deploy_production`
5. `post_deploy_checks`
6. `rollback_if_failed`

## 7) Docker/Production Notes

Target production packaging:
- `hangbeats-backend` Docker image for API
- `hangbeats-frontend` Docker image for static web app

Recommended production infrastructure:
- Managed MySQL
- Reverse proxy / load balancer
- Secrets manager for DB/JWT credentials
- Centralized logs + metrics + alerting

## 8) Layman Summary

Every release should pass these checkpoints:
- Build works
- Tests pass
- Security checks pass
- Staging works
- Team approves
- Production deploy succeeds
- Monitoring shows healthy system

If you change code later, you do not skip steps. You repeat the same lifecycle so each deployment remains safe and predictable.
