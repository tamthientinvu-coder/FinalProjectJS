param(
    [switch]$SkipE2E,
    [switch]$SkipAudit
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$evidenceDir = Join-Path $projectRoot "artifacts/checks/$stamp"
New-Item -ItemType Directory -Path $evidenceDir -Force | Out-Null
$results = [System.Collections.Generic.List[object]]::new()

function Invoke-Check {
    param([string]$Package, [string]$Name, [string[]]$Arguments)
    Push-Location (Join-Path $projectRoot $Package)
    try {
        $logPath = Join-Path $evidenceDir "$Package-$Name.log"
        $started = Get-Date
        # Windows PowerShell 5 coi stderr của RTK là ErrorRecord dù lệnh thành công.
        $ErrorActionPreference = 'Continue'
        & rtk proxy npm @Arguments *> $logPath
        $code = $LASTEXITCODE
        $ErrorActionPreference = 'Stop'
        if ($null -eq $code) { throw "Không nhận được exit code: $Package/$Name" }
        $results.Add([pscustomobject]@{
            package = $Package; check = $Name; exitCode = $code
            seconds = [math]::Round(((Get-Date) - $started).TotalSeconds, 2)
            log = "$Package-$Name.log"
        })
        Write-Host "$Package / $Name : exit $code"
    } finally {
        Pop-Location
    }
}

try {
    & rtk proxy git -C $projectRoot rev-parse HEAD | Set-Content (Join-Path $evidenceDir 'commit.txt')
    & rtk proxy git -C $projectRoot status --short | Set-Content (Join-Path $evidenceDir 'worktree.txt')
    & rtk proxy node --version | Set-Content (Join-Path $evidenceDir 'node.txt')
    & rtk proxy npm --version | Set-Content (Join-Path $evidenceDir 'npm.txt')
    foreach ($package in @('backend', 'frontend')) {
        Invoke-Check $package 'lint' @('run', 'lint')
        Invoke-Check $package 'typecheck' @('run', 'typecheck')
        Invoke-Check $package 'test' @('test')
        Invoke-Check $package 'build' @('run', 'build')
        if (!$SkipAudit) { Invoke-Check $package 'audit' @('audit') }
    }
    Invoke-Check 'backend' 'prisma-validate' @('exec', '--', 'prisma', 'validate')
    if (!$SkipE2E) { Invoke-Check 'frontend' 'e2e' @('run', 'test:e2e') }
} finally {
    ConvertTo-Json -InputObject @($results.ToArray()) -Depth 4 | Set-Content -Encoding utf8 (Join-Path $evidenceDir 'results.json')
    Write-Host "Evidence: $evidenceDir"
}
if (@($results | Where-Object exitCode -NE 0).Count -gt 0) { exit 1 }
exit 0
