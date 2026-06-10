import os
import uuid
import shutil
import threading
import time
from pathlib import Path
from typing import List, Tuple

TEMP_DIR = Path("temp")
TEMP_DIR.mkdir(exist_ok=True)


def generate_temp_path(prefix: str = "", suffix: str = "") -> Path:
    file_id = str(uuid.uuid4())
    return TEMP_DIR / f"{prefix}{file_id}{suffix}"


def generate_input_path(suffix: str = ".pdf") -> Path:
    return generate_temp_path(suffix=suffix)


def generate_output_path(suffix: str = ".pdf") -> Path:
    return generate_temp_path(suffix=suffix)


def cleanup_temp(*paths: Path) -> None:
    for p in paths:
        try:
            if p.is_file():
                os.remove(p)
            elif p.is_dir():
                shutil.rmtree(p)
        except Exception:
            pass


def save_upload(content: bytes, ext: str = ".pdf") -> Path:
    from core.security import validate_file_size
    validate_file_size(content)
    path = generate_input_path(ext)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "wb") as f:
        f.write(content)
    return path


def periodic_cleanup(interval_seconds: int = 3600) -> None:
    while True:
        time.sleep(interval_seconds)
        try:
            for f in TEMP_DIR.glob("*"):
                try:
                    if f.is_file():
                        f.unlink()
                    elif f.is_dir():
                        shutil.rmtree(f)
                except Exception:
                    pass
        except Exception:
            pass


def start_cleanup_thread(interval_seconds: int = 3600) -> threading.Thread:
    thread = threading.Thread(target=periodic_cleanup, args=(interval_seconds,), daemon=True)
    thread.start()
    return thread
