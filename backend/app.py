import sys
import os
import shutil
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth, pdf, image, xml, editor, tools

OCR_LOCAL_PATH = Path("C:/Users/joaop/Downloads/Projetos/OCR-HTR-LOCAL")
if OCR_LOCAL_PATH.exists():
    sys.path.insert(0, str(OCR_LOCAL_PATH))

app = FastAPI(title="PDF Tools API", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Original-Size", "X-Compressed-Size", "X-Reduction-Percent",
        "X-Total-Pages", "X-Files-Generated", "X-Pages-Converted",
        "X-Reordered-Pages", "X-Images-Converted", "X-Output-Pages",
        "X-Pages-Processed", "X-Tables-Found", "X-Rotated-Pages",
        "X-Extracted-Pages", "X-Removed-Pages", "X-Input-Size",
        "X-Output-Size", "X-Operations-Applied", "X-Fields-Added",
        "X-Replaced-Text", "X-Protected-Size", "X-Unlocked-Size",
        "X-Files-Processed", "X-Cropped-Pages", "X-Images-Extracted",
        "X-Repaired-Size", "X-Bookmarks-Created", "X-Modes-Simulated", "X-Modes",
        "X-Sheets-Processed", "X-Chars-Extracted", "X-Redacted-Count"
    ]
)

app.include_router(pdf.router)
app.include_router(image.router)
app.include_router(xml.router)
app.include_router(editor.router)
app.include_router(tools.router)
app.include_router(auth.router)


@app.get("/")
def read_root():
    return {"status": "ok", "message": "PDF Tools API esta rodando", "version": "2.0"}


@app.get("/output-config")
def output_config():
    from core.outputfiles import DEFAULT_OUTPUT_DIR, has_server_output_dir
    return {
        "enabled": has_server_output_dir(),
        "path": str(DEFAULT_OUTPUT_DIR) if has_server_output_dir() else "",
    }


@app.post("/output-config")
def set_output_dir(body: dict):
    from core import outputfiles
    sub = (body.get("subdir") or "").strip().replace("\\", "/")
    # Sanitize: remove path traversal
    parts = [p for p in sub.split("/") if p and p != ".." and p != "."]
    base = Path(os.getenv("OUTPUT_DIR", "").strip()) if os.getenv("OUTPUT_DIR", "").strip() else Path.home() / "Downloads"
    new_dir = base / "/".join(parts) if parts else base
    new_dir.mkdir(parents=True, exist_ok=True)
    outputfiles.DEFAULT_OUTPUT_DIR = new_dir
    return {"enabled": True, "path": str(new_dir)}


@app.get("/output-config/list")
def list_output_subdirs():
    base_str = os.getenv("OUTPUT_DIR", "").strip()
    base = Path(base_str) if base_str else Path.home() / "Downloads"
    if not base.exists():
        return {"base": str(base), "dirs": []}
    dirs = sorted([d.name for d in base.iterdir() if d.is_dir()])
    return {"base": str(base), "dirs": dirs}


@app.on_event("shutdown")
async def cleanup():
    from core.tempfiles import TEMP_DIR
    for f in TEMP_DIR.glob("*"):
        try:
            if f.is_file():
                f.unlink()
            elif f.is_dir():
                shutil.rmtree(f)
        except Exception:
            pass


from core.tempfiles import start_cleanup_thread
start_cleanup_thread()
