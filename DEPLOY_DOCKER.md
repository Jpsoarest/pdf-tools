# Deploy e atualizacao com Docker

A aplicacao usa dois containers:

- `pdf-tools-frontend`, na porta `3000`;
- `pdf-tools-backend`, na porta `5000`.

Os dados permanentes ficam em `./output` no host e nao fazem parte das imagens.

## Arquivos para enviar ao servidor

Envie estes cinco arquivos para a mesma pasta no servidor:

- `docker-compose.yml`
- `pdf-tools-backend.tar`
- `pdf-tools-frontend.tar`
- `ATUALIZAR_SERVIDOR.ps1`
- `SHA256SUMS.txt`

O diretorio `output` existente no servidor deve ser preservado.

## Atualizar no Windows sem derrubar a stack

No servidor Windows, abra o PowerShell como administrador e entre na pasta dos
arquivos. Depois execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\ATUALIZAR_SERVIDOR.ps1
```

O script usa `docker load` e `docker compose up -d --no-build`. Ele nao executa
`docker compose down`, nao remove volumes e nao interfere em containers de outros
projetos. O Compose recria somente os servicos desta aplicacao cujas imagens foram
atualizadas.

Tambem e possivel executar manualmente:

```powershell
docker load -i pdf-tools-backend.tar
docker load -i pdf-tools-frontend.tar
docker compose config --quiet
docker compose up -d --no-build backend frontend
docker compose ps
```

> Com uma unica instancia de cada servico e portas fixas, a troca do container
> pode causar uma indisponibilidade breve daquele servico. Zero downtime real
> exige duas replicas/blue-green e um proxy reverso.

## Verificacao

```powershell
docker compose ps
docker compose logs --tail=100 backend frontend
```

- Frontend: `http://IP_DO_SERVIDOR:3000`
- Backend: `http://IP_DO_SERVIDOR:5000`

## Persistencia e login

- Saida permanente: `./output`
- Temporarios: volume Docker `backend-temp`
- Arquivo de usuarios: `./output/pdf-tools/users.json`

O usuario inicial e `admin`, com senha `137494`. Depois do primeiro acesso,
troque a senha ou crie os usuarios definitivos pela interface.
