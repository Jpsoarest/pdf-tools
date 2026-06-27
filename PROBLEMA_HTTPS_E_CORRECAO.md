# Problema: aviso de "arquivo perigoso" no Chrome e correcao via Cloudflare Tunnel

## 1. Contexto

O servico **pdf-tools** roda em Docker, exposto como `http://4caxiastools.com.br:3000`. Ao baixar qualquer arquivo processado (PDF, imagem, XML, etc.), o Chrome exibe o aviso **"Este arquivo e perigoso"** com o botao **"Manter o download"**, exigindo clique extra a cada download.

A causa raiz e dupla:

1. **Origem HTTP sem TLS** -> o Chrome Safe Browsing reduz a reputacao de download para origens nao-HTTPS.
2. **Porta nao-padrao (`:3000`) na URL** -> a URL e classificada como "incomum" e pesa contra a decisao do Safe Browsing.

Efeito colateral: a **File System Access API** (`showSaveFilePicker`) do navegador nao funciona fora de um *secure context*, entao o botao "salvar em pasta especifica" do frontend fica indisponivel. Esse comportamento ja esta documentado em `DEPLOY_DOCKER.md:71-72`.

## 2. Restricoes do ambiente

- As portas **80** e **443** do servidor ja estao em uso por **outros apps Docker** no mesmo host (cada app exposto em sua propria porta). Nao ha proxy reverso compartilhado.
- O DNS de `4caxiastools.com.br` esta no **Cloudflare**.
- O servidor tem saida para a internet liberada.
- Decisoes ja tomadas:
  - **Subdominio para o fix**: raiz (`https://4caxiastools.com.br`).
  - **Fallback HTTP local**: nao -- `3000:3000` sera removido do compose.

## 3. Solucao proposta: Cloudflare Tunnel

`cloudflared` e um binario leve (roda em container) que abre uma **conexao outbound** para a borda do Cloudflare. Nao exige nenhuma porta de entrada no servidor. O Cloudflare termina o TLS e entrega o trafego ao `frontend` na rede Docker interna.

```
[Browser]
   |  HTTPS (cert Cloudflare, porta 443)
   v
[Cloudflare Edge]
   |  Tunnel (outbound, sem portas locais)
   v
[cloudflared container] ---> [frontend:3000] ---/api/backend/*---> [backend:5000]
```

### Por que essa e a solucao certa

| Requisito | Como o Tunnel resolve |
|---|---|
| Nao usar 80/443 no servidor | `cloudflared` conecta de saida. Zero portas inbound. |
| Sem conflito com outros apps | Cada tunnel e independente; sem port-forwarding. |
| URL limpa (`https://4caxiastools.com.br`) | TLS terminado no Cloudflare. |
| Eliminar o aviso do Chrome | HTTPS + cert valido + porta padrao. |
| `showSaveFilePicker` funcionar | Origem passa a ser *secure context*. |
| IP do servidor mudar | Tunnel e por hostname, nao por IP. |

## 4. Mudancas no projeto

### 4.1. `docker-compose.yml`

- Adicionar servico `cloudflared`.
- Remover `ports: ["3000:3000"]` do `frontend`.
- Manter `backend:5000` interno (ja e).

Bloco a adicionar:

```yaml
  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: pdf-tools-cloudflared
    command: tunnel --no-autoupdate run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    depends_on:
      frontend:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "cloudflared tunnel info pdf-tools || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s
```

No servico `frontend`, **remover** o bloco `ports:`:

```yaml
  frontend:
    image: pdf-tools-frontend:latest
    build:
      context: ./frontend
      args:
        BACKEND_INTERNAL_URL: http://backend:5000
        NEXT_PUBLIC_API_URL: /api/backend
    container_name: pdf-tools-frontend
    environment:
      BACKEND_INTERNAL_URL: http://backend:5000
      NEXT_PUBLIC_API_URL: /api/backend
    # sem ports: acessado apenas via cloudflared na rede interna
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://127.0.0.1:3000/').then(r => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))",
        ]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s
```

### 4.2. `frontend/next.config.ts`

Adicionar `trustHost: true` para que o Next aceite o `Host: 4caxiastools.com.br` enviado pelo `cloudflared`.

```ts
import type { NextConfig } from "next";

const backendUrl =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  output: "standalone",
  trustHost: true,
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  experimental: {
    proxyClientMaxBodySize: "210mb",
  },
};

export default nextConfig;
```

### 4.3. `backend/app.py` e `backend/main.py` (hardening de CORS)

Trocar `allow_origins=["*"]` pela origem real. Como frontend e backend ficam no mesmo origin (via rewrite do Next), CORS nao e exercitado em cenario normal; o ajuste e apenas defensivo.

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://4caxiastools.com.br",
        "https://www.4caxiastools.com.br",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=[
        "X-Original-Size", "X-Compressed-Size", "X-Reduction-Percent",
        "X-Total-Pages", "X-Files-Generated", "X-Pages-Converted",
        "X-Reordered-Pages", "X-Images-Converted", "X-Output-Pages",
        "X-Pages-Processed", "X-Tables-Found", "X-Rotated-Pages",
        "X-Extracted-Pages", "X-Removed-Pages", "X-Input-Size",
        "X-Output-Size", "X-Operations-Applied", "X-Fields-Added",
        "X-Replaced-Text", "X-Protected-Size", "X-Unlocked-Size",
        "X-Files-Processed", "X-Cropped-Pages", "X-Images-Extracted",
        "X-Repaired-Size", "X-Bookmarks-Created", "X-Modes-Simulated",
        "X-Modes", "X-Sheets-Processed", "X-Chars-Extracted", "X-Redacted-Count"
    ],
)
```

Aplicar o mesmo bloco em `backend/main.py` (linhas 27-35).

### 4.4. `.env.example` (novo, na raiz)

```
CLOUDFLARE_TUNNEL_TOKEN=coloque-aqui-o-token-do-tunnel
```

E adicionar `.env` ao `.gitignore` (verificar se ja consta).

### 4.5. `ATUALIZAR_SERVIDOR.ps1`

- Adicionar `cloudflared` a lista de servicos recriados.
- Adicionar checagem de imagem para `pdf-tools-cloudflared`.

```powershell
$arquivosObrigatorios = @(
    'pdf-tools-backend.tar',
    'pdf-tools-frontend.tar',
    'docker-compose.yml'
)

# (mantem o bloco de validacao de SHA256SUMS.txt como esta)

# Carregar imagens
Invoke-Docker -ArgumentList @('load', '--input', 'pdf-tools-backend.tar')
Invoke-Docker -ArgumentList @('load', '--input', 'pdf-tools-frontend.tar')

$imagemBackend = Get-DockerValue -ArgumentList @('image', 'inspect', '--format={{.Id}}', 'pdf-tools-backend:latest')
$imagemFrontend = Get-DockerValue -ArgumentList @('image', 'inspect', '--format={{.Id}}', 'pdf-tools-frontend:latest')

# cloudflared usa imagem publica (cloudflare/cloudflared:latest);
# o compose fara pull automaticamente no primeiro up.

Write-Host 'Validando a configuracao...'
Invoke-Docker -ArgumentList @('compose', 'config', '--quiet')

Write-Host 'Atualizando somente os servicos da aplicacao (sem docker compose down)...'
Invoke-Docker -ArgumentList @('compose', 'up', '-d', '--no-build', '--force-recreate', 'backend', 'frontend', 'cloudflared')

$containerBackend = Get-DockerValue -ArgumentList @('inspect', '--format={{.Image}}', 'pdf-tools-backend')
$containerFrontend = Get-DockerValue -ArgumentList @('inspect', '--format={{.Image}}', 'pdf-tools-frontend')
$containerCloudflared = Get-DockerValue -ArgumentList @('inspect', '--format={{.Image}}', 'pdf-tools-cloudflared')

if ($containerBackend -ne $imagemBackend) {
    throw "O backend nao esta usando a imagem carregada. Esperada: $imagemBackend; atual: $containerBackend"
}

if ($containerFrontend -ne $imagemFrontend) {
    throw "O frontend nao esta usando a imagem carregada. Esperada: $imagemFrontend; atual: $containerFrontend"
}

if ($containerCloudflared -notlike 'cloudflare/cloudflared:*') {
    throw "O container cloudflared nao esta usando a imagem oficial. Atual: $containerCloudflared"
}

Write-Host 'IDs das imagens em execucao conferidos com sucesso.'

Write-Host 'Estado atual:'
Invoke-Docker -ArgumentList @('compose', 'ps')
```

### 4.6. `DEPLOY_DOCKER.md`

Atualizar para refletir a nova topologia:

- Substituir:
  - `http://IP_DO_SERVIDOR:3000` -> `https://4caxiastools.com.br`
  - `http://IP_DO_SERVIDOR:5000` -> nao se aplica (backend fica interno)
- Adicionar secao **"Pre-requisitos Cloudflare"** (passos manuais do item 5 abaixo).
- Adicionar nota: "O TLS e terminado no Cloudflare via Tunnel; o certificado e gerenciado pelo Cloudflare e renovado automaticamente."

## 5. Passos manuais one-time (no dashboard do Cloudflare)

1. Acessar **Zero Trust -> Networks -> Tunnels -> Create a tunnel**.
2. Nome sugerido: `pdf-tools`.
3. Copiar o **TUNNEL_TOKEN** gerado (string longa).
4. Em **Public Hostnames**, adicionar:
   - Subdomain: **@ (raiz)**
   - Domain: `4caxiastools.com.br`
   - Service type: **HTTP**
   - URL: `frontend:3000`
5. O Cloudflare cria automaticamente o CNAME na zona DNS. O tunnel fica ativo.
6. Colocar o token no `.env` do servidor (nao comitar).

## 6. Deploy (ordem de execucao)

1. Aplicar as mudancas descritas na secao 4.
2. Provisionar o tunnel no dashboard do Cloudflare (one-time, remoto) -- secao 5.
3. Preencher o `.env` no servidor com `CLOUDFLARE_TUNNEL_TOKEN=...`.
4. No servidor:

   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass
   .\ATUALIZAR_SERVIDOR.ps1
   ```

5. Conferir logs:

   ```powershell
   docker logs pdf-tools-cloudflared
   ```

   Deve aparecer `Registered tunnel connection` (pode levar ate 30s na primeira vez).

6. Testar no navegador:
   - `https://4caxiastools.com.br` -> cadeado valido.
   - Baixar qualquer arquivo processado -> o aviso "arquivo perigoso / Manter download" nao aparece mais.
   - Botao "salvar em pasta" do frontend volta a funcionar (File System Access API).

## 7. Resultado esperado

- Aviso de "arquivo perigoso" do Chrome: **eliminado** (origem HTTPS, cert valido Cloudflare, porta 443 padrao).
- `showSaveFilePicker` no frontend: **habilitado** (contexto seguro).
- Outros apps no servidor: **intactos**, em suas portas; sem conflito.
- URL publica: **`https://4caxiastools.com.br`** (limpa, sem porta).
- Manutencao de certificado: **zero** -- Cloudflare gerencia.

## 8. Riscos e mitigacoes

| Risco | Mitigacao |
|---|---|
| Outage do Cloudflare | Raro. Sem fallback HTTP local nesta config; restaurar emergencialmente exige reexpor `:3000`. |
| Vazar `TUNNEL_TOKEN` | Token em `.env` (gitignored). Pode ser rotacionado no dashboard sem mudar o tunnel. |
| Latencia extra (~10-50 ms via Cloudflare) | Irrelevante para ferramentas de PDF. |
| IP do servidor mudar | Sem problema -- tunnel e outbound. |
| `cloudflared` nao conseguir baixar a imagem | Verificar saida para `registry-1.docker.io` e `ghcr.io`. |

## 9. Rollback

Se algo der errado, voltar a expondo `:3000` direto no `docker-compose.yml` e recriar o servico `frontend`. O tunnel pode ser desativado no dashboard sem impacto no DNS ate que voce remova o CNAME.

## 10. Alternativas consideradas (e por que ficaram de fora)

- **Caddy local com DNS-01 em porta nao-padrao (ex: 3443)**: funciona, mas a URL final teria porta -- voce rejeitou.
- **Adicionar vhost em proxy reverso compartilhado**: voce indicou que nao ha proxy compartilhado.
- **Traefik local em porta nao-padrao**: mesma limitacao da porta na URL.
- **Tailscale Funnel / ngrok**: mudam o dominio (nao preservam `4caxiastools.com.br` sem custo).
- **Cert autoassinado**: troca o aviso do Chrome por "cert nao confiavel" -- pior que o status quo.
