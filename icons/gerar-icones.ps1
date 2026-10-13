# Gera os ícones do app (hexágono amarelo com chave) em PNG.
Add-Type -AssemblyName System.Drawing

function Desenhar([int]$tam, [string]$arquivo, [double]$margem) {
  $bmp = New-Object System.Drawing.Bitmap $tam, $tam
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.Clear([System.Drawing.Color]::FromArgb(255, 24, 24, 27))
  $amarelo = [System.Drawing.Color]::FromArgb(255, 255, 193, 7)
  $c = $tam / 2.0
  $r = ($tam / 2.0) * (1 - $margem)
  $pts = @()
  for ($k = 0; $k -lt 6; $k++) {
    $a = [Math]::PI / 2 + $k * [Math]::PI / 3
    $pts += New-Object System.Drawing.PointF ([float]($c + $r * [Math]::Cos($a))), ([float]($c + $r * [Math]::Sin($a)))
  }
  $g.FillPolygon((New-Object System.Drawing.SolidBrush $amarelo), $pts)
  $ri = $r * 0.62
  $escuro = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 24, 24, 27))
  $g.FillEllipse($escuro, [float]($c - $ri), [float]($c - $ri), [float](2 * $ri), [float](2 * $ri))
  # chave: cabo diagonal + boca
  $caneta = New-Object System.Drawing.Pen $amarelo, ([float]($tam * 0.07))
  $caneta.StartCap = 'Round'; $caneta.EndCap = 'Round'
  $g.DrawLine($caneta, [float]($c - $ri * 0.55), [float]($c + $ri * 0.55), [float]($c + $ri * 0.2), [float]($c - $ri * 0.2))
  $boca = $ri * 0.36
  $g.DrawArc($caneta, [float]($c + $ri * 0.2 - $boca * 0.4), [float]($c - $ri * 0.2 - $boca * 1.6), [float]($boca * 2), [float]($boca * 2), 100, 250)
  $bmp.Save($arquivo, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

$pasta = Split-Path -Parent $MyInvocation.MyCommand.Path
Desenhar 192 (Join-Path $pasta 'icon-192.png') 0.08
Desenhar 512 (Join-Path $pasta 'icon-512.png') 0.08
Desenhar 512 (Join-Path $pasta 'icon-maskable-512.png') 0.28
Write-Output 'icones ok'
