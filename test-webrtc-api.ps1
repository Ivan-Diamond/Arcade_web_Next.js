# Test WebRTC API endpoints
$rtmpUrl = "rtmp://206.81.25.143:1935/live/104_0"

# Parse URL
$uri = [System.Uri]$rtmpUrl
$serverHost = $uri.Host
$path = $uri.AbsolutePath

# Test direct connection to port 1985
$api = "http://${serverHost}:1985/rtc/v1/play/"
$streamUrl = "webrtc://${serverHost}${path}"

Write-Host "Testing WebRTC Signaling API" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "RTMP URL: $rtmpUrl" -ForegroundColor Yellow
Write-Host "API Endpoint: $api" -ForegroundColor Yellow
Write-Host "Stream URL: $streamUrl" -ForegroundColor Yellow
Write-Host ""

# Create a simple test SDP offer
$sdp = @"
v=0
o=- 1234567890 2 IN IP4 127.0.0.1
s=-
t=0 0
a=group:BUNDLE 0 1
a=msid-semantic: WMS
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:test
a=ice-pwd:testpassword123456789012
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
a=setup:actpass
a=mid:0
a=recvonly
a=rtcp-mux
a=rtpmap:111 opus/48000/2
m=video 9 UDP/TLS/RTP/SAVPF 96
c=IN IP4 0.0.0.0
a=rtcp:9 IN IP4 0.0.0.0
a=ice-ufrag:test
a=ice-pwd:testpassword123456789012
a=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
a=setup:actpass
a=mid:1
a=recvonly
a=rtcp-mux
a=rtpmap:96 H264/90000
"@

# Create JSON payload
$body = @{
    api = $api
    streamurl = $streamUrl
    sdp = $sdp
} | ConvertTo-Json

Write-Host "Request Body:" -ForegroundColor Green
Write-Host $body
Write-Host ""

Write-Host "Sending POST request to $api..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri $api -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host $response.Content
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body:" -ForegroundColor Red
        Write-Host $responseBody
    }
}
