from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import FileResponse

from core.tempfiles import generate_temp_path, save_upload
from core.errors import raise_bad_request, raise_internal_error
from services.xml_service import xml_to_excel_service, xml_preview_service, validate_xml_service

router = APIRouter(prefix="", tags=["XML"])


@router.post("/xml-to-excel")
async def xml_to_excel(files: list[UploadFile] = File(...)):
    if not files:
        raise_bad_request("Envie pelo menos um arquivo XML")

    try:
        files_data = []
        for f in files:
            content = await f.read()
            files_data.append((f.filename, content))

        output_path = generate_temp_path(suffix=".xlsx")
        count = xml_to_excel_service(files_data, output_path)

        return FileResponse(
            path=output_path,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="notas_fiscais.xlsx",
            headers={"X-Files-Processed": str(count)}
        )
    except Exception as e:
        from core.tempfiles import cleanup_temp
        cleanup_temp(output_path)
        raise raise_internal_error(f"Erro ao processar XML: {str(e)}")


@router.post("/xml-preview")
async def xml_preview(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.xml'):
        raise_bad_request("Envie um arquivo XML")

    content = await file.read()
    return xml_preview_service(content, file.filename)


@router.post("/validate-xml")
async def validate_xml(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.xml'):
        raise_bad_request("Envie um arquivo XML")

    content = await file.read()
    return validate_xml_service(content, file.filename)
