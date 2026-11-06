require("dotenv").config();

const express = require("express");
const taskRoutes = require("./routes/taskRoutes");
const { testConnection } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Task Manager API is running"
  });
});

app.use("/api/tasks", taskRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error.message);
    process.exit(1);
  }
}

startServer();
