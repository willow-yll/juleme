# 配置（替换成你的实际值）
$apiKey = "qwertiasagv"
$baseUrl = "http://103.212.13.117:8001/v1/chat/completions"
$model = "MiniMax-M2.5"

# 核心请求逻辑（纯英文输出，无乱码）
try {
    # 检查类型是否存在，避免重复加载报错
    if (-not ([System.Management.Automation.PSTypeName]'TrustAllCertsPolicy').Type) {
        add-type @"
            using System.Net;
            using System.Security.Cryptography.X509Certificates;
            public class TrustAllCertsPolicy : ICertificatePolicy {
                public bool CheckValidationResult(ServicePoint s, X509Certificate c, WebRequest r, int e) { return true; }
            }
"@
    }
    [System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAllCertsPolicy

    # 发送请求（按需切换 Authorization / api_key）
    $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $apiKey"  # 改成 "api_key" = $apiKey 适配自定义认证
    } -Body (@{
        model = $model
        messages = @(@{role="user"; content="hello"})
    } | ConvertTo-Json) -ErrorAction Stop

    # 纯英文输出，无乱码
    Write-Host "✅ Connection successful! URL and API Key are valid" -ForegroundColor Green
}
catch {
    $status = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "0" }
    # 纯英文错误提示
    Write-Host "❌ Connection failed! Status code: $status  Reason: $($_.Exception.Message)" -ForegroundColor Red
}