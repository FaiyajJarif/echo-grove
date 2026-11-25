# Echo Grove backend

Spring Boot 3.4 API (Java 17). The music is generated in the browser; this service only stores and serves gardens.

## Run

```bash
cd backend
mvn spring-boot:run        # or open the folder in IntelliJ and run EchoGroveApplication
```

API on http://localhost:8080. Data is kept in `backend/data/` (embedded H2, git-ignored).

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Wake-up check |
| GET | `/api/presets` | The four built-in presets |
| POST | `/api/gardens` | Save a garden, returns its 8-character share code |
| GET | `/api/gardens/{code}` | Load a shared garden |
| GET | `/api/gardens?limit=12` | Most recent gardens for the gallery |

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | 8080 | Port to listen on (set by most hosts) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Frontend origins allowed by CORS |
