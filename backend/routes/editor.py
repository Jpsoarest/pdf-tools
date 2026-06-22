import os
import json
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import FileResponse

from core.security import validate_pdf, validate_image
from core.tempfiles import generate_temp_path, save_upload
from core.errors import raise_bad_request, raise_internal_error
from core.outputfiles import AutoSaveFileResponse
from services.editor_service import (
    get_text_layer_service, edit_pdf_service, watermark_pdf_service,
    number_pages_service, ocr_pdf_service, image_to_text_service,
    pdf_to_word_service, word_to_pdf_service,
)

router = APIRouter(prefix="", tags=["Editor"])


@router.post("/pdf-text-layer")
async def pdf_text_layer(file: UploadFile = File(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)

    try:
        result = get_text_layer_service(input_path, file.filename)
        return result
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)
        raise raise_internal_error(f"Erro ao ler texto do PDF: {str(e)}")


@router.post("/edit-pdf")
async def edit_pdf(file: UploadFile = File(...), operations: str = Form("[]")):
    validate_pdf(file.filename)

    try:
        parsed_operations = json.loads(operations)
    except json.JSONDecodeError:
        raise_bad_request("Lista de operacoes invalida")

    if not isinstance(parsed_operations, list):
        raise_bad_request("Operacoes devem ser um array JSON")
    if len(parsed_operations) > 500:
        raise_bad_request("Limite de 500 operacoes por PDF")

    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_edited.pdf")

    try:
        total_pages, applied, fields_added, replaced_text = edit_pdf_service(
            input_path, output_path, parsed_operations, file.filename
        )
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"edited_{file.filename}",
            headers={
                "X-Total-Pages": str(total_pages),
                "X-Operations-Applied": str(applied),
                "X-Fields-Added": str(fields_added),
                "X-Replaced-Text": str(replaced_text),
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao editar PDF: {str(e)}")


@router.post("/watermark-pdf")
async def watermark_pdf(
    file: UploadFile = File(...),
    text: str = Form(""),
    opacity: float = Form(0.3),
    position: str = Form("center"),
    font_size: int = Form(48),
    pages: str = Form("all"),
    image: Optional[UploadFile] = File(None),
):
    validate_pdf(file.filename)
    if not text.strip() and image is None:
        raise_bad_request("Informe um texto ou uma imagem para a marca dagua")

    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_watermarked.pdf")

    try:
        image_data = None
        if image:
            image_data = await image.read()

        total_pages = watermark_pdf_service(
            input_path, output_path, text, opacity, position, font_size, pages, image_data
        )
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"watermarked_{file.filename}",
            headers={"X-Total-Pages": str(total_pages)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao aplicar marca dagua: {str(e)}")


@router.post("/number-pages")
async def number_pages(
    file: UploadFile = File(...),
    start_number: int = Form(1),
    format_str: str = Form("1"),
    position: str = Form("bottom"),
    margin: int = Form(30),
    skip_first: str = Form("false"),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_numbered.pdf")

    try:
        skip = skip_first.lower() in ('true', '1', 'yes')
        total_pages = number_pages_service(
            input_path, output_path, start_number, format_str, position, margin, skip
        )
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"numbered_{file.filename}",
            headers={"X-Total-Pages": str(total_pages)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao numerar paginas: {str(e)}")


@router.post("/ocr-pdf")
async def ocr_pdf(file: UploadFile = File(...), lang: str = Form("pt")):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_ocr.txt")

    try:
        total_pages = ocr_pdf_service(input_path, output_path, lang)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="text/plain; charset=utf-8",
            filename=f"{file.filename.replace('.pdf', '')}_ocr.txt",
            headers={"X-Total-Pages": str(total_pages)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro no OCR: {str(e)}")


@router.post("/image-to-text")
async def image_to_text(file: UploadFile = File(...), lang: str = Form("pt")):
    validate_image(file.filename)
    ext = '.' + file.filename.lower().split('.')[-1]
    allowed_ocr_ext = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif'}
    if ext not in allowed_ocr_ext:
        raise_bad_request("Formato nao suportado. Envie JPG, PNG, WebP ou BMP")

    content = await file.read()
    input_path = save_upload(content, ext)
    output_path = generate_temp_path(suffix="_ocr.txt")

    try:
        image_to_text_service(input_path, output_path, lang)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="text/plain; charset=utf-8",
            filename=f"{os.path.splitext(file.filename)[0]}_ocr.txt"
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro no OCR: {str(e)}")


@router.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...), pages: str = Form("")):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix=".docx")

    try:
        pages_processed = pdf_to_word_service(input_path, output_path, pages)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=f"{file.filename.replace('.pdf', '')}.docx",
            headers={"X-Pages-Processed": str(pages_processed)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao converter para Word: {str(e)}")


@router.post("/word-to-pdf")
async def word_to_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(('.docx', '.doc')):
        raise_bad_request("Envie um arquivo .docx ou .doc")

    content = await file.read()
    ext = '.' + file.filename.lower().split('.')[-1]
    input_path = save_upload(content, ext)
    output_path = generate_temp_path(suffix=".pdf")

    try:
        word_to_pdf_service(input_path, output_path)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"{os.path.splitext(file.filename)[0]}.pdf"
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao converter Word: {str(e)}")
