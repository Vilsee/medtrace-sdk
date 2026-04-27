from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import create_async_engine

from app.database import engine, Base
from app.routers import traces, audit

app = FastAPI(
    title="MedTrace Server",
    version="0.1.0",
    description="Trace storage and audit backend for MedTrace-SDK"
)

# CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://dashboard-oxtsnd3zc-vilsees-projects.vercel.app",
        "https://dashboard-m7t4ytck4-vilsees-projects.vercel.app",
        "https://dashboard-hrz23f2gb-vilsees-projects.vercel.app",
        "https://dashboard-5cuphxz0x-vilsees-projects.vercel.app",
        "https://dashboard-taupe-five-15.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(traces.router)
app.include_router(audit.router)

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

@app.on_event("startup")
async def startup_event():
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8765, reload=True)
