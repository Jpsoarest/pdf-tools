$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$arquivosObrigatorios = @(
    'pdf-tools-backend.tar',
    'pdf-tools-frontend.tar',
    'docker-compose.yml'
)

foreach ($arquivo in $arquivosObrigatorios) {
    if (-not (Test-Path -LiteralPath $arquivo -PathType Leaf)) {
        throw "Arquivo ausente: $arquivo"
    }
}

if (Test-Path -LiteralPath 'SHA256SUMS.txt' -PathType Leaf) {
    Write-Host 'Conferindo a integridade dos arquivos...'

    foreach ($linha in Get-Content -LiteralPath 'SHA256SUMS.txt') {
        if ($linha -notmatch '^([0-9a-fA-F]{64})\s+\*?(.+)$') {
            throw "Linha invalida em SHA256SUMS.txt: $linha"
        }

        $hashEsperado = $Matches[1].ToLowerInvariant()
        $arquivo = $Matches[2].Trim()
        $hashCalculado = (Get-FileHash -LiteralPath $arquivo -Algorithm SHA256).Hash.ToLowerInvariant()

        if ($hashCalculado -ne $hashEsperado) {
            throw "Checksum invalido para $arquivo"
        }

        Write-Host "OK: $arquivo"
    }
}

function Invoke-Docker {
    param([Parameter(Mandatory)][string[]] $ArgumentList)

    & docker @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "Docker retornou o codigo $LASTEXITCODE ao executar: docker $($ArgumentList -join ' ')"
    }
}

function Get-DockerValue {
    param([Parameter(Mandatory)][string[]] $ArgumentList)

    $resultado = & docker @ArgumentList
    if ($LASTEXITCODE -ne 0) {
        throw "Docker retornou o codigo $LASTEXITCODE ao executar: docker $($ArgumentList -join ' ')"
    }

    return ($resultado | Out-String).Trim()
}

Write-Host 'Carregando as novas imagens...'
Invoke-Docker -ArgumentList @('load', '--input', 'pdf-tools-backend.tar')
Invoke-Docker -ArgumentList @('load', '--input', 'pdf-tools-frontend.tar')

$imagemBackend = Get-DockerValue -ArgumentList @('image', 'inspect', '--format={{.Id}}', 'pdf-tools-backend:latest')
$imagemFrontend = Get-DockerValue -ArgumentList @('image', 'inspect', '--format={{.Id}}', 'pdf-tools-frontend:latest')

Write-Host "Imagem backend carregada:  $imagemBackend"
Write-Host "Imagem frontend carregada: $imagemFrontend"

Write-Host 'Validando a configuracao...'
Invoke-Docker -ArgumentList @('compose', 'config', '--quiet')

Write-Host 'Atualizando somente os servicos da aplicacao (sem docker compose down)...'
Invoke-Docker -ArgumentList @('compose', 'up', '-d', '--no-build', '--force-recreate', 'backend', 'frontend')

$containerBackend = Get-DockerValue -ArgumentList @('inspect', '--format={{.Image}}', 'pdf-tools-backend')
$containerFrontend = Get-DockerValue -ArgumentList @('inspect', '--format={{.Image}}', 'pdf-tools-frontend')

if ($containerBackend -ne $imagemBackend) {
    throw "O backend nao esta usando a imagem carregada. Esperada: $imagemBackend; atual: $containerBackend"
}

if ($containerFrontend -ne $imagemFrontend) {
    throw "O frontend nao esta usando a imagem carregada. Esperada: $imagemFrontend; atual: $containerFrontend"
}

Write-Host 'IDs das imagens em execucao conferidos com sucesso.'

Write-Host 'Estado atual:'
Invoke-Docker -ArgumentList @('compose', 'ps')
