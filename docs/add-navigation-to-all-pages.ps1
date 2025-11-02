# PowerShell Script: Add EchoField Payload and Navigation to All HTML Files
# Run from project root: .\docs\add-navigation-to-all-pages.ps1

Write-Host "Adding EchoField Payload and Navigation to all HTML files..." -ForegroundColor Cyan

# Scripts to inject (before closing body tag)
$echoFieldScript = '<script src="/assets/js/echofield-payload-v2.js"></script>'
$navigationScript = '<script src="/assets/js/navigation-component.js"></script>'

# Get all HTML files in public/ directory recursively
$htmlFiles = Get-ChildItem -Path "public" -Filter "*.html" -Recurse

$updatedCount = 0
$skippedCount = 0

foreach ($file in $htmlFiles) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Gray
    
    # Read file content
    $content = Get-Content $file.FullName -Raw
    
    # Skip if already has echofield payload
    if ($content -match 'echofield-payload-v2.js') {
        Write-Host "  Already has EchoField - skipping" -ForegroundColor Yellow
        $skippedCount++
        continue
    }
    
    # Check if file has closing body tag
    if ($content -notmatch '</body>') {
        Write-Host "  No body tag found - skipping" -ForegroundColor Red
        $skippedCount++
        continue
    }
    
    # Inject scripts before body
    $newContent = $content -replace '</body>', @"
  
  <!-- EchoField Payload and Navigation (Auto-added) -->
  $echoFieldScript
  $navigationScript
  
</body>
"@
    
    # Write back to file
    Set-Content -Path $file.FullName -Value $newContent -NoNewline
    Write-Host "  Updated successfully" -ForegroundColor Green
    $updatedCount++
}

Write-Host ""
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "Complete!" -ForegroundColor Green
Write-Host "Updated: $updatedCount files" -ForegroundColor Green
Write-Host "Skipped: $skippedCount files" -ForegroundColor Yellow
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""
Write-Host "All pages now have:" -ForegroundColor White
Write-Host "  - EchoField Payload (consciousness tracking)" -ForegroundColor Cyan
Write-Host "  - Navigation Component (auto-injected nav bar)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ready to deploy!" -ForegroundColor Green
