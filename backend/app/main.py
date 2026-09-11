import os
import time
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

# Ensure OpenMP runtime stability on Windows
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.config import settings
from backend.app.services.model_manager import model_manager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("medintel.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager.
    Loads and validates all trained ML models once during startup.
    """
    logger.info("=" * 60)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} ({settings.ENVIRONMENT})")
    logger.info("=" * 60)
    
    try:
        model_manager.load_all_models()
        logger.info("All machine learning modules initialized successfully.")
    except Exception as e:
        logger.critical(f"FATAL: Model loading failed during startup: {e}", exc_info=True)
        raise RuntimeError(f"Startup aborted due to model artifact initialization error: {e}") from e

    yield

    logger.info("Shutting down MEDINTEL AI backend services.")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Multimodal Medical Intelligence and Predictive Healthcare Analytics System.\n\n"
        "**CLINICAL NOTICE**: This platform provides AI-assisted clinical decision support for "
        "research and education. It does NOT provide autonomous medical diagnosis or prescriptions. "
        "Licensed clinician oversight is strictly required."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_and_security_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time-Sec"] = f"{process_time:.4f}"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.DEBUG else "An unexpected error occurred during processing.",
            "path": request.url.path,
            "safety_note": settings.MEDICAL_DISCLAIMER
        }
    )


@app.get("/", tags=["System"])
def root_info() -> Dict[str, Any]:
    """Root endpoint returning system overview, safety framing, and API information."""
    return {
        "system": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "role": "AI-Assisted Clinical Decision Support System",
        "autonomous_diagnosis": False,
        "clinical_validation": False,
        "human_oversight_required": True,
        "disclaimer": settings.MEDICAL_DISCLAIMER,
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
def health_check() -> Dict[str, Any]:
    """Comprehensive health check returning ML module status and compute device."""
    model_status = model_manager.get_status()
    return {
        "status": "healthy" if model_status["all_loaded"] else "degraded",
        "timestamp": time.time(),
        "models": model_status["modules"],
        "device": model_status["device"],
        "safety_framing": settings.MEDICAL_DISCLAIMER
    }


# Include API Routers
from backend.app.routes import clinical, imaging, nlp, fusion, explainability, cases, analytics, assistant
app.include_router(clinical.router)
app.include_router(imaging.router)
app.include_router(nlp.router)
app.include_router(fusion.router)
app.include_router(explainability.router)
app.include_router(cases.router)
app.include_router(analytics.router)
app.include_router(assistant.router)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
