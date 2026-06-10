import xml.etree.ElementTree as ET
from pathlib import Path
from typing import List, Dict, Any, Optional

import pandas as pd

from core.tempfiles import cleanup_temp
from core.errors import raise_bad_request


NFE_NAMESPACE = 'http://www.portalcatalao.net/nfe'


def _find_text(element, *paths) -> str:
    for path in paths:
        found = element.find(path)
        if found is not None and found.text:
            return found.text
    return ''


def xml_to_excel_service(files_data: List[tuple], output_path: Path) -> int:
    all_notas = []
    all_itens = []

    for filename, content in files_data:
        try:
            root = ET.fromstring(content)
        except ET.ParseError as e:
            raise_bad_request(f"XML invalido: {filename} - {str(e)}")

        ns = {'nfe': NFE_NAMESPACE}

        chave = _find_text(root, './/{http://www.portalcatalao.net/nfe}chNFe', './/chNFe', './/infNFe', 'chNFe')
        numero = _find_text(root, './/{http://www.portalcatalao.net/nfe}nNF', './/nNF')
        serie = _find_text(root, './/{http://www.portalcatalao.net/nfe}serie', './/serie')
        dh_emi = _find_text(root, './/{http://www.portalcatalao.net/nfe}dhEmi', './/dhEmi', './/dEmi')
        emitente = _find_text(root, './/{http://www.portalcatalao.net/nfe}xNome', './/emit', './/xNome')
        destinatario_elem = root.find('.//{http://www.portalcatalao.net/nfe}dest')
        destinatario = _find_text(destinatario_elem, './/{http://www.portalcatalao.net/nfe}xNome', './/xNome') if destinatario_elem is not None else ''
        vnf = _find_text(root, './/{http://www.portalcatalao.net/nfe}vNF', './/vNF')

        nota = {
            'chave': chave, 'numero': numero, 'serie': serie,
            'data_emissao': dh_emi, 'emitente': emitente,
            'destinatario': destinatario, 'valor_total': vnf
        }
        all_notas.append(nota)

        for item in root.findall('.//{http://www.portalcatalao.net/nfe}det'):
            cprod = _find_text(item, './/{http://www.portalcatalao.net/nfe}cProd', './/cProd')
            xprod = _find_text(item, './/{http://www.portalcatalao.net/nfe}xProd', './/xProd')
            qcom = _find_text(item, './/{http://www.portalcatalao.net/nfe}qCom', './/qCom')
            vuncom = _find_text(item, './/{http://www.portalcatalao.net/nfe}vUnCom', './/vUnCom')
            all_itens.append({
                'chave': chave, 'numero': numero,
                'codigo': cprod, 'descricao': xprod,
                'quantidade': qcom, 'valor_unitario': vuncom
            })

    with pd.ExcelWriter(output_path, engine='openpyxl') as writer_obj:
        if all_notas:
            pd.DataFrame(all_notas).to_excel(writer_obj, sheet_name='notas', index=False)
        if all_itens:
            pd.DataFrame(all_itens).to_excel(writer_obj, sheet_name='itens', index=False)

    return len(files_data)


def xml_preview_service(content: bytes, filename: str) -> dict:
    try:
        root = ET.fromstring(content)
    except ET.ParseError as e:
        raise_bad_request(f"XML invalido: {str(e)}")

    result = {
        "filename": filename,
        "valid": True,
    }

    inf_nfe = root.find(f'.//{{{NFE_NAMESPACE}}}infNFe')
    if inf_nfe is not None:
        def t(path):
            el = inf_nfe.find(f'.//{{{NFE_NAMESPACE}}}{path}')
            return el.text if el is not None and el.text else ''

        result['tipo'] = 'NF-e'
        result['dados'] = {
            'chave': inf_nfe.get('Id', '').replace('NFe', ''),
            'numero': t('ide/nNF'),
            'serie': t('ide/serie'),
            'data_emissao': t('ide/dhEmi') or t('ide/dEmi'),
            'emitente': {
                'cnpj': t('emit/CNPJ'),
                'nome': t('emit/xNome'),
                'fantasia': t('emit/xFant'),
            },
            'destinatario': {
                'cnpj': t('dest/CNPJ') or t('dest/CPF'),
                'nome': t('dest/xNome'),
            },
            'itens': [],
            'totais': {
                'vBC': t('total/ICMSTot/vBC'),
                'vICMS': t('total/ICMSTot/vICMS'),
                'vNF': t('total/ICMSTot/vNF'),
            }
        }
    else:
        result['tipo'] = 'XML generico'
        result['mensagem'] = 'XML valido, mas nao identificado como NF-e'

    return result


def validate_xml_service(content: bytes, filename: str) -> dict:
    result = {
        "filename": filename,
        "file_size_bytes": len(content),
    }

    try:
        ET.fromstring(content)
        result["well_formed"] = True
        result["message"] = "XML bem formado e valido"
    except ET.ParseError as e:
        result["well_formed"] = False
        result["message"] = f"XML invalido: {str(e)}"
        result["error_line"] = getattr(e, 'position', None)

    return result
