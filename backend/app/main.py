from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <-- NEW
from app.api.routes import router as api_router

app = FastAPI(title="Professor Assistant API")

# --- NEW CORS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Allow Next.js to connect
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ----------------------

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
async def health_check():
    return {"status": "online", "message": "Ready to help the Professor!"}

# Inside your main.py

app.include_router(api_router, prefix="/api/v1")

