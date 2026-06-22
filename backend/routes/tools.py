from pathlib import Path
from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse, JSONResponse

from core.security import validate_pdf
from core.tempfiles import generate_temp_path, save_upload
from core.errors import raise_bad_request, raise_internal_error
from core.outputfiles import DEFAULT_OUTPUT_DIR, files_payload, save_output_bytes, AutoSaveFileResponse
from services.tools_service import (
    base64_encode_service, base64_decode_service,
    hash_service, uuid_service,
    url_encode_service, url_decode_service,
    json_format_service, lorem_service,
    diff_service, regex_service,
    repair_pdf_service, bookmarks_service,
    colorblind_simulate_service, qrcode_service,
    csv_json_service, markdown_to_pdf_service,
    cpf_cnpj_service, redact_pdf_service,
    compare_pdfs_service, search_pdfs_service,
)

router = APIRouter(prefix="", tags=["Tools"])


@router.post("/save-output")
async def save_output(file: UploadFile = File(...), filename: str = Form("")):
    try:
        content = await file.read()
        output_name = filename or file.filename or "arquivo.bin"
        saved_path = save_output_bytes(content, output_name)
        return JSONResponse({
            "filename": saved_path.name,
            "path": str(saved_path),
            "directory": str(DEFAULT_OUTPUT_DIR),
            "size": saved_path.stat().st_size,
        })
    except Exception as e:
        raise raise_internal_error(f"Erro ao salvar arquivo: {str(e)}")


@router.post("/base64-encode")
async def base64_encode(text: str = Form(...)):
    try:
        result = base64_encode_service(text)
        return JSONResponse({"result": result, "action": "encode"})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/base64-decode")
async def base64_decode(text: str = Form(...)):
    try:
        result = base64_decode_service(text)
        return JSONResponse({"result": result, "action": "decode"})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/hash")
async def generate_hash(text: str = Form(...), algorithm: str = Form("sha256")):
    try:
        result = hash_service(text, algorithm)
        return JSONResponse({"result": result, "algorithm": algorithm})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/uuid")
async def generate_uuid(version: str = Form("v4"), count: str = Form("1")):
    try:
        results = uuid_service(version, int(count))
        return JSONResponse({"results": results, "version": version, "count": len(results)})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/url-encode")
async def url_encode(text: str = Form(...)):
    try:
        result = url_encode_service(text)
        return JSONResponse({"result": result, "action": "encode"})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/url-decode")
async def url_decode(text: str = Form(...)):
    try:
        result = url_decode_service(text)
        return JSONResponse({"result": result, "action": "decode"})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/json-tool")
async def json_tool(json_text: str = Form(...), action: str = Form("format")):
    try:
        result = json_format_service(json_text, action)
        return JSONResponse(result)
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/lorem")
async def lorem(paragraphs: str = Form("3"), words: str = Form("50")):
    try:
        result = lorem_service(int(paragraphs), int(words))
        return JSONResponse({"paragraphs": result, "count": len(result)})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/diff")
async def diff_text(text1: str = Form(...), text2: str = Form(...)):
    try:
        result = diff_service(text1, text2)
        return JSONResponse({"diff": result, "lines": len(result)})
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/regex")
async def regex_test(pattern: str = Form(...), text: str = Form(""), flags: str = Form("")):
    try:
        result = regex_service(pattern, text, flags)
        return JSONResponse(result)
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/repair-pdf")
async def repair_pdf(file: UploadFile = File(...)):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_repaired.pdf")

    try:
        result_path, original_size, repaired_size = repair_pdf_service(input_path, output_path)
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)

        return AutoSaveFileResponse(
            path=result_path,
            media_type="application/pdf",
            filename=f"repaired_{file.filename}",
            headers={
                "X-Original-Size": str(original_size),
                "X-Repaired-Size": str(repaired_size),
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(str(e))


@router.post("/cpf-cnpj")
async def cpf_cnpj(text: str = Form(...), action: str = Form("validate")):
    try:
        result = cpf_cnpj_service(text, action)
        return JSONResponse(result)
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/redact-pdf")
async def redact_pdf(
    file: UploadFile = File(...),
    redact_type: str = Form("cpf"),
    terms: str = Form(""),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_redacted.pdf")

    try:
        result_path, count = redact_pdf_service(input_path, output_path, redact_type, terms)
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)

        return AutoSaveFileResponse(
            path=result_path,
            media_type="application/pdf",
            filename=f"redacted_{file.filename}",
            headers={"X-Redacted-Count": str(count)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(str(e))


@router.post("/compare-pdfs")
async def compare_pdfs(file1: UploadFile = File(...), file2: UploadFile = File(...)):
    validate_pdf(file1.filename)
    validate_pdf(file2.filename)

    content1 = await file1.read()
    content2 = await file2.read()
    input_path1 = save_upload(content1)
    input_path2 = save_upload(content2)

    try:
        result = compare_pdfs_service(input_path1, input_path2)
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path1, input_path2)
        return JSONResponse(result)
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path1, input_path2)
        raise raise_internal_error(str(e))


@router.post("/search-pdfs")
async def search_pdfs(files: list[UploadFile] = File(...), query: str = Form(...)):
    if not query.strip():
        raise_bad_request("Termo de busca vazio")
    for f in files:
        validate_pdf(f.filename)

    temp_paths = []
    try:
        for f in files:
            content = await f.read()
            temp_paths.append(save_upload(content))

        result = search_pdfs_service(temp_paths, query)
        from core.tempfiles import cleanup_temp
        cleanup_temp(*temp_paths)
        return JSONResponse(result)
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(*temp_paths)
        raise raise_internal_error(str(e))


@router.post("/bookmarks")
async def bookmarks(
    file: UploadFile = File(...),
    bookmarks_json: str = Form(""),
):
    validate_pdf(file.filename)
    content = await file.read()
    input_path = save_upload(content)

    try:
        if bookmarks_json.strip():
            output_path = generate_temp_path(suffix="_bookmarks.pdf")
            result = bookmarks_service(input_path, output_path, bookmarks_json)
            from core.tempfiles import cleanup_temp
            cleanup_temp(input_path)
            return AutoSaveFileResponse(
                path=output_path,
                media_type="application/pdf",
                filename=f"bookmarks_{file.filename}",
                headers={"X-Bookmarks-Created": str(result["bookmarks_count"])}
            )
        else:
            result = bookmarks_service(input_path, Path(""), None)
            from core.tempfiles import cleanup_temp
            cleanup_temp(input_path)
            return JSONResponse(result)
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)
        raise raise_internal_error(str(e))


@router.post("/colorblind-simulate")
async def colorblind_simulate(file: UploadFile = File(...)):
    from core.security import validate_image
    validate_image(file.filename)
    content = await file.read()
    input_path = save_upload(content)
    output_folder = generate_temp_path(suffix="_colorblind")
    output_folder.mkdir(exist_ok=True)

    try:
        image_paths, modes = colorblind_simulate_service(input_path, output_folder)
        entries = [(path, path.name, "image/png") for path in image_paths]
        payload = files_payload(entries)

        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)

        return JSONResponse(
            payload,
            headers={
                "X-Modes-Simulated": str(len(modes)),
                "X-Modes": ",".join(modes)
            }
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_folder)
        raise raise_internal_error(str(e))


@router.post("/qrcode")
async def generate_qrcode(text: str = Form(...), format: str = Form("png")):
    try:
        output_path = qrcode_service(text, format)
        content_type = {"png": "image/png", "jpg": "image/jpeg", "webp": "image/webp"}.get(format, "image/png")
        return AutoSaveFileResponse(
            path=output_path,
            media_type=content_type,
            filename=f"qrcode.{format}"
        )
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/csv-json")
async def csv_json(input_text: str = Form(...), direction: str = Form("csv-to-json")):
    try:
        result = csv_json_service(input_text, direction)
        return JSONResponse(result)
    except Exception as e:
        raise raise_internal_error(str(e))


@router.post("/markdown-to-pdf")
async def markdown_to_pdf(file: UploadFile = File(...)):
    from core.security import validate_file_extension
    validate_file_extension(file.filename, [".md", ".markdown", ".txt"])
    content = await file.read()
    input_path = save_upload(content)
    output_path = generate_temp_path(suffix="_md.pdf")

    try:
        result_path = markdown_to_pdf_service(input_path, output_path)
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path)

        return AutoSaveFileResponse(
            path=result_path,
            media_type="application/pdf",
            filename=file.filename.replace(".md", "").replace(".markdown", "").replace(".txt", "") + ".pdf"
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(input_path, output_path)
        raise raise_internal_error(str(e))
