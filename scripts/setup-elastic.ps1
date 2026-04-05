param(
  [string]$ElasticUrl = "http://localhost:9200",
  [string]$KibanaUrl = "http://localhost:5601",
  [string]$Username = "elastic",
  [string]$Password = "changeme"
)

$ErrorActionPreference = "Stop"
$Headers = @{
  Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${Username}:${Password}"))
}
$KibanaHeaders = @{
  Authorization = $Headers.Authorization
  "kbn-xsrf" = "true"
  "Content-Type" = "application/json"
}

function Invoke-ElasticPut {
  param([string]$Path, [string]$JsonFile)
  $body = Get-Content -Raw $JsonFile
  Invoke-RestMethod -Method Put -Uri "${ElasticUrl}${Path}" -Headers $Headers -ContentType "application/json" -Body $body | Out-Null
}

Write-Host "Applying ILM policy..."
Invoke-ElasticPut "/_ilm/policy/freshcart-observability-ilm" "elastic/ilm-policy.json"

Write-Host "Applying index template..."
Invoke-ElasticPut "/_index_template/freshcart-observability-template" "elastic/index-template.json"

Write-Host "Creating transform..."
Invoke-ElasticPut "/_transform/freshcart-checkout-metrics-1m" "elastic/transform-checkout-metrics.json"

Write-Host "Starting transform..."
Invoke-RestMethod -Method Post -Uri "${ElasticUrl}/_transform/freshcart-checkout-metrics-1m/_start" -Headers $Headers | Out-Null

Write-Host "Creating Kibana server-log connector..."
$connectorBody = @'
{
  "name": "FreshCart server log action",
  "connector_type_id": ".server-log",
  "config": {}
}
'@
$connector = Invoke-RestMethod -Method Post -Uri "${KibanaUrl}/api/actions/connector" -Headers $KibanaHeaders -Body $connectorBody
$connectorId = $connector.id

if (-not $connectorId) {
  throw "Failed to create connector."
}

Write-Host "Creating alert rules..."
$ruleFiles = @(
  "kibana/rules/high-checkout-error-rate.json",
  "kibana/rules/high-checkout-latency.json",
  "kibana/rules/low-checkout-success-rate.json"
)

foreach ($ruleFile in $ruleFiles) {
  $content = (Get-Content -Raw $ruleFile).Replace("__CONNECTOR_ID__", $connectorId)
  Invoke-RestMethod -Method Post -Uri "${KibanaUrl}/api/alerting/rule" -Headers $KibanaHeaders -Body $content | Out-Null
  Write-Host "Created rule from $ruleFile"
}

Write-Host "Elastic and Kibana configuration complete."

