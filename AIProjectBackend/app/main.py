from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# router importları
from app.routers.audio_stream import audio_router
from app.routers.video_stream import video_router
from app.routers.finalize import finalize_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# routerları ekliyoruz
app.include_router(audio_router)
app.include_router(video_router)
app.include_router(finalize_router)

@app.get("/")
def root():
    return {"status": "running"}
