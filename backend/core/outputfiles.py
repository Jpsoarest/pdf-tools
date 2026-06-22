import base64
import os
import shutil
from pathlib import Path
from typing import Iterable

from fastapi.responses import FileResponse as _OrigFileResponse


def default_user_output_dir() -> Path:
    configured_output_dir = os.getenv("OUTPUT_DIR", "").strip()
    if configured_output_dir:
        return Path(configured_output_dir).expanduser()

    home = Path.home()
    for directory_name in ("Downloads", "downloads"):
        candidate = home / directory_name
        if candidate.exists():
            return candidate
    return home


DEFAULT_OUTPUT_DIR = default_user_output_dir()


def safe_filename(filename: str, fallback: str = "arquivo") -> str:
    raw = (filename or fallback).strip()
    safe = "".join(ch if ch.isalnum() or ch in (" ", "-", "_", ".") else "_" for ch in raw)
    safe = safe.strip(" .")
    return safe or fallback


def unique_output_path(filename: str) -> Path:
    safe_name = safe_filename(filename)
    output_path = DEFAULT_OUTPUT_DIR / safe_name
    if not output_path.exists():
        return output_path

    stem = output_path.stem
    suffix = output_path.suffix
    counter = 2
    while True:
        candidate = DEFAULT_OUTPUT_DIR / f"{stem}_{counter}{suffix}"
        if not candidate.exists():
            return candidate
        counter += 1


def save_output_bytes(content: bytes, filename: str) -> Path:
    output_path = unique_output_path(filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as output:
        output.write(content)
    return output_path


def save_output_file(source_path: Path, filename: str) -> Path:
    output_path = unique_output_path(filename)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source_path, output_path)
    return output_path


def has_server_output_dir() -> bool:
    return bool(os.getenv("OUTPUT_DIR", "").strip())


def auto_save_to_output(source_path: Path, filename: str) -> Path | None:
    if not has_server_output_dir():
        return None
    return save_output_file(source_path, filename)


def AutoSaveFileResponse(path, *, filename=None, **kwargs):
    """FileResponse that also saves to OUTPUT_DIR when configured."""
    save_name = filename or Path(path).name
    auto_save_to_output(Path(path), save_name)
    return _OrigFileResponse(path, filename=filename, **kwargs)


def files_payload(entries: Iterable[tuple[Path, str, str]]) -> dict:
    files = []
    for path, filename, content_type in entries:
        safe_name = safe_filename(filename, path.name)
        content = path.read_bytes()
        files.append({
            "filename": safe_name,
            "contentType": content_type or "application/octet-stream",
            "contentBase64": base64.b64encode(content).decode("ascii"),
            "size": len(content),
        })
    return {
        "files": files,
        "count": len(files),
        "defaultOutputDir": str(DEFAULT_OUTPUT_DIR),
    }
