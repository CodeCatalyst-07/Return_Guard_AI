# from fastapi import FastAPI
# import antigravity  # because why not 🚀

# app = FastAPI()

# @app.get("/")
# def read_root():
#     return {"message": "Return Guard AI backend is running 🚀"}

# @app.get("/health")
# def health():
#     return {"status": "healthy"}
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import antigravity

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://return-guard-ai-j3n4.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Return Guard AI backend is running 🚀"}

@app.get("/health")
def health():
    return {"status": "healthy"}
