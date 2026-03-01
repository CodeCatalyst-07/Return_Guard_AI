from fastapi import FastAPI
import antigravity  # because why not 🚀

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Return Guard AI backend is running 🚀"}

@app.get("/health")
def health():
    return {"status": "healthy"}
