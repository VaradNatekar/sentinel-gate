const GATEWAY_URL = "http://localhost:3200";

const TOKEN = "Bearer demo-token";

async function sendRequest(
  requestNumber: number,
  ip: string
) {
  const response = await fetch(`${GATEWAY_URL}/api/results`, {
    headers: {
      Authorization: TOKEN,
      "X-Forwarded-For": ip,
    },
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  console.log({
    request: requestNumber,
    ip,
    status: response.status,
    data,
  });
}

async function runCombinedAttack() {
  console.log("🔥 Starting combined attack...");

  const ips = [
    "10.0.0.1",
    "10.0.0.2",
    "10.0.0.3",
    
  ];

  let requestNumber = 1;

  for (const ip of ips) {
    console.log(`\nUsing IP: ${ip}`);

    for (let i = 0; i < 60; i++) {
      await sendRequest(requestNumber, ip);

      requestNumber++;
    }
  }

  console.log("\n🔥 Combined attack finished.");
}

runCombinedAttack();