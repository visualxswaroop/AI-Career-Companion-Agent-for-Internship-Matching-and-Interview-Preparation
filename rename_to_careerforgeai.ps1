# Safe Folder Migration Script for CareerForge AI
# Run this script from PowerShell (outside the folder or in a new terminal window) to rename the root workspace directory.

$OldPath = "D:\PROJECTS\Career-companion-agent - Copy"
$NewPath = "D:\PROJECTS\careerforgeAI"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Migrating Career Companion Agent -> CareerForge AI " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

if (Test-Path $NewPath) {
    Write-Host "[!] Destination path '$NewPath' already exists. Please verify." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $OldPath)) {
    Write-Host "[!] Source path '$OldPath' was not found. Perhaps it was already renamed?" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/3] Renaming folder to '$NewPath'..." -ForegroundColor Green
try {
    Rename-Item -Path $OldPath -NewName "careerforgeAI" -ErrorAction Stop
    Write-Host "      Folder successfully renamed!" -ForegroundColor Green
} catch {
    Write-Host "[X] Could not rename folder automatically because another process (such as VS Code or a running server) has locked a file." -ForegroundColor Red
    Write-Host "    Please close open editor files or servers and run this script again." -ForegroundColor Red
    exit 1
}

# Update virtualenv pyvenv.cfg if present
$PyvenvCfg = Join-Path $NewPath "venv\pyvenv.cfg"
if (Test-Path $PyvenvCfg) {
    Write-Host "[2/3] Updating virtualenv configuration ($PyvenvCfg)..." -ForegroundColor Green
    $cfgContent = Get-Content -Raw $PyvenvCfg
    $cfgContent = $cfgContent -replace [regex]::Escape($OldPath), $NewPath
    $cfgContent = $cfgContent -replace "Career-companion-agent", "careerforgeAI"
    Set-Content -Path $PyvenvCfg -Value $cfgContent
    Write-Host "      Virtual environment config updated!" -ForegroundColor Green
}

Write-Host "[3/3] Migration completed successfully!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Step: Open the newly renamed folder in your editor:" -ForegroundColor White
Write-Host "  code '$NewPath'" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
