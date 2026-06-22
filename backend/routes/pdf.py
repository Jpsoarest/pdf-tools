import json
import os
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse

from core.security import validate_pdf
from core.tempfiles import generate_temp_path, save_upload
from core.errors import raise_bad_request, raise_internal_error
from core.outputfiles import files_payload, auto_save_to_output, AutoSaveFileResponse
from services.pdf_service import (
    compress_pdf_service, merge_pdf_service, split_pdf_service,
    reorder_pdf_service, rotate_pdf_service,
    extract_pages_service, remove_pages_service, protect_pdf_service,
    unlock_pdf_service, pdf_to_jpg_service, crop_pdf_service,
    pdf_info_service, read_metadata_service, edit_metadata_service,
    pdf_to_png_service, pdf_to_webp_service, extract_images_service,
    pdf_to_excel_service, excel_to_pdf_service, pdf_to_txt_service,
)

router = APIRouter(prefix="", tags=["PDF"])


@router.post("/compress-pdf")
async def compress_pdf(file: UploadFile = File(...), compression_level: int = Form(55)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_compressed.pdf")

    try:
        result_path, reduction = compress_pdf_service(input_path, output_path, compression_level)
        original_size = len(content)
        final_size = os.path.getsize(result_path)

        return AutoSaveFileResponse(
            path=result_path,
            media_type="application/pdf",
            filename=f"compressed_{file.filename}",
            headers={
                "X-Original-Size": str(original_size),
                "X-Compressed-Size": str(final_size),
                "X-Reduction-Percent": f"{reduction:.1f}"
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao processar PDF: {str(e)}")


def parse_merge_orientations(raw_orientations, expected_count: int) -> list[str]:
    if raw_orientations is None:
        return ["auto"] * expected_count
    if not isinstance(raw_orientations, list) or len(raw_orientations) != expected_count:
        raise_bad_request("Orientacoes precisam corresponder aos arquivos")
    allowed = {"auto", "portrait", "landscape"}
    orientations = []
    for item in raw_orientations:
        if item not in allowed:
            raise_bad_request("Orientacao invalida")
        orientations.append(item)
    return orientations


def parse_merge_rotations(raw_rotations, expected_count: int) -> list[int]:
    if raw_rotations is None:
        return [0] * expected_count
    if not isinstance(raw_rotations, list) or len(raw_rotations) != expected_count:
        raise_bad_request("Rotacoes precisam corresponder aos arquivos")
    allowed = {0, 90, 180, 270}
    rotations = []
    for item in raw_rotations:
        if item not in allowed:
            raise_bad_request("Rotacao invalida")
        rotations.append(item)
    return rotations


@router.post("/merge-pdf")
async def merge_pdf(files: list[UploadFile] = File(...), orientations: str = Form(""), rotations: str = Form("")):
    if len(files) < 2:
        raise_bad_request("Envie pelo menos 2 arquivos PDF")
    for f in files:
        validate_pdf(f.filename)

    parsed_orientations = ["auto"] * len(files)
    if orientations.strip():
        try:
            parsed_orientations = parse_merge_orientations(json.loads(orientations), len(files))
        except json.JSONDecodeError:
            raise_bad_request("Orientacoes invalidas")

    parsed_rotations = [0] * len(files)
    if rotations.strip():
        try:
            parsed_rotations = parse_merge_rotations(json.loads(rotations), len(files))
        except json.JSONDecodeError:
            raise_bad_request("Rotacoes invalidas")

    temp_files = []
    try:
        for file in files:
            content = await file.read()
            temp_files.append(save_upload(content))

        output_path = generate_temp_path(suffix="_merged.pdf")
        total_pages = merge_pdf_service(temp_files, output_path, parsed_orientations, parsed_rotations)

        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="merged.pdf",
            headers={"X-Total-Pages": str(total_pages)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(*temp_files)
        raise raise_internal_error(f"Erro ao mesclar PDFs: {str(e)}")


@router.post("/merge-pdf-batch")
async def merge_pdf_batch(files: list[UploadFile] = File(...), manifest: str = Form(...)):
    if not files:
        raise_bad_request("Envie os arquivos PDF dos lotes")
    try:
        groups = json.loads(manifest)
    except json.JSONDecodeError:
        raise_bad_request("Manifesto de lotes invalido")
    if not isinstance(groups, list) or not groups:
        raise_bad_request("Adicione pelo menos um lote pronto")
    for file in files:
        validate_pdf(file.filename)

    temp_files = []
    output_files = []
    try:
        for file in files:
            content = await file.read()
            temp_files.append(save_upload(content))

        entries = []
        seen_names = set()
        for position, group in enumerate(groups, start=1):
            raw_name = str(group.get("filename", "")).strip() if isinstance(group, dict) else ""
            indexes = group.get("indexes") if isinstance(group, dict) else None
            orientations = group.get("orientations") if isinstance(group, dict) else None
            rotations = group.get("rotations") if isinstance(group, dict) else None
            if not raw_name or not isinstance(indexes, list) or len(indexes) < 2:
                raise_bad_request("Cada lote precisa de nome e ao menos 2 PDFs")
            parsed_orientations = parse_merge_orientations(orientations, len(indexes))
            parsed_rotations = parse_merge_rotations(rotations, len(indexes))

            safe_name = "".join(
                ch if ch.isalnum() or ch in (" ", "-", "_", ".") else "_"
                for ch in raw_name
            ).strip(" .") or f"mesclagem_{position}"
            if not safe_name.lower().endswith(".pdf"):
                safe_name += ".pdf"
            if safe_name.lower() in seen_names:
                raise_bad_request(f"Nome duplicado no lote: {safe_name}")
            seen_names.add(safe_name.lower())

            selected = []
            selected_orientations = []
            selected_rotations = []
            for index in indexes:
                if not isinstance(index, int) or index < 0 or index >= len(temp_files):
                    raise_bad_request("Referencia de arquivo invalida no lote")
                selected.append(temp_files[index])
                selected_orientations.append(parsed_orientations[len(selected_orientations)])
                selected_rotations.append(parsed_rotations[len(selected_rotations)])

            output_path = generate_temp_path(suffix="_merged.pdf")
            merge_pdf_service(selected, output_path, selected_orientations, selected_rotations)
            output_files.append(output_path)
            entries.append((output_path, safe_name))

        payload = files_payload((output_path, output_name, "application/pdf") for output_path, output_name in entries)

        from core.tempfiles import cleanup_temp
        cleanup_temp(*temp_files, *output_files)
        return JSONResponse(
            payload,
            headers={"X-Files-Generated": str(len(entries))}
        )
    except HTTPException:
        from core.tempfiles import cleanup_temp
        cleanup_temp(*temp_files, *output_files)
        raise
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(*temp_files, *output_files)
        raise raise_internal_error(f"Erro ao processar lote de mesclagens: {str(e)}")


@router.post("/split-pdf")
async def split_pdf(
    file: UploadFile = File(...),
    mode: str = Form("all"),
    ranges: str = Form(""),
    groups: str = Form("")
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_folder = generate_temp_path(suffix="_split")
    output_folder.mkdir(exist_ok=True)

    try:
        effective_ranges = groups if mode == "visual" else ranges
        output_files, total_pages = split_pdf_service(input_path, output_folder, mode, effective_ranges)

        if len(output_files) == 1:
            from core.tempfiles import cleanup_temp
            resp = FileResponse(
                output_files[0],
                media_type="application/pdf",
                filename=output_files[0].name,
                headers={
                    "X-Total-Pages": str(total_pages),
                    "X-Files-Generated": "1",
                },
            )
            cleanup_temp(input_path)
            return resp

        import zipfile
        zip_name = file.filename.replace(".pdf", "").replace(".PDF", "") + "_dividido.zip"
        zip_path = generate_temp_path(suffix=".zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for f in output_files:
                zf.write(f, f.name)

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)

        return AutoSaveFileResponse(
            zip_path,
            media_type="application/zip",
            filename=zip_name,
            headers={
                "X-Total-Pages": str(total_pages),
                "X-Files-Generated": str(len(output_files)),
            },
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)
        raise raise_internal_error(f"Erro ao dividir: {str(e)}")


@router.post("/reorder-pdf")
async def reorder_pdf(file: UploadFile = File(...), order: str = Form(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_reordered.pdf")

    try:
        total_pages = reorder_pdf_service(input_path, output_path, order)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"reordered_{file.filename}",
            headers={
                "X-Total-Pages": str(total_pages),
                "X-Reordered-Pages": str(total_pages)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao reordenar: {str(e)}")


@router.post("/rotate-pdf")
async def rotate_pdf(
    file: UploadFile = File(...),
    rotation: int = Form(...),
    pages: str = Form("all"),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_rotated.pdf")

    try:
        total_pages, rotated = rotate_pdf_service(input_path, output_path, rotation, pages)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"rotated_{file.filename}",
            headers={
                "X-Total-Pages": str(total_pages),
                "X-Rotated-Pages": str(rotated)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao girar PDF: {str(e)}")


@router.post("/extract-pages")
async def extract_pages(file: UploadFile = File(...), pages: str = Form(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_extracted.pdf")

    try:
        total_pages, extracted = extract_pages_service(input_path, output_path, pages)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"extracted_{file.filename}",
            headers={
                "X-Total-Pages": str(total_pages),
                "X-Extracted-Pages": str(extracted)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao extrair paginas: {str(e)}")


@router.post("/remove-pages")
async def remove_pages(file: UploadFile = File(...), pages_to_remove: str = Form(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_removed.pdf")

    try:
        total_pages, removed = remove_pages_service(input_path, output_path, pages_to_remove)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"without_pages_{file.filename}",
            headers={
                "X-Total-Pages": str(total_pages),
                "X-Removed-Pages": str(removed)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao remover paginas: {str(e)}")


@router.post("/protect-pdf")
async def protect_pdf(file: UploadFile = File(...), password: str = Form(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_protected.pdf")

    try:
        original_size, protected_size = protect_pdf_service(input_path, output_path, password)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"protected_{file.filename}",
            headers={
                "X-Original-Size": str(original_size),
                "X-Protected-Size": str(protected_size)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao proteger PDF: {str(e)}")


@router.post("/unlock-pdf")
async def unlock_pdf(file: UploadFile = File(...), password: str = Form(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_unlocked.pdf")

    try:
        original_size, unlocked_size = unlock_pdf_service(input_path, output_path, password)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"unlocked_{file.filename}",
            headers={
                "X-Original-Size": str(original_size),
                "X-Unlocked-Size": str(unlocked_size)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao remover senha: {str(e)}")


@router.post("/pdf-to-jpg")
async def pdf_to_jpg(
    file: UploadFile = File(...),
    quality: str = Form("high"),
    page_mode: str = Form("all"),
    pages: str = Form(""),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_folder = generate_temp_path(suffix="_jpg")
    output_folder.mkdir(exist_ok=True)

    try:
        image_paths, count = pdf_to_jpg_service(input_path, output_folder, quality, page_mode, pages)
        payload = files_payload((path, path.name, "image/jpeg") for path in image_paths)

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)

        return JSONResponse(
            payload,
            headers={"X-Pages-Converted": str(count)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)
        raise raise_internal_error(f"Erro ao converter: {str(e)}")


@router.post("/crop-pdf")
async def crop_pdf(
    file: UploadFile = File(...),
    x: float = Form(...),
    y: float = Form(...),
    width: float = Form(...),
    height: float = Form(...),
    pages: str = Form("all"),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_cropped.pdf")

    try:
        total_pages, cropped = crop_pdf_service(input_path, output_path, x, y, width, height, pages)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"cropped_{file.filename}",
            headers={
                "X-Total-Pages": str(total_pages),
                "X-Cropped-Pages": str(cropped)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao cortar PDF: {str(e)}")


@router.post("/pdf-info")
async def pdf_info(file: UploadFile = File(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)

    try:
        result = pdf_info_service(input_path, file.filename, len(content))
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)
        return result
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)
        raise raise_internal_error(f"Erro ao ler informacoes: {str(e)}")


@router.post("/pdf-metadata")
async def pdf_metadata(file: UploadFile = File(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)

    try:
        result = read_metadata_service(input_path, file.filename, len(content))
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)
        return result
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)
        raise raise_internal_error(f"Erro ao ler metadados: {str(e)}")


@router.post("/edit-pdf-metadata")
async def edit_pdf_metadata(
    file: UploadFile = File(...),
    title: str = Form(""),
    author: str = Form(""),
    subject: str = Form(""),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_meta.pdf")

    try:
        edit_metadata_service(input_path, output_path, title, author, subject)
        return AutoSaveFileResponse(
            path=output_path,
            media_type="application/pdf",
            filename=f"meta_{file.filename}"
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao editar metadados: {str(e)}")


@router.post("/pdf-to-png")
async def pdf_to_png(
    file: UploadFile = File(...),
    quality: str = Form("high"),
    page_mode: str = Form("all"),
    pages: str = Form(""),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_folder = generate_temp_path(suffix="_png")
    output_folder.mkdir(exist_ok=True)

    try:
        image_paths, count = pdf_to_png_service(input_path, output_folder, quality, page_mode, pages)
        payload = files_payload((path, path.name, "image/png") for path in image_paths)

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)

        return JSONResponse(
            payload,
            headers={"X-Pages-Converted": str(count)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)
        raise raise_internal_error(f"Erro ao converter: {str(e)}")


@router.post("/pdf-to-webp")
async def pdf_to_webp(
    file: UploadFile = File(...),
    quality: str = Form("high"),
    page_mode: str = Form("all"),
    pages: str = Form(""),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_folder = generate_temp_path(suffix="_webp")
    output_folder.mkdir(exist_ok=True)

    try:
        image_paths, count = pdf_to_webp_service(input_path, output_folder, quality, page_mode, pages)
        payload = files_payload((path, path.name, "image/webp") for path in image_paths)

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)

        return JSONResponse(
            payload,
            headers={"X-Pages-Converted": str(count)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)
        raise raise_internal_error(f"Erro ao converter: {str(e)}")


@router.post("/extract-images")
async def extract_images(file: UploadFile = File(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_folder = generate_temp_path(suffix="_images")
    output_folder.mkdir(exist_ok=True)

    try:
        image_paths, count = extract_images_service(input_path, output_folder)
        content_type_by_ext = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".bmp": "image/bmp",
            ".tiff": "image/tiff",
        }
        payload = files_payload(
            (path, path.name, content_type_by_ext.get(path.suffix.lower(), "application/octet-stream"))
            for path in image_paths
        )

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)

        return JSONResponse(
            payload,
            headers={"X-Images-Extracted": str(count)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)
        raise raise_internal_error(f"Erro ao extrair imagens: {str(e)}")


@router.post("/pdf-to-excel")
async def pdf_to_excel(
    file: UploadFile = File(...),
    mode: str = Form("tables"),
    pages: str = Form(""),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix=".xlsx")

    try:
        result_path, tables_found = pdf_to_excel_service(input_path, output_path, mode, pages)
        base_name = file.filename.replace('.pdf', '')

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)

        return AutoSaveFileResponse(
            path=result_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename=f"{base_name}.xlsx",
            headers={"X-Tables-Found": str(tables_found)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao converter: {str(e)}")


@router.post("/excel-to-pdf")
async def excel_to_pdf(file: UploadFile = File(...)):
    from core.security import validate_file_extension
    validate_file_extension(file.filename, [".xlsx", ".xls"])
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_excel.pdf")

    try:
        result_path, sheet_count = excel_to_pdf_service(input_path, output_path)
        base_name = file.filename.rsplit(".", 1)[0]

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)

        return AutoSaveFileResponse(
            path=result_path,
            media_type="application/pdf",
            filename=f"{base_name}.pdf",
            headers={"X-Sheets-Processed": str(sheet_count)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao converter: {str(e)}")


@router.post("/pdf-to-txt")
async def pdf_to_txt(file: UploadFile = File(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix=".txt")

    try:
        result_path, page_count, chars = pdf_to_txt_service(input_path, output_path)
        base_name = file.filename.replace(".pdf", "")

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)

        return AutoSaveFileResponse(
            path=result_path,
            media_type="text/plain; charset=utf-8",
            filename=f"{base_name}.txt",
            headers={
                "X-Total-Pages": str(page_count),
                "X-Chars-Extracted": str(chars),
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(f"Erro ao converter: {str(e)}")
