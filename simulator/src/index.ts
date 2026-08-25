const GATEWAY_URL = "http://localhost:3000";

async function sendRequest(requestNumber: number) {
  const response = await fetch(`${GATEWAY_URL}/api/results`);

  console.log({
    request: requestNumber,
    status: response.status,
  });
}

async function runBurstTraffic() {
  console.log("🔥 Starting burst traffic...");

  const requests = [];

  for (let i = 1; i <= 80; i++) {
    requests.push(sendRequest(i));
  }

  await Promise.all(requests);

  console.log("🔥 Burst traffic finished.");
}

runBurstTraffic();