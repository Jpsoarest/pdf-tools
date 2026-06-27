from typing import List

ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif'}
ALLOWED_DOCX_EXTENSIONS = {'.docx', '.doc'}
MAX_FILE_SIZE = 200 * 1024 * 1024


def validate_file_extension(filename: str, allowed: set, error_message: str = "Formato de arquivo nao suportado") -> None:
    ext = '.' + filename.lower().split('.')[-1]
    if ext not in allowed:
        from core.errors import raise_bad_request
        raise_bad_request(error_message)


def validate_pdf(filename: str) -> None:
    if not filename.lower().endswith('.pdf'):
        from core.errors import raise_invalid_pdf
        raise_invalid_pdf()


def validate_image(filename: str) -> None:
    ext = '.' + filename.lower().split('.')[-1]
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        from core.errors import raise_invalid_image
        raise_invalid_image()


def validate_file_size(content: bytes) -> None:
    if len(content) > MAX_FILE_SIZE:
        from core.errors import raise_file_too_large
        raise_file_too_large()


def sanitize_filename(filename: str) -> str:
    import re
    name = filename.strip()
    name = re.sub(r'[\\/:*?"<>|]', '_', name)
    name = re.sub(r'\.{2,}', '.', name)
    return name or "arquivo"
