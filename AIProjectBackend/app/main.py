from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# router importları
from app.routers.audio_stream import audio_router
from app.routers.video_stream import video_router
from app.routers.finalize import finalize_router
from app.routers.mistral_questions import router as mistral_questions_router
from app.routers.answers import router as answers_router
from app.routers.session_results import router as session_results_router
from app.routers.auth import router as auth_router
from app.routers.interviews import router as interviews_router

app = FastAPI(
    title="AI Interview Simulator API",
    description=(
        "Ses ve video analizi ile mülakat simülasyonu yapan backend. "
        "Streaming endpoint'leri, oturum finalize servisi ve Mistral tabanlı soru üretimi içerir."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# routerları ekliyoruz
app.include_router(audio_router, tags=["Streaming"])
app.include_router(video_router, tags=["Streaming"])
app.include_router(finalize_router, tags=["Finalize"])
app.include_router(mistral_questions_router, tags=["Questions"])
app.include_router(answers_router, tags=["Answers"])
app.include_router(session_results_router, tags=["Sessions"])
app.include_router(auth_router, tags=["Auth"])
app.include_router(interviews_router, tags=["Interviews"])

@app.get("/")
def root():
    return {"status": "running"}
