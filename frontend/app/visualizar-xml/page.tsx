'use client';

import { useState } from 'react';
import { getApiUrl, formatBytes } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

interface NfeData {
  ide?: Record<string, unknown>;
  emit?: Record<string, unknown>;
  dest?: Record<string, unknown>;
  det?: Array<{ prod?: Record<string, unknown>; imposto?: Record<string, unknown> }>;
  total?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function VisualizarXML() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<NfeData | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.xml')) {
      setError('Selecione um arquivo XML de NF-e');
      return;
    }
    setFile(f);
    setError('');
    setData(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(getApiUrl('/xml-preview'), {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Erro ao processar o XML');
      }

      const json = await res.json();
      setData(json as NfeData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar o XML';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFile(null);
    setData(null);
    setError('');
  };

  const renderField = (label: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return null;
    return (
      <div className="data-field">
        <span className="data-label">{label}</span>
        <span className="data-value">{String(value)}</span>
      </div>
    );
  };

  const renderSection = (title: string, fields: [string, unknown][]) => {
    const visible = fields.filter(([, v]) => v !== undefined && v !== null && v !== '');
    if (visible.length === 0) return null;
    return (
      <div className="data-section">
        <h3 className="data-section-title">{title}</h3>
        <div className="data-grid">
          {visible.map(([label, value]) => renderField(label, value))}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        .page-root {
          background: var(--bg-primary);
          min-height: 100vh;
          font-family: var(--font-body);
          color: var(--text-primary);
          padding: 32px 16px 60px;
        }
        .page-inner {
          max-width: 880px;
          margin: 0 auto;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 32px;
          font-size: 13px;
        }
        .breadcrumb a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .breadcrumb a:hover { color: var(--text-primary); }
        .breadcrumb span { color: var(--border-light); }
        .breadcrumb-current { color: var(--text-secondary); font-weight: 500; }
        .page-header {
          margin-bottom: 32px;
        }
        .page-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          margin-bottom: 16px;
        }
        .page-icon-wrap svg { width: 28px; height: 28px; color: #10B981; }
        .page-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 44px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1;
          margin: 0 0 10px;
          color: var(--text-primary);
        }
        .page-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0 0 28px;
        }
        .card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 20px;
          padding: clamp(20px, 4vw, 32px);
          margin-bottom: 16px;
          box-shadow: var(--shadow-sm);
        }
        .upload-trigger {
          border: 1.5px dashed var(--border-medium);
          border-radius: 14px;
          padding: 28px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--bg-secondary);
          display: block;
        }
        .upload-trigger:hover {
          border-color: #10B981;
          background: rgba(16, 185, 129, 0.03);
        }
        .upload-icon {
          width: 48px;
          height: 48px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 12px;
          margin: 0 auto 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .upload-icon svg {
          width: 22px;
          height: 22px;
          color: #10B981;
        }
        .upload-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .upload-hint {
          font-size: 12px;
          color: var(--text-tertiary);
        }
        .file-selected {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          margin-top: 14px;
        }
        .file-selected .file-icon { font-size: 22px; flex-shrink: 0; }
        .file-selected .file-info { flex: 1; min-width: 0; }
        .file-selected .file-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-selected .file-size {
          font-size: 11px;
          color: var(--text-tertiary);
          margin-top: 2px;
        }
        .file-selected .remove-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          color: var(--text-tertiary);
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .file-selected .remove-btn:hover {
          background: rgba(239,68,68,0.15);
          color: #EF4444;
        }
        .file-selected .remove-btn svg {
          width: 16px;
          height: 16px;
          display: block;
        }
        .btn-process {
          width: 100%;
          margin-top: 20px;
          padding: 16px;
          background: #10B981;
          color: white;
          border: none;
          border-radius: 14px;
          font-family: var(--font-body);
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-process:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);
        }
        .btn-process:disabled {
          background: var(--bg-tertiary);
          color: var(--text-tertiary);
          cursor: not-allowed;
        }
        .btn-outline {
          width: 100%;
          margin-top: 12px;
          padding: 13px;
          background: transparent;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-outline:hover {
          background: var(--bg-tertiary);
          border-color: var(--border-medium);
          color: var(--text-primary);
        }
        .error-box {
          display: flex;
          gap: 10px;
          padding: 14px 16px;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          margin-top: 16px;
          font-size: 13px;
          color: #EF4444;
          align-items: flex-start;
        }
        .error-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
        .info-box {
          display: flex;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(16, 185, 129, 0.06);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-radius: 12px;
          margin-top: 16px;
        }
        .info-box svg { width: 16px; height: 16px; color: #10B981; flex-shrink: 0; margin-top: 1px; }
        .info-box p {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .data-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border-light);
        }
        .data-section:first-of-type {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }
        .data-section-title {
          font-size: 15px;
          font-weight: 700;
          color: #10B981;
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .data-section-title::before {
          content: '';
          width: 4px;
          height: 20px;
          background: #10B981;
          border-radius: 2px;
        }
        .data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        .data-field {
          background: var(--bg-tertiary);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .data-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .data-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          word-break: break-word;
        }
        .table-wrap {
          overflow-x: auto;
          margin-top: 12px;
          border: 1px solid var(--border-light);
          border-radius: 12px;
        }
        .table-wrap table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .table-wrap th {
          background: var(--bg-tertiary);
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid var(--border-light);
          white-space: nowrap;
        }
        .table-wrap td {
          padding: 10px 12px;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border-light);
          white-space: nowrap;
        }
        .table-wrap tr:last-child td {
          border-bottom: none;
        }
        .table-wrap tr:hover td {
          background: rgba(16, 185, 129, 0.03);
        }
        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: var(--text-tertiary);
        }
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }
        .empty-state-text {
          font-size: 14px;
        }
        .summary-badge {
          display: inline-block;
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-top: 16px;
        }
        .trust-item {
          background: var(--card-bg);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 16px 12px;
          text-align: center;
        }
        .trust-emoji { font-size: 22px; margin-bottom: 8px; }
        .trust-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .trust-desc {
          font-size: 11px;
          color: var(--text-tertiary);
          line-height: 1.4;
        }
        @media (max-width: 600px) {
          .data-grid { grid-template-columns: 1fr; }
          .trust-grid { grid-template-columns: 1fr; }
          .table-wrap { font-size: 12px; }
        }
      `}</style>

      {loading && <LoadingSpinner message="Lendo XML da NF-e..." />}

      <div className="page-root">
        <div className="page-inner">
          <nav className="breadcrumb">
            <a href="/">Inicio</a>
            <span>/</span>
            <span className="breadcrumb-current">Visualizar XML</span>
          </nav>

          <div className="page-header">
            <div className="page-icon-wrap">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h1 className="page-title">Visualizar XML</h1>
            <p className="page-subtitle">Leia os dados estruturados de uma Nota Fiscal Eletronica (NF-e) de forma clara e organizada.</p>
          </div>

          <div className="card">
            {!data && (
              <label className="upload-trigger" style={{ display: 'block' }}>
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="upload-label">Clique para selecionar um XML de NF-e</div>
                <div className="upload-hint">Arquivo unico • Maximo 10MB</div>
              </label>
            )}

            {file && !data && (
              <div className="file-selected">
                <span className="file-icon">📄</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-btn" onClick={reset}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {file && !data && (
              <button
                className="btn-process"
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Visualizar NF-e'}
              </button>
            )}

            {!file && !data && (
              <div className="info-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Envie um arquivo XML de Nota Fiscal Eletronica (NF-e) para visualizar seus dados de forma estruturada.</p>
              </div>
            )}

            {error && (
              <div className="error-box">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
          </div>

          {data && (
            <>
              <div className="card">
                <div className="summary-badge">
                  {data.ide && (data.ide as Record<string, unknown>).natOp
                    ? `NF-e • ${(data.ide as Record<string, unknown>).natOp}`
                    : 'NF-e'}
                </div>

                {data.ide && renderSection('Nota Fiscal', [
                  ['Natureza da Operacao', (data.ide as Record<string, unknown>).natOp],
                  ['Numero', (data.ide as Record<string, unknown>).nNF],
                  ['Serie', (data.ide as Record<string, unknown>).serie],
                  ['Data de Emissao', (data.ide as Record<string, unknown>).dhEmi || (data.ide as Record<string, unknown>).dEmi],
                  ['Data de Saida', (data.ide as Record<string, unknown>).dhSaiEnt || (data.ide as Record<string, unknown>).dSaiEnt],
                  ['Chave de Acesso', (data.ide as Record<string, unknown>).chNFe || (data.infNFe as Record<string, unknown>)?.Id],
                  ['Modelo', (data.ide as Record<string, unknown>).mod],
                  ['Tipo de Operacao', (data.ide as Record<string, unknown>).tpNF === '0' ? 'Entrada' : (data.ide as Record<string, unknown>).tpNF === '1' ? 'Saida' : (data.ide as Record<string, unknown>).tpNF],
                  ['Finalidade', (data.ide as Record<string, unknown>).finNFe === '1' ? 'Normal' : (data.ide as Record<string, unknown>).finNFe === '2' ? 'Complementar' : (data.ide as Record<string, unknown>).finNFe],
                  ['Tipo de Emissao', (data.ide as Record<string, unknown>).tpEmis],
                  ['Codigo Municipio', `${(data.ide as Record<string, unknown>).cMunFG || ''} - ${(data.ide as Record<string, unknown>).cMun || ''}`],
                ])}

                {data.emit && renderSection('Emitente', [
                  ['Razao Social', (data.emit as Record<string, unknown>).xNome],
                  ['Nome Fantasia', (data.emit as Record<string, unknown>).xFant],
                  ['CNPJ', (data.emit as Record<string, unknown>).CNPJ],
                  ['Inscricao Estadual', (data.emit as Record<string, unknown>).IE],
                  ['Logradouro', (data.emit as Record<string, unknown>).xLgr],
                  ['Numero', (data.emit as Record<string, unknown>).nro],
                  ['Complemento', (data.emit as Record<string, unknown>).xCpl],
                  ['Bairro', (data.emit as Record<string, unknown>).xBairro],
                  ['Municipio', `${(data.emit as Record<string, unknown>).xMun || ''} - ${(data.emit as Record<string, unknown>).UF || ''}`],
                  ['CEP', (data.emit as Record<string, unknown>).CEP],
                  ['Pais', (data.emit as Record<string, unknown>).xPais],
                  ['Telefone', (data.emit as Record<string, unknown>).fone],
                  ['Regime Tributario', (data.emit as Record<string, unknown>).CRT],
                ])}

                {data.dest && renderSection('Destinatario', [
                  ['Razao Social', (data.dest as Record<string, unknown>).xNome],
                  ['CNPJ/CPF', (data.dest as Record<string, unknown>).CNPJ || (data.dest as Record<string, unknown>).CPF],
                  ['Inscricao Estadual', (data.dest as Record<string, unknown>).IE],
                  ['Logradouro', (data.dest as Record<string, unknown>).xLgr],
                  ['Numero', (data.dest as Record<string, unknown>).nro],
                  ['Complemento', (data.dest as Record<string, unknown>).xCpl],
                  ['Bairro', (data.dest as Record<string, unknown>).xBairro],
                  ['Municipio', `${(data.dest as Record<string, unknown>).xMun || ''} - ${(data.dest as Record<string, unknown>).UF || ''}`],
                  ['CEP', (data.dest as Record<string, unknown>).CEP],
                  ['Pais', (data.dest as Record<string, unknown>).xPais],
                  ['Telefone', (data.dest as Record<string, unknown>).fone],
                  ['Indicador de IE', (data.dest as Record<string, unknown>).indIEDest],
                ])}

                {data.total && renderSection('Totais', [
                  ['Valor dos Produtos', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vProd],
                  ['Base de Calculo ICMS', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vBC],
                  ['Valor ICMS', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vICMS],
                  ['Valor Frete', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vFrete],
                  ['Valor Seguro', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vSeg],
                  ['Outras Despesas', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vOutro],
                  ['Desconto', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vDesc],
                  ['Valor Total IPI', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vIPI],
                  ['Valor Total da Nota', (data.total as Record<string, unknown>).ICMSTot && (data.total as Record<string, unknown>).vNF],
                ])}
              </div>

              {data.det && data.det.length > 0 && (
                <div className="card">
                  <div className="data-section" style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
                    <h3 className="data-section-title">Itens ({data.det.length})</h3>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Codigo</th>
                            <th>Descricao</th>
                            <th>NCM</th>
                            <th>CFOP</th>
                            <th>Unid</th>
                            <th>Qtde</th>
                            <th>Valor Un.</th>
                            <th>Valor Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.det.map((item, i) => (
                            <tr key={i}>
                              <td>{String((item.prod as Record<string, unknown>)?.nItem ?? i + 1)}</td>
                              <td>{String((item.prod as Record<string, unknown>)?.cProd ?? '')}</td>
                              <td style={{ whiteSpace: 'normal', maxWidth: '200px' }}>{String((item.prod as Record<string, unknown>)?.xProd ?? '')}</td>
                              <td>{String((item.prod as Record<string, unknown>)?.NCM ?? '')}</td>
                              <td>{String((item.prod as Record<string, unknown>)?.CFOP ?? '')}</td>
                              <td>{String((item.prod as Record<string, unknown>)?.uCom ?? '')}</td>
                              <td>{String((item.prod as Record<string, unknown>)?.qCom ?? '')}</td>
                              <td>{String((item.prod as Record<string, unknown>)?.vUnCom ?? '')}</td>
                              <td>{String((item.prod as Record<string, unknown>)?.vProd ?? '')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <button className="btn-outline" onClick={reset}>
                Visualizar outro XML
              </button>
            </>
          )}

          <div className="trust-grid">
            {[
              { e: '📋', t: 'Leitura Estruturada', d: 'Dados organizados por secoes para facil consulta' },
              { e: '🏛️', t: 'Dados Fiscais', d: 'Informacoes completas de emitente, destinatario e tributos' },
              { e: '👁️', t: 'Visualizacao Clara', d: 'Interface limpa para leitura rapida dos dados da nota' },
            ].map((x) => (
              <div key={x.t} className="trust-item">
                <div className="trust-emoji">{x.e}</div>
                <div className="trust-title">{x.t}</div>
                <div className="trust-desc">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
