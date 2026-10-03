"""
Ponto de entrada raiz para permitir rodar tanto com:
  uvicorn main:app --reload
quanto com:
  uvicorn app.main:app --reload
"""
from app.main import app

if __name__ == "__main__":
    import os
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
