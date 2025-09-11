# PowerShell Browser Debug Launcher
# This script provides advanced browser debugging options

param(
    [Parameter(Mandatory = $false)]
    [ValidateSet("chrome", "edge", "both")]
    [string]$Browser = "chrome",
    
    [Parameter(Mandatory = $false)]
    [int]$Port = 9222,
    
    [Parameter(Mandatory = $false)]
    [string]$Url = "http://localhost:3000"
)

Write-Host "🚀 Browser Debug Launcher" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host ""

# Function to kill browser processes
function Stop-BrowserProcesses {
    param([string]$ProcessName)
    
    Write-Host "🔄 Stopping existing $ProcessName processes..." -ForegroundColor Yellow
    Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Function to launch Chrome
function Start-ChromeDebug {
    param([int]$DebugPort, [string]$TargetUrl)
    
    $chromePath = @(
        "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if (-not $chromePath) {
        Write-Host "❌ Chrome not found. Please install Chrome or check the path." -ForegroundColor Red
        return $false
    }
    
    $debugDir = "$env:TEMP\chrome-debug-$DebugPort"
    if (-not (Test-Path $debugDir)) {
        New-Item -ItemType Directory -Path $debugDir -Force | Out-Null
    }
    
    Write-Host "🌐 Launching Chrome with debugging on port $DebugPort..." -ForegroundColor Cyan
    Write-Host "📍 Chrome path: $chromePath" -ForegroundColor Gray
    Write-Host "📍 Debug directory: $debugDir" -ForegroundColor Gray
    
    $arguments = @(
        "--remote-debugging-port=$DebugPort",
        "--user-data-dir=`"$debugDir`"",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-plugins",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        $TargetUrl
    )
    
    Start-Process -FilePath $chromePath -ArgumentList $arguments -WindowStyle Normal
    return $true
}

# Function to launch Edge
function Start-EdgeDebug {
    param([int]$DebugPort, [string]$TargetUrl)
    
    $edgePath = @(
        "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    
    if (-not $edgePath) {
        Write-Host "❌ Edge not found. Please install Edge or check the path." -ForegroundColor Red
        return $false
    }
    
    $debugDir = "$env:TEMP\edge-debug-$DebugPort"
    if (-not (Test-Path $debugDir)) {
        New-Item -ItemType Directory -Path $debugDir -Force | Out-Null
    }
    
    Write-Host "🌐 Launching Edge with debugging on port $DebugPort..." -ForegroundColor Cyan
    Write-Host "📍 Edge path: $edgePath" -ForegroundColor Gray
    Write-Host "📍 Debug directory: $debugDir" -ForegroundColor Gray
    
    $arguments = @(
        "--remote-debugging-port=$DebugPort",
        "--user-data-dir=`"$debugDir`"",
        "--disable-web-security",
        "--no-first-run",
        "--disable-extensions",
        $TargetUrl
    )
    
    Start-Process -FilePath $edgePath -ArgumentList $arguments -WindowStyle Normal
    return $true
}

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    }
    catch {
        return $false
    }
}

# Main execution
Write-Host "🔍 Checking port availability..." -ForegroundColor Yellow
if (-not (Test-Port -Port $Port)) {
    Write-Host "⚠️  Port $Port is already in use. Trying alternative ports..." -ForegroundColor Yellow
    
    $alternativePorts = @(9223, 9224, 9225, 9226, 9227)
    $availablePort = $null
    
    foreach ($altPort in $alternativePorts) {
        if (Test-Port -Port $altPort) {
            $availablePort = $altPort
            break
        }
    }
    
    if ($availablePort) {
        $Port = $availablePort
        Write-Host "✅ Using port $Port instead" -ForegroundColor Green
    }
    else {
        Write-Host "❌ No available ports found. Please close other debugging sessions." -ForegroundColor Red
        exit 1
    }
}

# Launch browsers based on selection
switch ($Browser.ToLower()) {
    "chrome" {
        Stop-BrowserProcesses -ProcessName "chrome"
        if (Start-ChromeDebug -DebugPort $Port -TargetUrl $Url) {
            Write-Host ""
            Write-Host "✅ Chrome launched successfully!" -ForegroundColor Green
            Write-Host "📍 Debug port: $Port" -ForegroundColor Cyan
            Write-Host "🌐 URL: $Url" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🔗 Next steps:" -ForegroundColor Yellow
            Write-Host "   1. In Cursor AI, select '🔗 Attach to Chrome (Manual Launch)'" -ForegroundColor White
            Write-Host "   2. Press F5 to attach the debugger" -ForegroundColor White
        }
    }
    
    "edge" {
        Stop-BrowserProcesses -ProcessName "msedge"
        if (Start-EdgeDebug -DebugPort $Port -TargetUrl $Url) {
            Write-Host ""
            Write-Host "✅ Edge launched successfully!" -ForegroundColor Green
            Write-Host "📍 Debug port: $Port" -ForegroundColor Cyan
            Write-Host "🌐 URL: $Url" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "🔗 Next steps:" -ForegroundColor Yellow
            Write-Host "   1. In Cursor AI, select '🔗 Attach to Edge (Manual Launch)'" -ForegroundColor White
            Write-Host "   2. Press F5 to attach the debugger" -ForegroundColor White
        }
    }
    
    "both" {
        Write-Host "🚀 Launching both Chrome and Edge..." -ForegroundColor Green
        
        Stop-BrowserProcesses -ProcessName "chrome"
        Stop-BrowserProcesses -ProcessName "msedge"
        
        $chromeSuccess = Start-ChromeDebug -DebugPort $Port -TargetUrl $Url
        $edgeSuccess = Start-EdgeDebug -DebugPort ($Port + 1) -TargetUrl $Url
        
        if ($chromeSuccess -and $edgeSuccess) {
            Write-Host ""
            Write-Host "✅ Both browsers launched successfully!" -ForegroundColor Green
            Write-Host "📍 Chrome debug port: $Port" -ForegroundColor Cyan
            Write-Host "📍 Edge debug port: $($Port + 1)" -ForegroundColor Cyan
            Write-Host "🌐 URL: $Url" -ForegroundColor Cyan
        }
    }
}

Write-Host ""
Write-Host "🎉 Browser debugging setup complete!" -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

