$baseDir = "d:\React App\Yuvaan-v1\botmantra-backend"
$csvPath = Join-Path $baseDir "Tables + columns.csv"
$baselinePath = Join-Path $baseDir "supabase\migrations\20260206_full_schema_baseline.sql"
$extrasPath = Join-Path $baseDir "supabase\migrations\20260206_add_two_api_system_extras.sql"

$csv = Import-Csv -Path $csvPath
$publicTables = $csv | Where-Object { $_.table_schema -eq 'public' } | Select-Object -ExpandProperty table_name -Unique

$baselineSql = Get-Content -LiteralPath $baselinePath -Raw
$extrasSql = ""
if (Test-Path $extrasPath) { $extrasSql = Get-Content -LiteralPath $extrasPath -Raw }
$combined = $baselineSql + "\n" + $extrasSql

$createMatches = [regex]::Matches($combined, '(?i)create\s+table\s+(if\s+not\s+exists\s+)?(["\w\.]+)')
$createdTables = @()
foreach ($m in $createMatches) {
  $t = $m.Groups[2].Value.Trim('"')
  if ($t.Contains('.')) { $t = $t.Split('.')[-1] }
  $createdTables += $t
}
$createdTables = $createdTables | Sort-Object -Unique

$missing = $publicTables | Where-Object { $createdTables -notcontains $_ }
"Missing public tables (CSV vs migrations): $($missing.Count)";
$missing | Sort-Object
