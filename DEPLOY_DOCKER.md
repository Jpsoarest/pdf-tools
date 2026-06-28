# Deploy e atualizacao com Docker

A aplicacao usa tres containers:

- `pdf-tools-frontend` (Next.js), acessivel apenas pela rede interna do Compose na porta `3000`;
- `pdf-tools-backend` (FastAPI), acessivel apenas pela rede interna do Compose na porta `5000`;
- `pdf-tools-cloudflared`, que expoe a aplicacao publicamente via Cloudflare Tunnel (TLS terminado na borda do Cloudflare).

A URL publica e `https://4caxiastools.com.br`. Nao ha porta na URL e o certificado e gerenciado pelo Cloudflare.

O arquivo de usuarios fica em `./output/pdf-tools/users.json` no host e nao faz
parte das imagens. Os documentos processados sao baixados no computador do
usuario e nao sao salvos automaticamente no servidor.

## Pre-requisitos

- Docker Desktop instalado no Windows Server, com o daemon rodando.
- DNS de `4caxiastools.com.br` apontado para o Cloudflare (autoritativo).
- Tunnel provisionado no Cloudflare (passos abaixo, uma unica vez).
- Arquivo `.env` na raiz com `CLOUDFLARE_TUNNEL_TOKEN=...` (ver `.env.example`).
- Saida liberada para `registry-1.docker.io` e para a borda do Cloudflare (443 outbound). Nenhuma porta de entrada nova precisa ser liberada.

## Pre-requisitos Cloudflare (one-time, no dashboard)

1. Acessar **Cloudflare -> Zero Trust -> Networks -> Tunnels -> Create a tunnel**.
2. Nome sugerido: `pdf-tools`.
3. Copiar o **TUNNEL_TOKEN** gerado.
4. Em **Public Hostnames**, adicionar:
   - Subdomain: `@` (raiz)
   - Domain: `4caxiastools.com.br`
   - Service type: **HTTP**
   - URL: `frontend:3000`
5. O Cloudflare cria automaticamente o CNAME na zona DNS.
6. Colar o token no `.env` do servidor:

   ```
   CLOUDFLARE_TUNNEL_TOKEN=cole-aqui-o-token
   ```

## Arquivos para enviar ao servidor

Envie estes seis arquivos para a mesma pasta no servidor:

- `docker-compose.yml`
- `pdf-tools-backend.tar`
- `pdf-tools-frontend.tar`
- `ATUALIZAR_SERVIDOR.ps1`
- `SHA256SUMS.txt`
- `.env` (com o `CLOUDFLARE_TUNNEL_TOKEN`; nao comitar)

O diretorio `output` existente no servidor deve ser preservado.

## Atualizar no Windows sem derrubar a stack

No servidor Windows, abra o PowerShell como administrador e entre na pasta dos
arquivos. Depois execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\ATUALIZAR_SERVIDOR.ps1
```

O script usa `docker load` e `docker compose up -d --no-build --force-recreate`.
Ele nao executa `docker compose down`, nao remove volumes e nao interfere em
containers de outros projetos. O Compose recria somente os tres servicos desta
aplicacao. Ao final, o script tambem confirma que cada container esta executando
exatamente o ID da imagem esperada (`backend` e `frontend` a partir do `.tar`;
`cloudflared` a partir da imagem publica `cloudflare/cloudflared`).

Tambem e possivel executar manualmente:

```powershell
docker load -i pdf-tools-backend.tar
docker load -i pdf-tools-frontend.tar
docker compose pull cloudflared
docker compose config --quiet
docker compose up -d --no-build --force-recreate backend frontend cloudflared
docker compose ps
```

> Com uma unica instancia de cada servico e portas fixas, a troca do container
> pode causar uma indisponibilidade breve daquele servico. Zero downtime real
> exige duas replicas/blue-green e um proxy reverso.

## Verificacao

```powershell
docker compose ps
docker compose logs --tail=100 cloudflared
```

A aplicacao responde em `https://4caxiastools.com.br`. O tunnel nao expoe nenhuma porta no host (conexao outbound apenas), entao o servico continua acessivel mesmo se o IP do servidor mudar.

## Downloads, persistencia e login

- Downloads dos resultados: computador do usuario, conforme a configuracao do navegador.
- Selecao direta de pasta pela pagina: habilitada (File System Access API funciona em contexto seguro HTTPS).
- Temporarios: volume Docker `backend-temp`.
- Arquivo de usuarios: `./output/pdf-tools/users.json`.

O usuario inicial e `admin`, com senha `137494`. Depois do primeiro acesso,
troque a senha ou crie os usuarios definitivos pela interface.

## Rollback

Em caso de problema, reexpor o frontend na porta `3000` direto (sem tunnel):

1. Editar `docker-compose.yml` no `frontend` adicionando de volta `ports: ["3000:3000"]`.
2. Rodar `docker compose up -d --force-recreate frontend`.
3. Acessar por `http://IP_DO_SERVIDOR:3000` (o aviso de "arquivo perigoso" do Chrome voltara nesse caminho HTTP).

O tunnel pode ser desativado no dashboard do Cloudflare sem impacto ate o CNAME ser removido.
