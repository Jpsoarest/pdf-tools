from fastapi import HTTPException
from typing import Optional


def raise_bad_request(message: str, code: str = "BAD_REQUEST") -> None:
    raise HTTPException(status_code=400, detail={"code": code, "message": message})


def raise_file_too_large(limit_mb: int = 200) -> None:
    raise HTTPException(status_code=413, detail={"code": "FILE_TOO_LARGE", "message": f"Arquivo excede {limit_mb}MB"})


def raise_invalid_pdf() -> None:
    raise HTTPException(status_code=400, detail={"code": "INVALID_PDF", "message": "Arquivo precisa ser PDF"})


def raise_invalid_image() -> None:
    raise HTTPException(status_code=400, detail={"code": "INVALID_IMAGE", "message": "Formato de imagem nao suportado. Envie JPG, PNG ou WebP"})


def raise_invalid_xml() -> None:
    raise HTTPException(status_code=400, detail={"code": "INVALID_XML", "message": "Envie um arquivo XML"})


def raise_internal_error(message: str, details: Optional[str] = None) -> None:
    detail = {"code": "INTERNAL_ERROR", "message": message}
    if details:
        detail["details"] = details
    raise HTTPException(status_code=500, detail=detail)


def raise_bad_password() -> None:
    raise HTTPException(status_code=401, detail={"code": "BAD_PASSWORD", "message": "Senha incorreta"})
