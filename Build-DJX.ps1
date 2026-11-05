<#
  Builds djx.js from the modules in src/.

  Spicetify injects an extension as one file, so the shipped djx.js is generated: edit the
  modules in src/ and rebuild, never edit djx.js by hand.

  Usage:
    ./Build-DJX.ps1                 build, copy into the Spicetify Extensions folder, apply
    ./Build-DJX.ps1 -NoApply        build and copy, skip `spicetify apply`
    ./Build-DJX.ps1 -NoInstall      build only
#>
[CmdletBinding()]
param(
    [switch]$NoInstall,
    [switch]$NoApply
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$output = Join-Path $root "djx.js"
$sourceDir = Join-Path $root "src"

$parts = Get-ChildItem -Path $sourceDir -Filter "*.js" | Sort-Object Name
if (-not $parts) { throw "No modules found in $sourceDir." }

$builder = [System.Text.StringBuilder]::new()
foreach ($part in $parts) {
    $text = [System.IO.File]::ReadAllText($part.FullName)
    if (-not $text.EndsWith("`n")) { $text += "`n" }
    [void]$builder.Append($text)
    $lineCount = ($text -split "`n").Count - 1
    Write-Host ("  + src/{0}  ({1} lines)" -f $part.Name, $lineCount)
}

[System.IO.File]::WriteAllText($output, $builder.ToString(), [System.Text.UTF8Encoding]::new($false))
Write-Host ("Built djx.js  ({0} bytes)" -f (Get-Item $output).Length)

if ($NoInstall) { return }

$extensions = Join-Path $env:APPDATA "spicetify\Extensions"
if (-not (Test-Path $extensions)) {
    Write-Warning "Spicetify Extensions folder not found at $extensions - skipping copy."
    return
}
Copy-Item $output (Join-Path $extensions "djx.js") -Force
Write-Host "Copied djx.js into $extensions"

if ($NoApply) { return }
Write-Host "Applying Spicetify..."
spicetify apply