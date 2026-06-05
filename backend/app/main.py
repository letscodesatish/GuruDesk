from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router # Adjust to match your import

app = FastAPI()

# Enable CORS completely for Vercel's multi-container service environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 💡 Include your routes router with the explicit '/api' prefix
app.include_router(api_router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}