# FastAPI Baseline Template
# Provides predictable baseline files for Python FastAPI projects

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World"}