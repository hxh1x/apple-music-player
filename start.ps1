$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$bun = Join-Path $root ".tools\bun.exe"

Write-Host "Starting JioSaavn API on http://localhost:3000 ..."
Start-Process -FilePath $bun -ArgumentList "run","src/server.ts" -WorkingDirectory (Join-Path $root "api") -WindowStyle Minimized

Write-Host "Starting Apple Music Web UI on http://localhost:5173 ..."
Set-Location (Join-Path $root "web")
& $bun run dev
