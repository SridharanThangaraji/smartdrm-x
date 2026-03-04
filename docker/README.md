# Docker — SmartDRM-X

Build and run SmartDRM-X (backend + frontend) in a container.

## 1. Build the image

From the **project root** (`smart-drm/`):

```bash
docker build -t smart-drm -f docker/Dockerfile .
```

## 2. Run the container

```bash
docker run --rm -p 8000:8000 -p 5173:5173 --name smart-drm-app smart-drm
```

- **Backend (API):** http://127.0.0.1:8000 — docs at http://127.0.0.1:8000/docs  
- **Frontend:** http://127.0.0.1:5173  

## 3. Backend only

To run only the FastAPI backend:

```bash
docker run --rm -p 8000:8000 smart-drm python run.py --backend-only
```

## 4. Ganache

Ensure Ganache is running (host or another container) and configure the backend with the correct RPC URL and contract address via environment variables if your app supports it.
