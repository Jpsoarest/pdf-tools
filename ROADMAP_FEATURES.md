# Roadmap Estratégico — PDF Tools

Atualizado em: 2026-05-27
Visão: ser a plataforma de documentos mais rápida, inteligente e completa do mercado — melhor que iLovePDF, Smallpdf, Adobe Acrobat Web e qualquer outro.

---

## Norte do Produto

O objetivo é resolver qualquer tarefa com documentos em segundos, sem fricção, sem cadastro e com inteligência embutida.

Princípios:
- Velocidade percebida acima de tudo.
- Ferramentas reais, não páginas promocionais.
- Privacidade como diferencial real (processamento local quando possível, limpeza automática).
- Interface consistente: o usuário aprende um padrão e domina todas as ferramentas.
- Inteligência proativa: detectar tipo de documento, sugerir ações, prever necessidades.
- Sem dependência forçada de OCR — usar texto nativo sempre que existir.
- Resultado profissional com métricas claras do que foi feito.

---

## Posicionamento Contra Concorrentes

### Onde somos melhores

- **Menos cliques**: 2-3 cliques do upload ao download.
- **Mais leve**: sem banners, sem scripts de marketing, sem UI inflada.
- **Mais controle**: preview real, seleção de páginas, edição granular.
- **Mais inteligente**: detecção automática de tipo, texto, OCR, formulários, problemas.
- **Mais transparente**: relatório claro do que mudou (tamanho, páginas, qualidade).
- **Mais fluxos**: combinar operações sem baixar/reupar.
- **Editor completo**: editar texto, formulários, assinar, anotar — tudo integrado.

### Onde vamos além

- **Correção de documentos**: reparar PDFs corrompidos, recuperar conteúdo.
- **Busca entre documentos**: pesquisar termos em múltiplos PDFs simultaneamente.
- **Comparação inteligente**: diff visual e textual entre versões de documentos.
- **Classificação automática**: detectar contrato, nota fiscal, currículo, identidade.
- **Renomeação inteligente**: extrair dados do conteúdo e renomear arquivos em lote.
- **Templates produtivos**: criar documentos a partir de modelos predefinidos.
- **Correção de perspectiva**: transformar fotos de documentos em PDFs limpos.
- **Kit financeiro**: extrair dados de boletos, notas fiscais, extratos e recibos.
- **Kit jurídico**: cláusulas, prazos, partes, petições e protocolos.
- **Kit acadêmico**: citações ABNT/APA, flashcards, fichamentos e TCC.
- **Kit gráfico**: imposição, sangria, CMYK, preflight e marcas de corte.
- **Kit dev**: Base64, hash, regex, UUID, JSON, CSV, diff, encode/decode.
- **Auditoria forense**: detectar adulterações, verificar assinaturas, analisar metadados.
- **Acessibilidade real**: PDF/UA, WCAG 2.1, simulação de leitor de tela, daltonismo.
- **CLI e API**: linha de comando, REST documentada, webhooks e watch folders.
- **Formatos de nicho**: DjVu, CBR/CBZ, LaTeX, PostScript, XPS, EML, ODF, EPUB.

---

## Análise Kaizen — Viabilidade e Execução

*Kaizen: melhoria contínua. Cada feature é avaliada por esforço, impacto e viabilidade com a stack atual.*

### Legenda

| Símbolo | Significado |
|---------|-------------|
| ⚡ | Quick win — < 1 dia de trabalho, alto impacto |
| ✅ | Viável — stack atual suporta, esforço médio |
| 🔧 | Viável — requer nova dependência leve (pip install) |
| 🏗️ | Complexo — requer nova dependência pesada ou infra |
| ⚠️ | Arriscado — viabilidade técnica incerta ou escopo grande |
| ❌ | Inviável — não faz sentido na stack atual, remover ou adiar indefinidamente |

### Dependências por Fase

| Fase | Dependências novas necessárias | Esforço | Viab. |
|------|-------------------------------|---------|-------|
| **F1 — Conversões** | `weasyprint` (HTML→PDF), `python-pptx` (PPT), `markdown` | 2-3 semanas | 🔧 |
| **F2 — Organizador Visual** | Nenhuma (frontend + endpoints existentes) | 2 semanas | ⚡ |
| **F3 — Mesclar/Dividir 2.0** | Nenhuma (extensão do existente) | 1-2 semanas | ⚡ |
| **F4 — PDF para Excel** | Nenhuma (já existe, só migrar) | 3-4 dias | ⚡ |
| **F5 — Anotações** | Nenhuma (PyMuPDF já suporta annotations) | 2 semanas | ✅ |
| **F6 — Assinatura** | Nenhuma (completa editor existente) | 1-2 semanas | ✅ |
| **F7 — Form Builder** | Nenhuma (PyMuPDF AcroForm) | 2-3 semanas | ✅ |
| **F8 — Scanner Documentos** | `opencv-python` (perspectiva) | 2 semanas | 🔧 |
| **F9 — Comparar PDFs** | `diff-match-patch` (texto), PIL (visual) | 1-2 semanas | ✅ |
| **F10 — Segurança/Redação** | PyMuPDF `redact_annot` já embutido | 1-2 semanas | ✅ |
| **F11 — Extrair Conteúdo** | PyMuPDF extrai imagens/anexos nativamente | 1 semana | ⚡ |
| **F12 — OCR Inteligente** | PaddleOCR já está instalado | 1-2 semanas | ✅ |
| **F13 — Imagem Avançada** | `rembg` (remover fundo), `opencv-python` | 2 semanas | 🔧 |
| **F14 — Fiscal NF-e** | `qrcode`, `barcode` (DANFE). Lógica já existe | 2-3 semanas | 🔧 |
| **F15 — Bookmarks** | PyMuPDF já manipula bookmarks | 3-4 dias | ⚡ |
| **F16 — PDF/A** | `pikepdf` + verificação customizada | 1-2 semanas | ✅ |
| **F17 — Reparo PDF** | PyMuPDF open+save já resolve muitos casos | 3-4 dias | ⚡ |
| **F18 — Busca entre Docs** | Nenhuma (text extraction + search) | 1 semana | ✅ |
| **F19 — Templates** | Nenhuma (frontend localStorage + backend) | 2 semanas | ✅ |
| **F20 — Experiência Produto** | Nenhuma (puro frontend) | 3-4 semanas | ✅ |
| **F21 — Colaboração** | WebSocket + auth + state sync | 6-8 semanas | 🏗️ |
| **F22 — Acessibilidade** | Nenhuma (frontend + análise PyMuPDF) | 2-3 semanas | ✅ |
| **F23 — Formatos Especiais** | `ebooklib` (EPUB), `CBR/CBZ` = ZIP | 2-3 semanas | 🔧 |
| **F24 — IA** | `transformers` ou API externa paga | 4-8 semanas | 🏗️ |
| **F25 — Docs Financeiros** | Lógica de parsing + regex. OCR já existe | 3-4 semanas | ✅ |
| **F26 — Docs Identidade** | OCR + regex + validação de campos | 2-3 semanas | ✅ |
| **F27 — Jurídico** | Regex + NLP simples. Templates em texto | 2-3 semanas | ✅ |
| **F28 — Acadêmico** | `python-docx` (já instalado). Lógica de parsing | 2-3 semanas | ✅ |
| **F29 — Pré-impressão** | PyMuPDF manipula page boxes + PIL | 2-3 semanas | ✅ |
| **F30 — E-books** | `ebooklib` (EPUB), ZIP (CBR/CBZ) | 2-3 semanas | 🔧 |
| **F31 — Dados Estruturados** | Nenhuma (pandas, json, csv são built-in) | 1-2 semanas | ⚡ |
| **F32 — Gráficos/Diagramas** | `qrcode`, `python-barcode`, matplotlib | 2 semanas | 🔧 |
| **F33 — Mídia (áudio/vídeo)** | `whisper` (GPU), `moviepy`, `ffmpeg` | 4-6 semanas | ⚠️ |
| **F34 — Utilidades Dev** | Nenhuma (hashlib, base64, json, re — tudo Python) | 3-4 dias | ⚡ |
| **F35 — Arquivos/Compressão** | Nenhuma (zipfile, tarfile built-in) | 3-4 dias | ⚡ |
| **F36 — Vetorial/Design** | `cairosvg` (SVG→PDF), `svglib` | 2 semanas | 🔧 |
| **F37 — Office (PPT etc.)** | `python-pptx` | 2-3 semanas | 🔧 |
| **F38 — Forense** | ELA = PIL math. Metadados = PyMuPDF. Assinatura = cryptography | 2-3 semanas | ✅ |
| **F39 — Colaboração** | WebSocket, auth, state sync, link efêmero | 6-8 semanas | 🏗️ |
| **F40 — API/CLI/Integrações** | `typer` (CLI), `watchdog`, OpenAPI auto | 2-3 semanas | 🔧 |
| **F41 — Formatos Nicho** | `djvulibre`, `pylatex`, ZIP (CBR/CBZ) | 3-4 semanas | 🔧 |
| **F42 — Acessibilidade** | Nenhuma (análise + frontend) | 2-3 semanas | ✅ |
| **F43 — IA** | `transformers` / `llama-cpp-python` / API paga | 4-8 semanas | 🏗️ |
| **F44 — Templates** | Nenhuma (documentos txt/md predefinidos) | 1-2 semanas | ⚡ |

### Funcionalidades que devem ser REMOVIDAS ou adiadas indefinidamente

| Feature | Motivo |
|---------|--------|
| Vídeo para PDF (F33) | Domínio completamente diferente. App de PDF não é app de vídeo. Manter só se usuários pedirem. |
| PDF para vídeo/slideshow (F33) | Mesmo motivo. Não é o core do produto. |
| GIF ↔ PDF (F33) | Nicho extremo. Só implementar se houver demanda real. |
| Sala de revisão multiusuário (F39) | Requer WebSocket, auth, presença online — infraestrutura que não temos. Talvez P5. |
| Compartilhamento com link (F39) | Requer servidor público, expiração, storage. Muda arquitetura de "processa e esquece". |
| E-mail para PDF gateway (F40) | Precisa servidor de e-mail. Fora do escopo. |
| Notificação por e-mail (F39) | Precisa SMTP ou serviço externo. Feature, não ferramenta. |

### Funcionalidades SURPREENDENTEMENTE FÁCEIS — Quick Wins

Features que levam ≤ 3 dias cada e têm alto impacto percebido:

| # | Feature | Backend | Frontend | Dias |
|---|---------|---------|----------|------|
| 1 | **PDF para PNG** | Copiar endpoint JPG, mudar formato | Copiar página JPG | 0.5 |
| 2 | **PDF para WebP** | Copiar endpoint JPG, mudar formato | Copiar página JPG | 0.5 |
| 3 | **Gerador de QR Code** | `qrcode` + PIL → PNG/PDF | Form + preview + download | 1 |
| 4 | **Gerador de senha** | Zero backend | Sliders + botão copiar | 0.5 |
| 5 | **Base64 encode/decode** | Python built-in | Textarea + toggle | 0.5 |
| 6 | **Gerador de hash** | hashlib built-in | Input + select + output | 0.5 |
| 7 | **Formatador JSON** | json.dumps/loads built-in | Editor + preview | 0.5 |
| 8 | **CSV ↔ JSON** | pandas built-in | Upload + preview tabela | 1 |
| 9 | **Contador de caracteres** | Zero backend | Textarea + stats em tempo real | 0.5 |
| 10 | **Lorem Ipsum** | lorem_text built-in | Sliders + botão copiar | 0.5 |
| 11 | **Reparo de PDF** | PyMuPDF open + save + cleanup | Upload + download | 0.5 |
| 12 | **Renomear arquivos (frontend)** | Zero backend | Lista + regex + preview | 1 |
| 13 | **Criar bookmarks** | PyMuPDF set_toc() | Input hierárquico | 0.5 |
| 14 | **Extrair imagens do PDF** | PyMuPDF get_images() | ZIP download | 0.5 |
| 15 | **Markdown para PDF** | markdown + weasyprint/reportlab | Editor + preview | 1 |
| 16 | **Gerador de UUID** | uuid built-in | Select versão + quantidade | 0.5 |
| 17 | **Codificador URL** | urllib built-in | Textarea + toggle | 0.5 |
| 18 | **Testador de regex** | re built-in | Input regex + texto + highlights | 1 |
| 19 | **Diff de texto** | difflib built-in | Dois textareas + diff lado a lado | 1 |
| 20 | **Simulador de daltonismo** | PIL color matrix | Upload imagem + 4 modos preview | 1 |

### Ordem de Execução Sugerida (Onda Kaizen)

Ao invés de 44 fases sequenciais, agrupar em ondas de valor:

**Onda 1 — Consolidação (4 semanas, P0)**
F4 (PDF→Excel modular) → F1 parcial (PNG, WebP) → F2 (Organizador) → F3 parcial (drag/drop merge) → F11 (extrair imagens)

**Onda 2 — Quick Wins (2 semanas, impacto máximo)**
20 quick wins da tabela acima — priorizando QR Code, Base64, hash, JSON, markdown, lorem, UUID, diff

**Onda 3 — Editor Profissional (4 semanas, P1)**
F5 (anotações) → F6 (assinatura) → F7 (form builder) → F10 (redação)

**Onda 4 — Conversões (3 semanas, P1)**
F1 completo → F31 (dados) → F34 (dev utils) → F35 (arquivos) → F32 parcial (QR/barcode)

**Onda 5 — Scanner & OCR (3 semanas, P1/P2)**
F8 (scanner) → F12 (OCR inteligente) → F26 (docs identidade)

**Onda 6 — Domínio Vertical (4 semanas, P2)**
F14 (fiscal) → F25 (financeiro) → F27 (jurídico) → F28 (acadêmico) → F44 (templates)

**Onda 7 — Profissional (4 semanas, P2)**
F9 (comparar) → F15 (bookmarks) → F16 (PDF/A) → F17 (reparo) → F18 (busca) → F29 (pré-impressão)

**Onda 8 — Ecossistema (4 semanas, P2)**
F13 (imagem avançada) → F19 (templates) → F20 (experiência produto) → F32 (gráficos) → F40 (CLI/API)

**Onda 9 — Nicho & Premium (6 semanas, P3)**
F22 (acessibilidade) → F23 (formatos especiais) → F30 (e-books) → F36 (vetorial) → F37 (office) → F38 (forense)

**Onda 10 — Futuro (P4+, indefinido)**
F21 (colaboração) → F24 (IA) → F33 (mídia) → F39 (collab avançado) → F41 (formatos raros) → F42 (acessibilidade total) → F43 (IA avançada)

---

## Stack

### Stack atual

- Frontend: Next.js App Router, React 19, TypeScript 5, Tailwind CSS 4
- Backend: FastAPI (Python 3.10+)
- PDF: PyMuPDF (fitz), pypdf, pikepdf
- Imagem: Pillow (PIL)
- OCR: PaddleOCR (local, sem nuvem)
- Dados: pdfplumber, pandas, openpyxl
- Documentos: python-docx, docx2pdf

### Dependências planejadas

| Biblioteca | Para | Ondas |
|-----------|------|-------|
| `qrcode` + `pillow` | QR Code generator | Onda 2 |
| `python-barcode` | Código de barras (EAN, Code 128) | Onda 4 |
| `weasyprint` | HTML/URL → PDF | Onda 4 |
| `markdown` | Markdown → HTML/PDF | Onda 2 |
| `opencv-python` | Scanner (perspectiva, contraste) | Onda 5 |
| `rembg` | Remover fundo de imagem (local) | Onda 8 |
| `cairosvg` ou `svglib` | SVG → PDF | Onda 9 |
| `ebooklib` | EPUB read/write | Onda 6/9 |
| `python-pptx` | PowerPoint ↔ PDF | Onda 9 |
| `typer` | CLI (command line) | Onda 8 |
| `watchdog` | Watch folder (auto-process) | Onda 8 |
| `diff-match-patch` | Diff de texto preciso | Onda 7 |
| `transformers` / `llama-cpp-python` | IA local (classificar, sumarizar) | Onda 10 |

### NÃO adicionar (justificativa)

| Biblioteca | Por que não |
|-----------|-------------|
| `ffmpeg` / `moviepy` | Processamento de vídeo — fora do escopo |
| `whisper` (OpenAI) | Transcrição áudio — pesado (GPU), nicho |
| `gTTS` / `pyttsx3` | Text-to-speech — fora do core |
| Serviços de nuvem (AWS S3, etc.) | O produto é local-first por princípio |
| Bancos de dados (Postgres, Redis, etc.) | Sem estado — processa e esquece |

---

## O QUE JÁ TEMOS (36 ferramentas)

### PDF (16 ferramentas)
- [x] Comprimir PDF
- [x] Mesclar PDFs
- [x] Dividir PDF
- [x] Reordenar páginas
- [x] Girar páginas
- [x] Extrair páginas
- [x] Remover páginas
- [x] Cortar PDF
- [x] Proteger com senha
- [x] Remover senha
- [x] Marca d'água
- [x] Numerar páginas
- [x] Metadados (ler/editar)
- [x] PDF para JPG
- [x] PDF para Excel
- [x] PDF para Word

### Imagem (5 ferramentas)
- [x] Comprimir imagem
- [x] Converter imagem (JPG/PNG/WebP)
- [x] Redimensionar imagem
- [x] Imagem para PDF (multipágina + layout)
- [x] Imagem para texto (OCR)

### Editor PDF (integrado)
- [x] Adicionar texto com fonte/cor/tamanho
- [x] Substituir texto nativo existente
- [x] Campos de formulário (texto, checkbox, radio, dropdown, assinatura)
- [x] Mover e redimensionar elementos
- [x] Undo/redo (50 passos)
- [x] Copiar/duplicar (Ctrl+D)
- [x] Snap/align guides
- [x] Zoom e navegação de páginas
- [x] Inspector de propriedades por elemento
- [x] Detecção de camada textual para edição

### OCR (2 ferramentas)
- [x] OCR PDF (PaddleOCR local)
- [x] Imagem para texto (OCR)

### Conversão (3 ferramentas)
- [x] PDF para Word
- [x] Word para PDF
- [x] Editor PDF (cria/edita formulários)

### XML / Fiscal (3 ferramentas)
- [x] Visualizar XML NF-e
- [x] Validar XML
- [x] XML para Excel

### Infraestrutura
- [x] Backend modular (app.py + routes/ + services/ + core/)
- [x] Erros JSON padronizados (code, message, details)
- [x] Headers X-* de métricas em todas as respostas
- [x] Limpeza automática de temporários
- [x] CORS configurado
- [x] Componentes reutilizáveis (ToolShell, UploadPanel, PagePicker, etc.)
- [x] Tema claro/escuro
- [x] ToolChainProvider para encadear ferramentas
- [x] Drag & drop para reordenar imagens

---

## ROADMAP DE NOVAS FERRAMENTAS

### FASE 1 — Conversões completas (P0)
*Converter entre todos os formatos comuns sem surpresas.*

- [ ] **PDF para PNG** — exportar páginas como PNG com fundo transparente opcional
- [ ] **PDF para WebP** — exportar páginas como WebP (menor que JPG, mesma qualidade)
- [ ] **PDF para TXT** — extrair texto puro, com opção de preservar layout
- [ ] **PDF para HTML** — converter mantendo estrutura básica
- [ ] **Excel para PDF** — planilha convertida com formatação preservada
- [ ] **HTML/URL para PDF** — capturar páginas web como PDF
- [ ] **Markdown para PDF** — converter .md com estilo limpo e profissional
- [ ] **PowerPoint para PDF** — converter .pptx preservando slides
- [ ] **PDF para PowerPoint** — exportar páginas como slides editáveis
- [ ] **HEIC/TIFF para PDF ou JPG** — suporte a formatos de câmera e scanner
- [ ] **Conversor universal** — soltar qualquer arquivo e o sistema detecta o tipo e sugere destinos

### FASE 2 — Organizador Visual de Páginas (P0)
*Substitui reordenar, girar, remover, extrair e duplicar com uma única interface de grade.*

- [ ] Grid de miniaturas com scroll virtualizado
- [ ] Seleção múltipla (Shift+Click, Ctrl+Click, arrastar seleção)
- [ ] Drag & drop para reordenar entre PDFs diferentes
- [ ] Botões rápidos: girar, remover, duplicar, extrair
- [ ] Inserir página em branco
- [ ] Importar páginas de outro PDF
- [ ] Preview ampliado ao hover
- [ ] Atalhos de teclado (Delete, Ctrl+D, Ctrl+Z)
- [ ] Exportar seleção ou documento inteiro

### FASE 3 — Mesclar & Dividir 2.0 (P0)
*Experiência profissional que falta nos concorrentes.*

**Mesclar PDF 2.0:**
- [ ] Drag & drop para ordenar arquivos (visual + miniaturas)
- [ ] Selecionar páginas específicas de cada PDF antes de mesclar
- [ ] Remover páginas individuais na prévia
- [ ] Gerar bookmarks automáticos por arquivo de origem
- [ ] Inserir páginas em branco entre documentos
- [ ] Preservar metadados quando possível
- [ ] Estimativa de tamanho do PDF final

**Dividir PDF 2.0:**
- [ ] Dividir todas as páginas (1 PDF por página)
- [ ] Dividir por intervalo fixo (ex: a cada 2 páginas)
- [ ] Dividir por intervalos customizados (1-3, 4, 5-10)
- [ ] Extrair páginas selecionadas
- [ ] Dividir por tamanho aproximado (útil para e-mail)
- [ ] Dividir por bookmarks/marcadores
- [ ] Separar páginas pares/ímpares
- [ ] Preview das divisões antes de processar

### FASE 4 — PDF para Excel robusto (P0)
*Corrigir o endpoint órfão e tornar a extração de tabelas realmente boa.*

- [ ] Migrar `/pdf-to-excel` do `main.py` para `routes/pdf.py` + `pdf_service.py`
- [ ] Detectar múltiplas tabelas por página
- [ ] Preview da tabela antes do download
- [ ] Corrigir colunas manualmente (editar nomes, remover, reordenar)
- [ ] Exportar abas separadas por página/tabela
- [ ] Formatar números, datas e valores automaticamente

### FASE 5 — Anotações e Revisão (P1)
*Transformar o editor em ferramenta completa de revisão.*

- [ ] Comentário adesivo (sticky note) com autor e data
- [ ] Destaque de texto (highlight) com cores
- [ ] Sublinhado e tachado
- [ ] Desenho livre (caneta, marca-texto)
- [ ] Formas: retângulo, círculo, linha, seta
- [ ] Carimbos: Aprovado, Confidencial, Rascunho, Pago, Revisado
- [ ] Caixa de texto com seta (callout)
- [ ] Lista de todas as anotações por página
- [ ] Exportar com anotações editáveis ou achatadas

### FASE 6 — Assinatura e Rubrica (P1)
*Completar o fluxo de assinatura que o editor já iniciou.*

- [ ] Desenhar assinatura com mouse/touch
- [ ] Digitar assinatura com fontes manuscritas
- [ ] Enviar imagem de assinatura (PNG com transparência)
- [ ] Rubricar todas as páginas ou selecionadas
- [ ] Inserir data, nome e cargo
- [ ] Salvar assinaturas no navegador (localStorage, nunca no servidor)
- [ ] Carimbo de data/hora automático

### FASE 7 — Form Builder (P1)
*Criar formulários PDF profissionais sem Adobe Acrobat.*

- [ ] Modo "criar formulário" dedicado
- [ ] Campos com nome, placeholder, obrigatório, valor padrão
- [ ] Ordem de tabulação configurável
- [ ] Grade de alinhamento e distribuição de campos
- [ ] Duplicar campo em múltiplas páginas
- [ ] Importar dados de formulário (JSON/CSV)
- [ ] Exportar dados preenchidos (JSON/CSV)
- [ ] Preencher formulário existente via upload de dados
- [ ] Achatar formulário (flatten) para versão final

### FASE 8 — Scanner de Documentos (P1)
*Transformar fotos ruins em documentos limpos.*

- [ ] Detectar bordas do documento automaticamente
- [ ] Corrigir perspectiva (endireitar)
- [ ] Recorte manual com ajuste de cantos
- [ ] Ajustar brilho e contraste
- [ ] Remover sombras leves
- [ ] Modo黑白 (preto e branco) para documentos
- [ ] Modo cor para fotos e identidade
- [ ] Gerar PDF multipágina a partir de múltiplas fotos
- [ ] Presets: recibo, contrato, documento de identidade, nota fiscal

### FASE 9 — Comparar PDFs (P1)
*Diferencial forte para contratos, propostas e versões.*

- [ ] Comparar dois PDFs página a página
- [ ] Diff textual: inserções, remoções e alterações destacadas
- [ ] Diff visual: sobreposição com transparência
- [ ] Navegação lado a lado sincronizada
- [ ] Resumo de diferenças por página
- [ ] Exportar PDF comparativo com destaques
- [ ] Ignorar espaços em branco e formatação (opcional)

### FASE 10 — Segurança e Anonimização (P1)
*Ir além de proteger com senha — limpar documentos sensíveis.*

- [ ] Redigir área manualmente (remoção real, não só retângulo preto)
- [ ] Buscar e redigir termos específicos
- [ ] Redigir automaticamente: CPF, CNPJ, e-mail, telefone, CEP
- [ ] Remover metadados sensíveis (autor, título, GPS, histórico)
- [ ] Remover comentários e anotações
- [ ] Remover anexos embutidos
- [ ] Remover JavaScript
- [ ] Remover links externos
- [ ] Verificar permissões do PDF
- [ ] Sanitização completa (um clique)
- [ ] Relatório do que foi removido

### FASE 11 — Extração de Conteúdo (P2)
*Extrair tudo que está dentro do PDF.*

- [ ] Extrair todas as imagens (ZIP com JPG/PNG originais)
- [ ] Extrair anexos embutidos
- [ ] Listar imagens por página com preview
- [ ] Extrair páginas que contêm palavra-chave
- [ ] Extrair texto com coordenadas (JSON)
- [ ] Detectar e extrair endereços de e-mail, URLs e telefones

### FASE 12 — OCR Inteligente (P2)
*Lidar bem com PDFs escaneados e melhorar a qualidade.*

- [ ] Detectar automaticamente se PDF precisa de OCR
- [ ] Badge "PDF escaneado" com sugestão de ação
- [ ] OCR por página selecionada (não só documento inteiro)
- [ ] Criar camada de texto pesquisável sem alterar aparência
- [ ] Mostrar confiança do OCR por trecho (cores: verde, amarelo, vermelho)
- [ ] Permitir corrigir texto detectado antes de aplicar
- [ ] OCR em lote (múltiplos PDFs escaneados)
- [ ] Melhorar imagem antes do OCR (contraste, nitidez, binário)

### FASE 13 — Ferramentas de Imagem Avançadas (P2)
*Aproveitar a base de imagem existente e expandir.*

- [ ] Remover fundo de imagem (local com rembg, com opção de cor substituta)
- [ ] Cortar imagem com preview interativo
- [ ] Marca d'água em imagem (texto ou logo)
- [ ] Processamento em lote: redimensionar + converter + marca d'água
- [ ] Converter lote para WebP otimizado
- [ ] Endireitar foto de documento
- [ ] Ajustar brilho, contraste, saturação
- [ ] Girar e espelhar imagem
- [ ] Renomear arquivos em lote com padrão configurável

### FASE 14 — Fiscal e NF-e Completo (P2)
*Central completa para documentos fiscais.*

- [ ] Gerar DANFE em PDF a partir de XML NF-e
- [ ] DANFE em lote (ZIP de DANFEs)
- [ ] Lote de XMLs para Excel com abas: notas, itens, impostos, pagamentos, transporte
- [ ] Detectar XMLs duplicados por chave de acesso
- [ ] Separar por emitente, destinatário, mês e CFOP
- [ ] Resumo de totais por período (valor, imposto, produtos)
- [ ] Apontar XMLs inválidos sem interromper lote
- [ ] Relatório de arquivos processados e rejeitados
- [ ] Comparar XMLs (diferenças entre duas NFs)
- [ ] Extrair chave de acesso e QR code

### FASE 15 — Bookmarks e Navegação (P2)
*Dar estrutura a documentos longos.*

- [ ] Criar bookmarks manualmente
- [ ] Gerar bookmarks automáticos por títulos detectados
- [ ] Editar e remover bookmarks existentes
- [ ] Criar índice clicável automático
- [ ] Exportar estrutura de bookmarks em JSON
- [ ] Importar bookmarks de arquivo JSON

### FASE 16 — PDF/A e Arquivamento (P2)
*Para documentos que precisam durar décadas.*

- [ ] Validar conformidade PDF/A
- [ ] Converter para PDF/A (PDF/A-1b, PDF/A-2b, PDF/A-3b)
- [ ] Embutir fontes automaticamente
- [ ] Relatório de conformidade
- [ ] Verificar e corrigir problemas comuns (transparência, cores, fontes)

### FASE 17 — Reparo e Diagnóstico (P2)
*Recuperar PDFs quebrados — ninguém faz isso bem.*

- [ ] Reparar PDF corrompido (recuperar máximo de conteúdo possível)
- [ ] Analisar estrutura interna do PDF (objetos, streams, xref)
- [ ] Remover objetos órfãos e streams não referenciados
- [ ] Otimizar estrutura para reduzir tamanho sem recompressão
- [ ] Relatório de saúde do PDF (problemas encontrados e corrigidos)
- [ ] Extrair texto de PDF danificado (fallback agressivo)

### FASE 18 — Busca entre Documentos (P2)
*Encontrar informação em múltiplos PDFs de uma vez.*

- [ ] Upload de múltiplos PDFs
- [ ] Buscar termo ou regex em todos simultaneamente
- [ ] Resultados com página, contexto e destaque
- [ ] Navegar entre ocorrências
- [ ] Exportar páginas que contêm o termo
- [ ] Buscar CPF, CNPJ, e-mails, telefones e valores em lote

### FASE 19 — Templates e Automação (P2)
*Produtividade com modelos salvos localmente.*

- [ ] Templates de documentos: carta, ofício, contrato, recibo, declaração
- [ ] Preencher template com dados via formulário
- [ ] Salvar templates no navegador (localStorage)
- [ ] Presets de ferramentas: "Enviar por e-mail" (comprimir + reduzir), "Para impressão" (mesclar + numerar)
- [ ] Pipeline customizado: escolher sequência de operações e aplicar em lote
- [ ] Repetir última configuração com um clique

### FASE 20 — Experiência de Produto (P2)
*A camada que faz o usuário sentir que está usando algo de outra geração.*

- [ ] **Command Center** (Ctrl+K): busca por ferramenta, arquivo recente e intenção em linguagem natural
- [ ] **Detector universal**: soltar qualquer arquivo e o sistema sugere ações
- [ ] **Histórico local**: últimas operações com configurações (sem guardar arquivos)
- [ ] **Workspace local**: bandeja de arquivos arrastáveis entre ferramentas
- [ ] **Badges inteligentes**: "texto editável", "OCR recomendado", "formulário detectado", "protegido"
- [ ] **Empty states úteis**: toda tela explica o que faz, limites e privacidade
- [ ] **Resultados com próximas ações**: sugestões contextuais pós-download (máx. 3)
- [ ] **Modo escuro/claro polido** em todas as páginas
- [ ] **Atalhos de teclado globais** documentados

### FASE 21 — Colaboração e Revisão (P3)
*Para times que revisam documentos juntos.*

- [ ] Modo de revisão com comentários vinculados a trechos
- [ ] Exportar sumário de revisão (quem comentou o quê)
- [ ] Comparar versões de um documento com diff visual
- [ ] Marcar comentários como resolvidos
- [ ] Adicionar carimbo de revisor

### FASE 22 — Acessibilidade (P3)
*Garantir que documentos funcionem para todos.*

- [ ] Verificador de acessibilidade do PDF
- [ ] Adicionar tags de acessibilidade (H1-H6, P, Figure, Table)
- [ ] Verificar contraste de texto
- [ ] Adicionar texto alternativo em imagens
- [ ] Definir idioma do documento
- [ ] Definir ordem de leitura

### FASE 23 — Formatos Especiais (P3)
*Suporte a formatos que concorrentes ignoram.*

- [ ] EPUB para PDF e vice-versa
- [ ] E-mail .eml/.msg para PDF
- [ ] Capturar página web com scroll infinito
- [ ] PDF para MP3/text-to-speech (leitura em voz)
- [ ] QR Code / Barcode: gerar e ler de documentos
- [ ] Extrair dados de código de barras de boletos

### FASE 24 — IA e Automação Inteligente (P3)
*Quando houver maturidade técnica para integrar IA local ou remota opcional.*

- [ ] Classificar tipo de documento automaticamente
- [ ] Resumir documento longo em 1 parágrafo
- [ ] Extrair dados estruturados de faturas e recibos
- [ ] Traduzir documento preservando layout
- [ ] Sugerir tags e categorias para organização
- [ ] Chat com documento (perguntas e respostas sobre o conteúdo)
- [ ] Gerar resumo executivo de contrato

---

## Arquitetura — Pendências Técnicas

### Backend
- [ ] Migrar `/pdf-to-excel` do `main.py` para `routes/pdf.py` + `pdf_service.py`
- [ ] Remover `main.py` legado e usar apenas `app.py` modular
- [ ] Criar `pdf_to_excel_service()` no service layer
- [ ] Testes de API com fixtures pequenas
- [ ] Limite de upload por ferramenta (documentado)
- [ ] Rate limiting básico
- [ ] Logs sem conteúdo sensível (sanitizar mensagens de erro)

### Frontend
- [ ] Home 2.0 com busca global e categorias compactas
- [ ] Command Center (Ctrl+K) funcional
- [ ] Drag & drop para upload em todas as ferramentas
- [ ] Virtualização de miniaturas para PDFs grandes (já feito no editor, expandir)
- [ ] Lazy-load de PDF.js apenas nas ferramentas que usam
- [ ] Bundle analysis e code splitting por rota
- [ ] PWA com cache de assets e ferramentas offline

---

## Priorização Consolidada

### P0 — Obrigatório para MVP 10x
1. PDF para PNG
2. PDF para WebP
3. Excel para PDF
4. HTML/URL para PDF
5. Markdown para PDF
6. Organizador visual de páginas (grade de miniaturas)
7. Migrar /pdf-to-excel para arquitetura modular
8. Drag & drop no mesclar PDF
9. Home 2.0 com Command Center

### P1 — Diferenciais fortes
1. Mesclar & Dividir 2.0
2. Conversor universal (detectar e sugerir)
3. Anotações e revisão
4. Assinatura visual completa
5. Form builder
6. Scanner de documentos
7. Comparar PDFs
8. Segurança e anonimização
9. Extração de conteúdo (imagens, anexos, texto)

### P2 — Expansão de plataforma
1. OCR inteligente
2. Imagem avançada (remover fundo, cortar, lote)
3. Fiscal completo (DANFE, lote, duplicatas)
4. Bookmarks e índice
5. PDF/A e arquivamento
6. Reparo e diagnóstico de PDF
7. Busca entre documentos
8. Templates e automação
9. Experiência de produto (Command Center, histórico, workspace)
10. Documentos financeiros (NF-e, boletos, extratos, recibos)
11. Documentos de identidade (RG, CNH, passaporte, certidões)
12. Ferramentas jurídicas (cláusulas, prazos, contratos)
13. Ferramentas acadêmicas (citações, flashcards, ABNT)
14. Publicação e pré-impressão (imposição, sangria, CMYK)
15. E-books e publicação digital (EPUB, MOBI, flipbook)
16. Dados estruturados (CSV, JSON, SQLite)
17. Gráficos, diagramas e visualização (Mermaid, QR, barcode)
18. Conversão de mídia (áudio, vídeo, TTS)
19. Utilidades para desenvolvedores (hash, regex, Base64, UUID)
20. Arquivos e compressão (ZIP, 7z, renomear lote, duplicados)

### P3 — Cobertura completa e inovação
1. Colaboração e revisão
2. Acessibilidade universal (PDF/UA, WCAG, leitores de tela)
3. Formatos especiais (EPUB, DjVu, CBR/CBZ, LaTeX, PS, XPS, EML)
4. IA e automação inteligente (classificar, resumir, traduzir, chat)
5. PowerPoint para/from PDF
6. Vetorial e design (SVG, vetorização, paletas)
7. Planilhas e apresentações (Google Sheets, Numbers, ODF)
8. Forense de documentos (adulteração, metadados, autenticidade)
9. API, CLI e integrações (Zapier, webhooks, watch folder)
10. Templates de documentos (contratos, declarações, procurações)
11. PWA com ferramentas offline
12. Catálogo filtrável de ferramentas

### FASE 25 — Documentos Financeiros (P2)
*Extrair, processar e organizar dados de documentos financeiros — ninguém faz isso integrado num toolkit de PDF.*

- [ ] **Extrator de notas fiscais**: detectar e extrair campos de NF-e (chave, valor, emitente, itens)
- [ ] **Extrator de boletos**: ler código de barras, valor, vencimento, cedente
- [ ] **Extrator de faturas/recibos**: valor, data, estabelecimento, itens, forma de pagamento
- [ ] **Extrator de extratos bancários**: converter PDF de extrato para CSV/Excel
- [ ] **Extrator de comprovantes**: PIX, TED, DOC — dados estruturados
- [ ] **Extrator de contracheque**: salário, descontos, benefícios, mês de referência
- [ ] **Conferência de totais**: comparar soma de notas com total declarado
- [ ] **Consolidado mensal/anual**: agrupar documentos financeiros por período
- [ ] **Dashboard de despesas**: gráficos de categoria, emitente e timeline a partir dos PDFs
- [ ] **Exportar para software contábil**: CSV/JSON compatível com domínio fiscal

### FASE 26 — Documentos de Identidade e Pessoais (P2)
*Digitalizar, extrair e validar documentos de identificação.*

- [ ] **Scanner de RG/CNH**: extrair nome, CPF, data nascimento, filiação, nº documento
- [ ] **Scanner de passaporte**: ler MRZ (Machine Readable Zone), foto, validade
- [ ] **Scanner de CPF/CNPJ**: extrair dados do cartão/comprovante
- [ ] **Scanner de comprovante de residência**: extrair endereço, data, emissor
- [ ] **Scanner de certidão**: nascimento, casamento, óbito — dados estruturados
- [ ] **Validação cruzada**: comparar dados entre documentos (ex: RG vs CPF)
- [ ] **Máscara automática**: ao compartilhar, ocultar dados sensíveis (CPF parcial, etc.)
- [ ] **Gerar selfie com documento**: sobrepor documento na foto para prova de vida (útil para cadastros)

### FASE 27 — Ferramentas Jurídicas (P2)
*Foco em advogados, departamentos jurídicos e contratos.*

- [ ] **Extrator de cláusulas**: buscar cláusulas específicas em contratos (rescisão, confidencialidade, multa, foro)
- [ ] **Extrator de partes**: identificar contratante, contratada, testemunhas automaticamente
- [ ] **Extrator de prazos e datas**: vigência, renovação, vencimento, carência
- [ ] **Extrator de valores**: preço, multa, indenização, parcela — consolidado
- [ ] **Gerador de contrato simples**: template + dados preenchidos = PDF pronto
- [ ] **Gerador de procuração**: preencher modelo com dados das partes
- [ ] **Gerador de declaração**: templates de declaração de residência, união estável, etc.
- [ ] **Petição inicial assistida**: extrair dados de documentos anexos para preencher petição
- [ ] **Protocolo de documentos**: numerar, carimbar e organizar para protocolo judicial
- [ ] **Índice de processo**: gerar índice de documentos com numeração automática
- [ ] **Capa de processo**: gerar capa padronizada com dados do processo

### FASE 28 — Ferramentas Acadêmicas e de Pesquisa (P2)
*Para estudantes, pesquisadores e professores.*

- [ ] **Extrator de citações**: identificar referências bibliográficas no texto
- [ ] **Formatador de bibliografia**: converter referências para ABNT, APA, MLA, Vancouver
- [ ] **Gerador de fichamento**: resumir artigo/paper com campos: objetivo, método, resultado, conclusão
- [ ] **PDF para flashcards**: extrair perguntas/respostas e exportar para Anki (.apkg)
- [ ] **Gerador de quiz**: criar questões de múltipla escolha a partir do texto
- [ ] **Extrator de figuras e tabelas**: exportar com legenda e numeração
- [ ] **Contador de palavras e caracteres** por seção
- [ ] **Verificador de formatação ABNT**: margens, espaçamento, fonte, numeração
- [ ] **Gerador de sumário automático**: a partir de títulos detectados no texto
- [ ] **Lista de siglas e abreviações**: detectar e gerar glossário
- [ ] **Anotações em margem**: equivalente digital de anotações em papel
- [ ] **Modo leitura noturna**: PDF com cores invertidas e brilho reduzido
- [ ] **Conversor de artigo para apresentação**: extrair pontos principais para slides

### FASE 29 — Publicação e Pré-impressão (P2)
*Ferramentas para quem prepara arquivos para gráfica e editoras.*

- [ ] **Imposição (imposition)**: 2-up, 4-up, 8-up, 16-up para cadernos/livretos
- [ ] **Layout de livreto**: saddle stitch, perfect bound — com página de imposição
- [ ] **Compensação de creep**: ajustar margens internas por página em cadernos grossos
- [ ] **Marcas de corte e sangria**: adicionar crop marks, bleed marks, registration marks
- [ ] **Verificador de sangria**: detectar elementos que não atingem bleed mínimo
- [ ] **Análise de cobertura de tinta**: percentual por canal CMYK, alerta de excesso
- [ ] **Gerenciamento de page boxes**: MediaBox, CropBox, BleedBox, TrimBox, ArtBox
- [ ] **Separação de cores**: extrair canais CMYK e spot colors
- [ ] **Verificação de fontes**: detectar fontes não embutidas, substituições e licensing
- [ ] **Preflight check**: relatório completo de problemas de impressão
- [ ] **Conversão RGB → CMYK**: com controle de perfil de cor (ICC)
- [ ] **Converter para escala de cinza**: com controle de contraste e gamma
- [ ] **Espelhamento de página**: necessário para alguns processos de impressão
- [ ] **Numeração de página composta**: frente e verso com offset de imposição

### FASE 30 — E-books e Publicação Digital (P2)
*Converter e preparar documentos para leitura digital.*

- [ ] **EPUB para PDF**: preservar capítulos, imagens, sumário e metadados
- [ ] **PDF para EPUB**: criar e-book reflowable a partir de PDF com texto
- [ ] **MOBI/AZW3/KF8 para PDF**: suporte a formatos Kindle
- [ ] **Editor de metadados de e-book**: título, autor, ISBN, capa, idioma, descrição
- [ ] **Gerador de sumário (TOC)**: para e-books, com níveis de hierarquia
- [ ] **Ajuste de contraste para e-ink**: otimizar imagens para leitores Kindle
- [ ] **PDF para flipbook**: efeito de folhear página (HTML5 interativo)
- [ ] **Mesclar EPUBs**: combinar múltiplos e-books em um volume
- [ ] **Dividir EPUB**: separar por capítulos
- [ ] **Validador EPUB**: verificar conformidade com EPUB 2/3 spec

### FASE 31 — Dados, Banco de Dados e Formatos Estruturados (P2)
*Ferramentas para manipular dados independente de PDF.*

- [ ] **CSV para PDF**: gerar tabela formatada e profissional
- [ ] **JSON para PDF**: renderizar dados estruturados como documento
- [ ] **PDF para CSV**: extrair tabelas com detecção avançada de layout
- [ ] **PDF para JSON**: extrair todo conteúdo estruturado (texto, tabelas, metadados)
- [ ] **CSV para JSON / JSON para CSV**: conversão bidirecional
- [ ] **JSON para Excel**: exportar dados aninhados com achatamento inteligente
- [ ] **SQLite para PDF**: exportar consultas como relatório formatado
- [ ] **PDF para SQLite**: importar tabelas extraídas para banco de dados
- [ ] **Formatador e validador JSON**: pretty print, minify, validar schema
- [ ] **Editor de CSV**: preview em tabela, ordenar, filtrar, editar células
- [ ] **XML para JSON / JSON para XML**: conversão bidirecional
- [ ] **Diferença entre CSVs**: comparar dois arquivos e destacar diferenças
- [ ] **Mesclar CSVs**: unir por coluna chave (tipo VLOOKUP)

### FASE 32 — Gráficos, Diagramas e Visualização (P2)
*Criar e renderizar representações visuais de dados e ideias.*

- [ ] **Gerador de gráficos**: barras, linhas, pizza, dispersão, área — a partir de CSV/JSON
- [ ] **Gerador de fluxograma**: a partir de descrição textual (Mermaid.js)
- [ ] **Gerador de organograma**: a partir de lista hierárquica
- [ ] **Gerador de mapa mental**: a partir de tópicos estruturados
- [ ] **Texto para diagrama**: sequência, classe, estado, Gantt, ER (sintaxe Mermaid)
- [ ] **Gerador de linha do tempo**: a partir de eventos com data
- [ ] **Gerador de QR Code**: URL, texto, WiFi, vCard, e-mail, telefone — exportar PNG/SVG/PDF
- [ ] **Leitor de QR Code / Barcode**: extrair dados de imagens e PDFs
- [ ] **Gerador de código de barras**: Code 128, EAN-13, ITF, Code 39 — para boletos e produtos
- [ ] **Nuvem de palavras**: a partir de texto — com formas e cores customizáveis
- [ ] **Gerador de calendário**: mensal/anual em PDF com eventos
- [ ] **Gerador de planner/agenda**: templates de planner diário, semanal e mensal

### FASE 33 — Conversão de Mídia (P2)
*Ir além de documentos — converter áudio, vídeo e outros formatos.*

- [ ] **Áudio para texto (transcrição)**: MP3/WAV/M4A → texto → PDF (via Whisper local)
- [ ] **Texto para áudio (TTS)**: PDF/texto → MP3 narrado (leitura em voz)
- [ ] **Vídeo para PDF**: extrair frames como páginas + texto de legendas
- [ ] **PDF para vídeo**: slide show com narração e transições
- [ ] **Imagens para vídeo**: criar time-lapse ou slide show a partir de fotos
- [ ] **Extrair áudio de vídeo**: MP4/MOV → MP3
- [ ] **Extrair legendas de vídeo**: SRT/VTT extrair e converter para texto
- [ ] **GIF animado para PDF**: converter GIF frame a frame
- [ ] **PDF para GIF animado**: páginas como frames de animação

### FASE 34 — Utilidades para Desenvolvedores (P2)
*Ferramentas técnicas que todo desenvolvedor precisa.*

- [ ] **Formatador de código**: JSON, JS, HTML, CSS, XML, SQL — pretty print e minify
- [ ] **Codificador Base64**: encode e decode de texto e arquivos
- [ ] **Codificador URL**: encode e decode de parâmetros
- [ ] **Gerador de hash**: MD5, SHA-1, SHA-256, SHA-512, BLAKE2
- [ ] **Gerador de UUID/GUID**: v1, v4, v7 — lote de IDs
- [ ] **Gerador de senha**: configurável (comprimento, caracteres especiais, etc.)
- [ ] **Gerador de Lorem Ipsum**: parágrafos, palavras, listas, HTML
- [ ] **Testador de regex**: com destaque de matches e grupos
- [ ] **Formatador de data/hora**: converter timestamps, UTC, timezones
- [ ] **Conversor de unidades**: distância, peso, temperatura, área, volume, velocidade
- [ ] **Conversor de bases numéricas**: decimal, binário, hex, octal
- [ ] **Gerador de texto placeholder**: nomes, e-mails, CPF, CNPJ, telefone, endereço
- [ ] **Editor de arquivo hosts**: preview e validação de sintaxe
- [ ] **Diff de texto**: comparar dois textos e destacar diferenças
- [ ] **Contador de caracteres, palavras e linhas**: com estatísticas de leitura

### FASE 35 — Arquivos e Compressão (P2)
*Formatos de arquivo e compactação.*

- [ ] **Compactar arquivos**: ZIP, TAR, 7z com opções de compressão
- [ ] **Extrair arquivos**: ZIP, RAR, 7z, TAR, GZ — preview antes de extrair
- [ ] **Criar PDF portfolio**: PDF container com múltiplos arquivos embutidos
- [ ] **Dividir ZIP por tamanho**: útil para e-mails com limite de anexo
- [ ] **Proteger ZIP com senha**: AES-256
- [ ] **Converter ZIP para PDF**: listar arquivos como índice
- [ ] **Renomear arquivos em lote**: regex, substituição, numeração, metadados
- [ ] **Organizar arquivos por tipo/data/tamanho**: mover e classificar
- [ ] **Encontrar duplicados**: por nome, tamanho ou hash
- [ ] **Calcular checksum de múltiplos arquivos**: relatório em CSV

### FASE 36 — Vetorial e Design (P3)
*Ferramentas para designers e criativos.*

- [ ] **SVG para PDF**: preservar vetores — sem rasterização
- [ ] **PDF para SVG**: extrair elementos vetoriais
- [ ] **Reduzir cores de imagem**: quantização, paleta, posterização
- [ ] **Vetorizar imagem**: converter raster (PNG/JPG) para SVG
- [ ] **Mesclar SVGs**: combinar múltiplos arquivos vetoriais
- [ ] **Simplificar paths**: reduzir pontos em curvas vetoriais
- [ ] **Converter texto para curvas**: gerar outlines de fontes
- [ ] **Redimensionar SVG**: com preservação de proporção
- [ ] **Otimizar SVG**: remover metadados, comentários, elementos invisíveis
- [ ] **Gerador de paleta de cores**: extrair cores dominantes de imagem

### FASE 37 — Planilhas e Apresentações (P3)
*Office completo dentro do toolkit.*

- [ ] **PDF para PowerPoint**: extrair texto e imagens como slides editáveis
- [ ] **PowerPoint para PDF**: preservar transições e notas (opcional)
- [ ] **PDF para planilha Google Sheets**: exportar com formatação
- [ ] **Excel avançado para PDF**: múltiplas abas, gráficos, formatação condicional
- [ ] **Gerador de apresentação**: templates de slides a partir de tópicos
- [ ] **PDF para Numbers (Apple)**: compatibilidade com iWork
- [ ] **PDF para LibreOffice**: formatos ODT, ODS, ODP
- [ ] **Converter pasta de trabalho**: Excel ↔ Google Sheets ↔ CSV ↔ Numbers

### FASE 38 — Forense e Verificação de Documentos (P3)
*Analisar integridade e autenticidade de documentos — diferencial absoluto.*

- [ ] **Detector de adulteração**: identificar áreas com fontes diferentes, sobreposições e rasuras
- [ ] **Análise de metadados**: criação vs modificação, software usado, histórico de edição
- [ ] **Verificador de assinatura digital**: validar certificados ICP-Brasil e ICP externos
- [ ] **Detector de montagem**: análise de inconsistências em imagens (ELA — Error Level Analysis)
- [ ] **Análise de fontes**: detectar substituição, incompatibilidade e fontes suspeitas
- [ ] **Linha do tempo do documento**: reconstruir histórico de modificações pelos metadados
- [ ] **Extrator de EXIF/GPS**: de imagens embutidas no PDF
- [ ] **Verificador de hashes**: conferir se o PDF confere com hash registrado em cartório/blockchain
- [ ] **Relatório de autenticidade**: score de confiança e pontos de atenção

### FASE 39 — Colaboração e Compartilhamento (P3)
*Trabalhar em equipe sem criar conta.*

- [ ] **Link temporário de compartilhamento**: expira em 1h/24h/7d — sem cadastro
- [ ] **Sala de revisão**: múltiplas pessoas comentam no mesmo documento
- [ ] **Comentários vinculados a trechos**: highlight + nota
- [ ] **Resolução de comentários**: marcar como resolvido com justificativa
- [ ] **Controle de versão**: upload de nova versão e diff automático com a anterior
- [ ] **Aprovação sequencial**: fluxo A → B → C com registro de cada etapa
- [ ] **Notificação por e-mail**: quando alguém comenta ou aprova (opcional)
- [ ] **Link de revisão anônima**: sem expor e-mails dos revisores
- [ ] **Exportar histórico de revisão**: PDF com comentários, autores e datas

### FASE 40 — Automação, API e Integrações (P3)
*Para usuários avançados e empresas.*

- [ ] **API REST documentada**: OpenAPI/Swagger com todos os endpoints
- [ ] **Chave de API**: gerenciamento de acesso programático
- [ ] **CLI (Command Line Interface)**: `pdftools compress arquivo.pdf --quality 80`
- [ ] **Watch folder**: monitorar pasta e processar automaticamente novos arquivos
- [ ] **Integração Zapier/Make/n8n**: conectar com milhares de apps
- [ ] **Webhook de conclusão**: POST com resultado quando processamento terminar
- [ ] **Agendamento**: processar em horário específico
- [ ] **E-mail para PDF**: enviar anexo por e-mail e receber resultado processado
- [ ] **Processamento em fila**: para operações pesadas — status e notificação ao concluir
- [ ] **Rate limit por chave**: controle de uso justo
- [ ] **Webhook de evento de arquivo**: notificar quando novo XML/PDF aparece em pasta

### FASE 41 — Formatos Especiais e de Nicho (P3)
*Suporte a formatos que ninguém mais oferece.*

- [ ] **DjVu para PDF**: formato comum em bibliotecas digitais e scans antigos
- [ ] **PostScript (PS) para PDF**: formato de impressão legado
- [ ] **XPS para PDF**: formato Microsoft alternativo ao PDF
- [ ] **CBR/CBZ (comic book) para PDF**: converter gibis e mangás
- [ ] **PDF para CBR/CBZ**: para leitura em apps de quadrinhos
- [ ] **LaTeX para PDF**: compilar .tex com preview e log de erros
- [ ] **Markdown para HTML**: preview renderizado
- [ ] **PDF/A-4**: conformidade com o padrão mais recente
- [ ] **PDF/UA-2**: acessibilidade universal (WCAG 2.1)
- [ ] **PDF/VT**: para documentos transacionais e impressão variável
- [ ] **PDF/E**: para documentos de engenharia
- [ ] **PDF/X**: para troca de arquivos de impressão (X-1a, X-3, X-4)
- [ ] **Rich Text Format (RTF) para PDF**: converter documentos WordPad
- [ ] **OpenDocument (ODT/ODS/ODP) para PDF**: suite LibreOffice/OpenOffice
- [ ] **E-mail .eml/.msg para PDF**: com cabeçalhos e anexos

### FASE 42 — Acessibilidade Universal (P3)
*Garantir que documentos sejam utilizáveis por todos.*

- [ ] **Verificador PDF/UA**: conformidade com padrão de acessibilidade
- [ ] **Verificador WCAG 2.1**: contraste, hierarquia, navegação
- [ ] **Editor de tags de acessibilidade**: árvore de tags do PDF (H1-H6, P, Table, Figure)
- [ ] **Simulador de leitor de tela**: preview de como JAWS/NVDA lerá o documento
- [ ] **Editor de ordem de leitura**: reordenar fluxo de leitura para screen readers
- [ ] **Gerenciador de texto alternativo**: adicionar/editar alt text em todas as imagens
- [ ] **Verificador de contraste de cor**: aprova/reprova por WCAG AA/AAA
- [ ] **Simulador de daltonismo**: protanopia, deuteranopia, tritanopia, acromatopsia
- [ ] **Idioma do documento**: definir e verificar lang attribute por parágrafo
- [ ] **Exportar relatório de acessibilidade**: PDF com problemas e correções sugeridas

### FASE 43 — Inteligência de Documentos (P3)
*Machine learning e IA para entender documentos.*

- [ ] **Classificador automático**: contrato, nota fiscal, currículo, boleto, RG, laudo, receita
- [ ] **Sumarizador de documentos**: resumo de 1 parágrafo ou bullet points
- [ ] **Chat com documento**: perguntar "qual o valor total?" e obter resposta
- [ ] **Extrator de entidades**: pessoas, empresas, datas, valores, endereços, CNPJ, CPF
- [ ] **Tradutor de documentos**: preservar layout ao traduzir (PT↔EN↔ES)
- [ ] **Gerador de resumo executivo**: de contrato — partes, objeto, valor, prazo, obrigações
- [ ] **Sugestão de tags e categorias**: para organização de arquivos
- [ ] **Reconhecimento de assinatura**: detectar presença de assinatura e validar similaridade
- [ ] **Análise de sentimento**: tom do documento (formal, agressivo, neutro, persuasivo)
- [ ] **Detector de informações sensíveis**: alerta de CPF, RG, cartão de crédito, senha expostos
- [ ] **Extrair dados de exames médicos**: glicemia, colesterol, pressão — estruturar resultados

### FASE 44 — Templates e Documentos Prontos (P3)
*Biblioteca de modelos para situações comuns do dia a dia.*

- [ ] **Contratos**: prestação de serviços, locação, comodato, confissão de dívida
- [ ] **Declarações**: residência, união estável, dependência econômica, hipossuficiência
- [ ] **Recibos**: pagamento, quitação, sinal, doação
- [ ] **Procurações**: plenos poderes, específica, substabelecimento
- [ ] **Cartas**: apresentação, recomendação, demissão, cobrança
- [ ] **Requerimentos**: administrativo, judicial, acadêmico
- [ ] **Notificações**: extrajudicial, cobrança, rescisão contratual
- [ ] **Atas**: reunião, assembleia, condomínio
- [ ] **Currículos**: templates ATS-friendly e criativos
- [ ] **Faturas e orçamentos**: modelo profissional com cálculo automático
- [ ] **Notas fiscais de serviço**: preencher e gerar layout profissional
- [ ] **Receitas médicas**: template com CRM, data e orientações
- [ ] **Certificados**: conclusão, participação, honra ao mérito
- [ ] **Cartões de visita**: exportar em PDF pronto para gráfica
- [ ] **Etiquetas e rótulos**: formatos padrão (PIMACO, Avery)
- [ ] **Planner e bullet journal**: templates imprimíveis

---

## Matriz de Conversão Universal

Esta matriz define toda conversão de formato suportada pelo produto final.
`S` = já implementado, `P` = planejado.

| De / Para | PDF | JPG | PNG | WebP | Word | Excel | PPT | TXT | HTML | EPUB | SVG | CSV | JSON | ZIP |
|-----------|-----|-----|-----|------|------|-------|-----|-----|------|------|-----|-----|------|-----|
| **PDF** | — | S | P | P | S | S | P | P | P | P | P | P | P | S |
| **JPG** | S | — | S | S | — | — | — | P | — | — | — | — | — | P |
| **PNG** | S | S | — | S | — | — | — | P | — | — | — | — | — | P |
| **WebP** | S | S | S | — | — | — | — | P | — | — | — | — | — | P |
| **Word** | S | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Excel** | P | — | — | — | — | — | — | — | — | — | — | P | P | — |
| **PPT** | P | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **HTML** | P | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **Markdown** | P | — | — | — | — | — | — | — | P | — | — | — | — | — |
| **EPUB** | P | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **HEIC/TIFF** | P | P | P | P | — | — | — | — | — | — | — | — | — | — |
| **SVG** | P | P | P | — | — | — | — | — | — | — | — | — | — | — |
| **CSV** | P | — | — | — | — | P | — | — | — | — | — | — | P | — |
| **JSON** | P | — | — | — | — | P | — | — | — | — | — | — | P | — |
| **XML** | P | — | — | — | — | P | — | — | — | — | — | — | P | — |
| **Áudio** | P | — | — | — | — | — | — | P | — | — | — | — | — | — |
| **Vídeo** | P | — | — | — | — | — | — | — | — | — | — | — | — | — |
| **EML/MSG** | P | — | — | — | — | — | — | — | — | — | — | — | — | — |

---

## Catálogo de Presets e Fluxos Rápidos

Fluxos de um clique que combinam múltiplas operações:

| Preset | Operações |
|--------|-----------|
| **Enviar por e-mail** | Comprimir + Reduzir imagens + Remover metadados |
| **Pronto para imprimir** | Mesclar + Numerar + Converter para CMYK + Sangria |
| **Assinar contrato** | Editor formulário + Assinatura + Data + Achatar |
| **Anonimizar documento** | Redigir CPF/CNPJ/e-mail + Remover metadados + Remover comentários |
| **Processar NF-e** | Validar XML + Excel + DANFE + Detectar duplicatas |
| **Digitalizar documento** | Scanner (corrigir perspectiva) + OCR + PDF pesquisável |
| **Preparar petição** | Numerar + Índice + Capa + Juntar anexos |
| **Criar e-book** | Converter para EPUB + Metadados + Sumário + Capa |
| **Relatório financeiro** | Extrair tabelas + Consolidar CSV + Gerar gráficos + PDF final |
| **Kit onboarding** | RG + CPF + Comprovante → PDF único com índice |

---

## Métricas de Sucesso

Produto:
- Tempo até primeira ação: < 3 segundos
- Cliques até download: 2-3
- Toda ferramenta tem preview quando aplicável
- Erro sempre sugere solução
- Editor diferencia PDF nativo de escaneado sem perguntar

Técnico:
- Build sempre verde
- Backend 100% modular (sem main.py legado)
- Nenhum temporário persistente
- Endpoints com erros padronizados
- PDFs de até 200 páginas processados sem timeout

UX:
- Mobile funcional em todas as ferramentas
- Preview não trava em PDFs grandes (>100 páginas)
- Editor com layout estável e undo/redo funcional
- Command Center funcional (Ctrl+K com busca e ações)
- Usuário encontra ferramenta em < 3 segundos

---

## Definition of Done por Ferramenta

- Está na home, navbar e busca
- Upload validado (tipo, tamanho, páginas)
- Preview quando aplicável
- Loading, erro e sucesso implementados
- Métricas de resultado visíveis
- Temporários limpos após resposta
- Teste manual documentado com arquivo real
- Funciona em mobile (360px - 1920px)
- Passa build e lint
- Mensagens em português correto
- Headers X-* padronizados na resposta
