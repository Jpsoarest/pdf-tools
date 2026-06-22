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

Write-Host 'Carregando as novas imagens...'
Invoke-Docker -ArgumentList @('load', '--input', 'pdf-tools-backend.tar')
Invoke-Docker -ArgumentList @('load', '--input', 'pdf-tools-frontend.tar')

Write-Host 'Validando a configuracao...'
Invoke-Docker -ArgumentList @('compose', 'config', '--quiet')

Write-Host 'Atualizando somente os servicos da aplicacao (sem docker compose down)...'
Invoke-Docker -ArgumentList @('compose', 'up', '-d', '--no-build', 'backend', 'frontend')

Write-Host 'Estado atual:'
Invoke-Docker -ArgumentList @('compose', 'ps')
