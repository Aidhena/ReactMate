$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceLogo = Join-Path $projectRoot 'public/assets/kasmate-logo.png'
$legacyLogo = Join-Path $projectRoot 'public/pwa-512x512.png'
$resourceRoot = Join-Path $projectRoot 'app/src/main/res'

Add-Type -AssemblyName System.Drawing
$systemDrawingAssembly = Join-Path $PSHOME 'System.Drawing.Common.dll'
$systemDrawingPrimitivesAssembly = Join-Path $PSHOME 'System.Drawing.Primitives.dll'
$windowsGdiAssembly = Join-Path $PSHOME 'System.Private.Windows.GdiPlus.dll'
$windowsCoreAssembly = Join-Path $PSHOME 'System.Private.Windows.Core.dll'
Add-Type -ReferencedAssemblies @($systemDrawingAssembly, $systemDrawingPrimitivesAssembly, $windowsGdiAssembly, $windowsCoreAssembly) -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class KasMateIconGenerator
{
    private static Bitmap ExtractMark(string path, bool monochrome)
    {
        Bitmap source = new Bitmap(path);
        Bitmap mark = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        for (int y = 0; y < source.Height; y++)
        {
            for (int x = 0; x < source.Width; x++)
            {
                Color pixel = source.GetPixel(x, y);
                if (pixel.A == 0)
                {
                    mark.SetPixel(x, y, Color.Transparent);
                    continue;
                }

                int minChannel = Math.Min(pixel.R, Math.Min(pixel.G, pixel.B));
                int alpha = (255 - minChannel) * pixel.A / 255;
                if (alpha < 32)
                {
                    mark.SetPixel(x, y, Color.Transparent);
                    continue;
                }

                int background = 255 - alpha;
                int red = Math.Max(0, Math.Min(255, (pixel.R - background) * 255 / alpha));
                int green = Math.Max(0, Math.Min(255, (pixel.G - background) * 255 / alpha));
                int blue = Math.Max(0, Math.Min(255, (pixel.B - background) * 255 / alpha));
                if (monochrome)
                {
                    red = 255;
                    green = 255;
                    blue = 255;
                }

                mark.SetPixel(x, y, Color.FromArgb(alpha, red, green, blue));
            }
        }
        source.Dispose();
        return mark;
    }

    public static void WriteMark(string source, string target, int size, double scale, bool monochrome)
    {
        using (Bitmap mark = ExtractMark(source, monochrome))
        using (Bitmap canvas = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (Graphics graphics = Graphics.FromImage(canvas))
        {
            graphics.Clear(Color.Transparent);
            graphics.CompositingMode = CompositingMode.SourceOver;
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            int targetSize = (int)Math.Round(size * scale);
            int offset = (size - targetSize) / 2;
            graphics.DrawImage(mark, new Rectangle(offset, offset, targetSize, targetSize));
            canvas.Save(target, ImageFormat.Png);
        }
    }

    public static void WriteLegacyIcon(string source, string target, int size)
    {
        using (Bitmap logo = new Bitmap(source))
        using (Bitmap canvas = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (Graphics graphics = Graphics.FromImage(canvas))
        {
            graphics.Clear(Color.Transparent);
            graphics.InterpolationMode = InterpolationMode.HighQualityBicubic;
            graphics.PixelOffsetMode = PixelOffsetMode.HighQuality;
            graphics.DrawImage(logo, new Rectangle(0, 0, size, size));
            canvas.Save(target, ImageFormat.Png);
        }
    }
}
'@

$drawableDir = Join-Path $resourceRoot 'drawable-nodpi'
$mipmapNodpiDir = Join-Path $resourceRoot 'mipmap-nodpi'
New-Item -ItemType Directory -Force -Path $drawableDir, $mipmapNodpiDir | Out-Null

[KasMateIconGenerator]::WriteMark($sourceLogo, (Join-Path $drawableDir 'notification_kasmate_logo.png'), 192, 0.92, $true)
[KasMateIconGenerator]::WriteMark($sourceLogo, (Join-Path $drawableDir 'ic_kasmate_monochrome.png'), 512, 0.76, $true)
[KasMateIconGenerator]::WriteMark($sourceLogo, (Join-Path $mipmapNodpiDir 'ic_kasmate_foreground.png'), 1024, 0.76, $false)

$densitySizes = @{
    'mdpi' = 48
    'hdpi' = 72
    'xhdpi' = 96
    'xxhdpi' = 144
    'xxxhdpi' = 192
}
foreach ($density in $densitySizes.Keys)
{
    $directory = Join-Path $resourceRoot "mipmap-$density"
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    $size = $densitySizes[$density]
    [KasMateIconGenerator]::WriteLegacyIcon($legacyLogo, (Join-Path $directory 'ic_kasmate_launcher.png'), $size)
    [KasMateIconGenerator]::WriteLegacyIcon($legacyLogo, (Join-Path $directory 'ic_kasmate_launcher_round.png'), $size)
}

Write-Output 'Generated KasMate launcher and notification icon assets.'
