export type ToolCategory = 'PDF' | 'Imagem' | 'XML' | 'Utilidades';

export interface ToolCatalogItem {
  id: string;
  name: string;
  href: string;
  oficioHref?: string;
  icon: string;
  desc: string;
  category: ToolCategory;
}

export const essentialOficioToolIds = ['mesclar-pdf', 'editar-pdf', 'reordenar-pdf'];
export const OFICIO_TOOLS_CHANGE_EVENT = 'pdf-tools-oficio-tools-change';
export const OFICIO_PREF_PREFIX = 'pdf-tools-oficio-caxias-tools:';

export function getOficioToolPreferenceKey(userName: string) {
  return `${OFICIO_PREF_PREFIX}${userName.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}`;
}

export const toolCatalog: ToolCatalogItem[] = [
  { id: 'comprimir-pdf', name: 'Comprimir PDF', href: '/comprimir-pdf', icon: 'CP', desc: 'Reduza o tamanho do arquivo.', category: 'PDF' },
  { id: 'mesclar-pdf', name: 'Mesclar PDFs', href: '/mesclar-pdf', oficioHref: '/4oficio/mesclar-pdf', icon: 'MP', desc: 'Junte varios arquivos em um so.', category: 'PDF' },
  { id: 'dividir-pdf', name: 'Dividir PDF', href: '/dividir-pdf', icon: 'DP', desc: 'Separe paginas livremente.', category: 'PDF' },
  { id: 'pdf-para-jpg', name: 'PDF para JPG', href: '/pdf-para-jpg', icon: 'JPG', desc: 'Converta paginas em imagens JPG.', category: 'PDF' },
  { id: 'pdf-para-png', name: 'PDF para PNG', href: '/pdf-para-png', icon: 'PNG', desc: 'Exporte paginas em PNG.', category: 'PDF' },
  { id: 'pdf-para-webp', name: 'PDF para WebP', href: '/pdf-para-webp', icon: 'WEB', desc: 'Formato leve para web.', category: 'PDF' },
  { id: 'extrair-imagens-pdf', name: 'Extrair Imagens', href: '/extrair-imagens-pdf', icon: 'IMG', desc: 'Extraia imagens do PDF.', category: 'PDF' },
  { id: 'reordenar-pdf', name: 'Reordenar PDF', href: '/reordenar-pdf', oficioHref: '/4oficio/reordenar-pdf', icon: 'RP', desc: 'Mude a ordem das paginas.', category: 'PDF' },
  { id: 'girar-pdf', name: 'Girar PDF', href: '/girar-pdf', icon: 'GP', desc: 'Rotacione paginas.', category: 'PDF' },
  { id: 'extrair-paginas', name: 'Extrair Paginas', href: '/extrair-paginas', icon: 'EP', desc: 'Selecione paginas especificas.', category: 'PDF' },
  { id: 'remover-paginas-pdf', name: 'Remover Paginas', href: '/remover-paginas-pdf', icon: 'RM', desc: 'Exclua paginas do PDF.', category: 'PDF' },
  { id: 'cortar-pdf', name: 'Cortar PDF', href: '/cortar-pdf', icon: 'CT', desc: 'Corte personalizado.', category: 'PDF' },
  { id: 'proteger-pdf', name: 'Proteger PDF', href: '/proteger-pdf', icon: 'PR', desc: 'Adicione senha ao PDF.', category: 'PDF' },
  { id: 'remover-senha-pdf', name: 'Remover Senha', href: '/remover-senha-pdf', icon: 'RS', desc: 'Remova protecao de PDFs.', category: 'PDF' },
  { id: 'editar-pdf', name: 'Editar PDF', href: '/editar-pdf', oficioHref: '/4oficio/editar-pdf', icon: 'ED', desc: 'Adicione texto e campos.', category: 'PDF' },
  { id: 'marca-dagua-pdf', name: 'Marca Dagua', href: '/marca-dagua-pdf', icon: 'MD', desc: 'Adicione marca d agua.', category: 'PDF' },
  { id: 'numerar-paginas-pdf', name: 'Numerar Paginas', href: '/numerar-paginas-pdf', icon: 'NP', desc: 'Numeracao automatica.', category: 'PDF' },
  { id: 'pdf-para-excel', name: 'PDF para Excel', href: '/pdf-para-excel', icon: 'XLS', desc: 'Extraia tabelas para planilha.', category: 'PDF' },
  { id: 'pdf-para-word', name: 'PDF para Word', href: '/pdf-para-word', icon: 'DOC', desc: 'Converta para DOCX editavel.', category: 'PDF' },
  { id: 'word-para-pdf', name: 'Word para PDF', href: '/word-para-pdf', icon: 'W2P', desc: 'Converta DOCX em PDF.', category: 'PDF' },
  { id: 'ocr-pdf', name: 'OCR PDF', href: '/ocr-pdf', icon: 'OCR', desc: 'Extraia texto de PDFs escaneados.', category: 'PDF' },
  { id: 'metadados-pdf', name: 'Metadados PDF', href: '/metadados-pdf', icon: 'MT', desc: 'Leia e edite metadados.', category: 'PDF' },
  { id: 'reparar-pdf', name: 'Reparar PDF', href: '/reparar-pdf', icon: 'FX', desc: 'Recupere PDFs corrompidos.', category: 'PDF' },
  { id: 'bookmarks', name: 'Bookmarks', href: '/bookmarks', icon: 'BK', desc: 'Crie e edite marcadores.', category: 'PDF' },
  { id: 'markdown-para-pdf', name: 'Markdown para PDF', href: '/markdown-para-pdf', icon: 'MDP', desc: 'Converta .md em PDF.', category: 'PDF' },
  { id: 'excel-para-pdf', name: 'Excel para PDF', href: '/excel-para-pdf', icon: 'X2P', desc: 'Converta planilhas em PDF.', category: 'PDF' },
  { id: 'pdf-para-txt', name: 'PDF para TXT', href: '/pdf-para-txt', icon: 'TXT', desc: 'Extraia texto puro do PDF.', category: 'PDF' },
  { id: 'redigir-pdf', name: 'Redigir PDF', href: '/redigir-pdf', icon: 'RG', desc: 'Remova dados sensiveis.', category: 'PDF' },
  { id: 'comparar-pdfs', name: 'Comparar PDFs', href: '/comparar-pdfs', icon: 'DF', desc: 'Compare dois PDFs.', category: 'PDF' },
  { id: 'buscar-pdfs', name: 'Buscar em PDFs', href: '/buscar-pdfs', icon: 'BS', desc: 'Pesquise em multiplos PDFs.', category: 'PDF' },
  { id: 'imagem-para-pdf', name: 'Imagem para PDF', href: '/imagem-para-pdf', icon: 'I2P', desc: 'Converta imagens em PDF.', category: 'Imagem' },
  { id: 'comprimir-imagem', name: 'Comprimir Imagem', href: '/comprimir-imagem', icon: 'CI', desc: 'Menos peso, mesma qualidade.', category: 'Imagem' },
  { id: 'converter-imagem', name: 'Converter Imagem', href: '/converter-imagem', icon: 'CV', desc: 'JPG, PNG, WebP e mais.', category: 'Imagem' },
  { id: 'redimensionar-imagem', name: 'Redimensionar', href: '/redimensionar-imagem', icon: 'RD', desc: 'Ajuste dimensoes precisas.', category: 'Imagem' },
  { id: 'imagem-para-texto', name: 'Imagem para Texto', href: '/imagem-para-texto', icon: 'IT', desc: 'OCR em imagens.', category: 'Imagem' },
  { id: 'simulador-daltonismo', name: 'Simulador Daltonismo', href: '/simulador-daltonismo', icon: 'SD', desc: 'Simule tipos de daltonismo.', category: 'Imagem' },
  { id: 'visualizar-xml', name: 'Visualizar XML', href: '/visualizar-xml', icon: 'VX', desc: 'Leia dados da nota fiscal.', category: 'XML' },
  { id: 'xml-para-excel', name: 'XML para Excel', href: '/xml-para-excel', icon: 'XX', desc: 'Exporte NF-e para planilha.', category: 'XML' },
  { id: 'validar-xml', name: 'Validar XML', href: '/validar-xml', icon: 'VL', desc: 'Verifique a estrutura.', category: 'XML' },
  { id: 'gerador-senha', name: 'Gerador de Senha', href: '/gerador-senha', icon: 'GS', desc: 'Senhas seguras e aleatorias.', category: 'Utilidades' },
  { id: 'base64', name: 'Base64', href: '/base64', icon: '64', desc: 'Codifique e decodifique Base64.', category: 'Utilidades' },
  { id: 'gerador-hash', name: 'Gerador de Hash', href: '/gerador-hash', icon: '#', desc: 'MD5, SHA e BLAKE2b.', category: 'Utilidades' },
  { id: 'gerador-uuid', name: 'Gerador de UUID', href: '/gerador-uuid', icon: 'ID', desc: 'UUID em lote.', category: 'Utilidades' },
  { id: 'formatador-json', name: 'Formatador JSON', href: '/formatador-json', icon: '{}', desc: 'Formate e valide JSON.', category: 'Utilidades' },
  { id: 'codificador-url', name: 'Codificador URL', href: '/codificador-url', icon: 'URL', desc: 'Encode e decode de URLs.', category: 'Utilidades' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', href: '/lorem-ipsum', icon: 'LI', desc: 'Texto placeholder.', category: 'Utilidades' },
  { id: 'testador-regex', name: 'Testador de Regex', href: '/testador-regex', icon: 'RX', desc: 'Teste expressoes regulares.', category: 'Utilidades' },
  { id: 'diff-texto', name: 'Diff de Texto', href: '/diff-texto', icon: 'DT', desc: 'Compare textos linha a linha.', category: 'Utilidades' },
  { id: 'contador-caracteres', name: 'Contador de Caracteres', href: '/contador-caracteres', icon: 'CC', desc: 'Conte palavras e caracteres.', category: 'Utilidades' },
  { id: 'qr-code', name: 'QR Code', href: '/qr-code', icon: 'QR', desc: 'Gere QR Codes.', category: 'Utilidades' },
  { id: 'csv-json', name: 'CSV para JSON', href: '/csv-json', icon: 'CSV', desc: 'Converta entre CSV e JSON.', category: 'Utilidades' },
  { id: 'renomear-arquivos', name: 'Renomear Arquivos', href: '/renomear-arquivos', icon: 'RN', desc: 'Renomeie arquivos em lote.', category: 'Utilidades' },
  { id: 'cpf-cnpj', name: 'CPF / CNPJ', href: '/cpf-cnpj', icon: 'BR', desc: 'Valide, formate e gere CPF/CNPJ.', category: 'Utilidades' },
];

export function getToolsByIds(ids: string[]) {
  return ids
    .map((id) => toolCatalog.find((tool) => tool.id === id))
    .filter((tool): tool is ToolCatalogItem => Boolean(tool));
}
