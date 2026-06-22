import json
import os
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse

from core.tempfiles import generate_temp_path, save_upload
from core.errors import raise_bad_request, raise_internal_error
from core.outputfiles import AutoSaveFileResponse
from services.image_service import (
    compress_image_service, convert_image_service,
    resize_image_service, images_to_pdf_service, validate_image_filename
)

router = APIRouter(prefix="", tags=["Imagem"])


@router.post("/compress-image")
async def compress_image(
    file: UploadFile = File(...),
    quality: int = Form(80),
    target_format: str = Form("original"),
):
    ext = validate_image_filename(file.filename)
    content = await file.read()
    input_path = save_upload(content, ext)
    output_ext = ext if target_format == "original" else f".{target_format}"
    output_path = generate_temp_path(suffix=f"_compressed{output_ext}")

    try:
        output_size = compress_image_service(input_path, output_path, quality, target_format, len(content))
        return AutoSaveFileResponse(
            path=output_path,
            media_type=f"image/{output_ext.replace('.', '')}",
            filename=f"compressed_{os.path.splitext(file.filename)[0]}{output_ext}",
            headers={
                "X-Original-Size": str(len(content)),
                "X-Compressed-Size": str(output_size),
                "X-Reduction-Percent": f"{((len(content) - output_size) / len(content) * 100):.1f}" if len(content) > 0 else "0"
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao comprimir imagem: {str(e)}")


@router.post("/convert-image")
async def convert_image(file: UploadFile = File(...), target_format: str = Form(...)):
    ext = validate_image_filename(file.filename)

    if target_format not in ('jpg', 'png', 'webp'):
        raise_bad_request("Formato de destino invalido. Use jpg, png ou webp")

    if ext == f'.{target_format}':
        raise_bad_request("A imagem ja esta no formato desejado")

    content = await file.read()
    input_path = save_upload(content, ext)
    output_path = generate_temp_path(suffix=f".{target_format}")

    try:
        output_size = convert_image_service(input_path, output_path, target_format, len(content))
        media_type = 'image/jpeg' if target_format == 'jpg' else f'image/{target_format}'
        return AutoSaveFileResponse(
            path=output_path,
            media_type=media_type,
            filename=f"{os.path.splitext(file.filename)[0]}.{target_format}",
            headers={
                "X-Original-Size": str(len(content)),
                "X-Output-Size": str(output_size)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao converter imagem: {str(e)}")


@router.post("/resize-image")
async def resize_image(
    file: UploadFile = File(...),
    width: int = Form(...),
    height: int = Form(...),
    keep_aspect: str = Form("true"),
):
    ext = validate_image_filename(file.filename)
    content = await file.read()
    input_path = save_upload(content, ext)
    output_ext = ext if ext != '.jpeg' else '.jpg'
    output_path = generate_temp_path(suffix=f"_resized{output_ext}")

    try:
        keep = keep_aspect.lower() in ('true', '1', 'yes')
        new_w, new_h, output_size = resize_image_service(
            input_path, output_path, width, height, keep, len(content)
        )
        return AutoSaveFileResponse(
            path=output_path,
            media_type=f"image/{output_ext.replace('.', '')}",
            filename=f"resized_{os.path.splitext(file.filename)[0]}{output_ext}",
            headers={
                "X-Original-Size": str(len(content)),
                "X-Output-Size": str(output_size)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao redimensionar: {str(e)}")


@router.post("/images-to-pdf")
async def images_to_pdf(
    files: list[UploadFile] = File(...),
    page_size: str = Form("auto"),
    orientation: str = Form("auto"),
    image_orientations: str = Form(""),
    image_rotations: str = Form(""),
    margin_mm: int = Form(10),
    fit: str = Form("contain"),
):
    if not files:
        raise_bad_request("Envie pelo menos uma imagem")

    allowed_ext = {'.jpg', '.jpeg', '.png', '.webp'}
    for f in files:
        ext = '.' + f.filename.lower().split('.')[-1]
        if ext not in allowed_ext:
            raise_bad_request(f"Formato nao suportado: {f.filename}")

    output_path = generate_temp_path(suffix="_images.pdf")

    try:
        images_data = []
        for f in files:
            content = await f.read()
            images_data.append(content)

        per_image_orientations = None
        if image_orientations.strip():
            try:
                parsed_orientations = json.loads(image_orientations)
            except json.JSONDecodeError:
                raise_bad_request("Orientacoes individuais invalidas")
            if not isinstance(parsed_orientations, list) or len(parsed_orientations) != len(files):
                raise_bad_request("Orientacoes individuais precisam corresponder as imagens")
            allowed_orientations = {"auto", "portrait", "landscape"}
            if any(item not in allowed_orientations for item in parsed_orientations):
                raise_bad_request("Orientacao individual invalida")
            per_image_orientations = parsed_orientations

        per_image_rotations = None
        if image_rotations.strip():
            try:
                parsed_rotations = json.loads(image_rotations)
            except json.JSONDecodeError:
                raise_bad_request("Rotacoes individuais invalidas")
            if not isinstance(parsed_rotations, list) or len(parsed_rotations) != len(files):
                raise_bad_request("Rotacoes individuais precisam corresponder as imagens")
            allowed_rotations = {0, 90, 180, 270}
            if any(item not in allowed_rotations for item in parsed_rotations):
                raise_bad_request("Rotacao individual invalida")
            per_image_rotations = parsed_rotations

        page_count = images_to_pdf_service(
            images_data, output_path, page_size, orientation, margin_mm, fit,
            per_image_orientations, per_image_rotations
        )

        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="images.pdf",
            headers={
                "X-Images-Converted": str(len(files)),
                "X-Output-Pages": str(page_count)
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(output_path)
        raise raise_internal_error(f"Erro ao converter imagens: {str(e)}")
