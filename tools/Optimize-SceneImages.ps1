# Optimize-SceneImages.ps1
# Batch resize scene slot images to web-ready resolution before R2 upload.
# Target: 1920px wide max, 85% JPG quality, preserving aspect ratio.
# Usage: .\tools\Optimize-SceneImages.ps1 -SourceDir ".\raw-art\ch1" -OutputDir ".\backend\public\art\ch1"

param(
    [Parameter(Mandatory=$true)]
    [string]$SourceDir,

    [Parameter(Mandatory=$false)]
    [string]$OutputDir = "$SourceDir\_web",

    [Parameter(Mandatory=$false)]
    [int]$MaxWidth = 1920,

    [Parameter(Mandatory=$false)]
    [int]$Quality = 85
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "Created output directory: $OutputDir"
}

$images = Get-ChildItem -Path $SourceDir -Include "*.jpg","*.jpeg","*.png","*.webp" -File

if ($images.Count -eq 0) {
    Write-Host "No images found in $SourceDir" -ForegroundColor Yellow
    exit
}

Write-Host "Processing $($images.Count) image(s)..." -ForegroundColor Cyan

foreach ($img in $images) {
    $src = $img.FullName
    $outName = [System.IO.Path]::GetFileNameWithoutExtension($img.Name) + ".jpg"
    $dest = Join-Path $OutputDir $outName

    try {
        $bitmap = [System.Drawing.Bitmap]::new($src)
        $origW = $bitmap.Width
        $origH = $bitmap.Height

        if ($origW -gt $MaxWidth) {
            $scale = $MaxWidth / $origW
            $newW  = $MaxWidth
            $newH  = [int]($origH * $scale)
        } else {
            $newW = $origW
            $newH = $origH
        }

        $resized = [System.Drawing.Bitmap]::new($newW, $newH)
        $g = [System.Drawing.Graphics]::FromImage($resized)
        $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $g.DrawImage($bitmap, 0, 0, $newW, $newH)
        $g.Dispose()

        $encoder   = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
        $encParams = [System.Drawing.Imaging.EncoderParameters]::new(1)
        $encParams.Param[0] = [System.Drawing.Imaging.EncoderParameter]::new(
            [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality
        )
        $resized.Save($dest, $encoder, $encParams)
        $resized.Dispose()
        $bitmap.Dispose()

        $srcKB  = [int]((Get-Item $src).Length / 1KB)
        $destKB = [int]((Get-Item $dest).Length / 1KB)
        Write-Host "  OK  $($img.Name)  ${origW}x${origH} -> ${newW}x${newH}  ${srcKB}KB -> ${destKB}KB" -ForegroundColor Green

    } catch {
        Write-Host "  ERR $($img.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done. Web-ready images in: $OutputDir" -ForegroundColor Cyan
Write-Host "Next: upload to R2 bucket under /art/ch1/"
