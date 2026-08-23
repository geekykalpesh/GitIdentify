# PowerShell Script to Generate Code Signing Certificate & Sign Installer for Windows SmartScreen
# Publisher: GeekyKalpesh (https://geekykalpesh.com)

param (
    [string]$CertName = "GeekyKalpesh GitIdentity",
    [string]$OutPfxPath = ".\certs\geekykalpesh-code-signing.pfx",
    [string]$Password = "GitIdentity2026!"
)

Write-Host "=== Generating Self-Signed Code Signing Certificate for $CertName ===" -ForegroundColor Cyan

# Create certs directory if not existing
if (!(Test-Path -Path ".\certs")) {
    New-Item -ItemType Directory -Path ".\certs" | Out-Null
}

# Create Self-Signed Certificate
$secPassword = ConvertTo-SecureString $Password -AsPlainText -Force
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=$CertName" -CertStoreLocation Cert:\CurrentUser\My

Write-Host "Certificate Created with Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

# Export to PFX file
Export-PfxCertificate -Cert $cert -FilePath $OutPfxPath -Password $secPassword | Out-Null
Write-Host "Exported PFX Certificate to: $OutPfxPath" -ForegroundColor Green

# Export to CER file for root installation
$cerPath = ".\certs\geekykalpesh-code-signing.cer"
Export-Certificate -Cert $cert -FilePath $cerPath | Out-Null
Write-Host "Exported Public CER Certificate to: $cerPath" -ForegroundColor Green

Write-Host "`n=== INSTRUCTIONS TO TRUST THIS CERTIFICATE ON WINDOWS ===" -ForegroundColor Yellow
Write-Host "1. Right click $cerPath -> Select 'Install Certificate'" -ForegroundColor White
Write-Host "2. Select 'Local Machine' -> Click Next" -ForegroundColor White
Write-Host "3. Choose 'Place all certificates in the following store' -> Browse" -ForegroundColor White
Write-Host "4. Select 'Trusted Root Certification Authorities' -> Finish" -ForegroundColor White
Write-Host "`nYour Windows machine will now completely trust GitIdentity installers signed with this certificate!`n" -ForegroundColor Green
