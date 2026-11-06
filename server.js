require("dotenv").config();

const path = require("path");
const express = require("express");
const taskRoutes = require("./routes/taskRoutes");
const { testConnection } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

// EJS view engine and public assets
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.render("index", {
    pageTitle: "Task Manager",
    pageDescription: "Organize your work and keep track of your progress."
  });
});

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
