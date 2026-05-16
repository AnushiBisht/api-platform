from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import predict
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI API Platform — ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],
    allow_methods=["POST"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(predict.router)

@app.get("/health")
def health():
    return {"status": "ok"}
