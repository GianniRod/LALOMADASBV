Add-Type -AssemblyName System.Drawing
$imagesDir = "c:\Users\massi\Downloads\ACLib\LALOMADASBV-main\assets\images"
Get-ChildItem -Path $imagesDir -Filter "*.jpeg" | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    if ($img.Width -gt 1920) {
        $ratio = 1920.0 / $img.Width
        $newHeight = [int]($img.Height * $ratio)
        $newImg = New-Object System.Drawing.Bitmap(1920, $newHeight)
        $graph = [System.Drawing.Graphics]::FromImage($newImg)
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.DrawImage($img, 0, 0, 1920, $newHeight)
        $graph.Dispose()
        $img.Dispose()
        $newImg.Save($_.FullName.Replace(".jpeg", "_web.jpeg"), [System.Drawing.Imaging.ImageFormat]::Jpeg)
        $newImg.Dispose()
        Write-Host "Resized $($_.Name)"
    } else {
        $img.Dispose()
    }
}
