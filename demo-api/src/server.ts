import express from "express";

const app = express();

const PORT = 4000;

app.use(express.json());

// Results endpoint
app.get("/api/results", (_req, res) => {
  res.json({
    endpoint: "results",
    data: [
      { id: 1, name: "Result A" },
      { id: 2, name: "Result B" }
    ]
  });
});

// Tickets endpoint
app.get("/api/tickets", (_req, res) => {
  res.json({
    endpoint: "tickets",
    tickets: [
      { id: 101, status: "open" },
      { id: 102, status: "closed" }
    ]
  });
});

// Profile endpoint
app.get("/api/profile", (_req, res) => {
  res.json({
    endpoint: "profile",
    user: {
      id: 1,
      name: "Demo User",
      role: "student"
    }
  });
});

app.listen(PORT, () => {
  console.log(`Demo API running on http://localhost:${PORT}`);
});