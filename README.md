# Hangbeats Starter Setup

This repository now contains:
- `backend` at root: Spring Boot (Java 21), JWT-based auth starter, MySQL connectivity.
- `frontend`: React + TypeScript (Vite) starter wired to backend APIs.
- `docker-compose.yml`: legacy SQL Server compose file (not used for current MySQL setup).

## 1) Prepare MySQL

Use your local MySQL credentials in root `.env`:
- `DB_URL=jdbc:mysql://localhost:3306/hangbeats?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC`
- `DB_USERNAME=root`
- `DB_PASSWORD=<your_real_mysql_password>`

Make sure database `hangbeats` exists.

## 2) Run Backend

1. Ensure Java 21 is active.
2. Run:
   - `mvn spring-boot:run`

Backend endpoints:
- `GET /api/v1/health` (public)
- `POST /api/v1/auth/token` (public) body: `{ "username": "john" }`
- `POST /api/v1/auth/register` (public) body: `{ "username": "john", "displayName": "John Doe" }`
- `GET /api/v1/auth/me` (JWT required) current authenticated user
- `GET /api/v1/users` (JWT required, optional `query` filter)
- `GET /api/v1/users/{id}` (JWT required)
- `POST /api/v1/users` (JWT required) body: `{ "username": "john", "displayName": "John Doe" }`
- `PUT /api/v1/users/{id}` (JWT required) body: `{ "username": "john", "displayName": "John Updated" }`
- `DELETE /api/v1/users/{id}` (JWT required)

## 3) Run Frontend

1. Go to frontend folder:
   - `cd frontend`
2. Copy env template:
   - `cp .env.example .env`
3. Install packages:
   - `npm install`
4. Start app:
   - `npm run dev`

Frontend runs at `http://localhost:5173`.

## Best usage flow (frontend)

1. Click **Check Backend** first and confirm backend status is `UP`.
2. New users should use **Create New Profile** and click **Create Profile & Sign In**.
3. Existing users can use **Authenticate** and click **Get JWT Token**.
4. Use **Refresh Profile** to verify token identity from `/api/v1/auth/me`.
5. In **User Management**, create users and click **Load Users** to refresh.
6. Use **Edit** / **Save Changes** / **Delete** to run full CRUD.
7. Use **Search users** to filter by username or display name.
8. Use **Copy Token** for Postman/cURL testing of protected APIs.

## Notes

- This is a build-phase starter for Hangbeats and can be split into separate microservices next (auth, user, chat, message, gateway).
- Current JWT flow issues tokens for a username to unblock initial development and API integration.

## 4) Run Unit Tests

- Backend:
  - `mvn test`
- Frontend:
  - `cd frontend && npm test`
