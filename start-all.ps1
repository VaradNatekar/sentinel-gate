Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\demo-api" -WindowStyle Normal
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\gateway" -WindowStyle Normal
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\dashboard" -WindowStyle Normal
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory ".\simulator" -WindowStyle Normal
