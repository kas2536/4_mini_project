import express from "express";
import methodOverride from "method-override";
import session from "express-session";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// PostgreSQL Connection Pool Setup
const db = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "BlogDB",
  password: "password123", 
  port: 5432,
});

db.connect()
  .then(() => console.log("Connected to PostgreSQL database: BlogDB"))
  .catch(err => console.error("Database connection error:", err.stack));

// Configuration static files and such
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(methodOverride("_method"));

// Session setup
app.use(session({
  secret: "cs312_secret_session_key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 Hours
}));

// Make user session data available across all EJS views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Authentication 
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/signin");
  }
  next();
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// authentication route stuff 

// GET: Signup Page
app.get("/signup", (req, res) => {
  res.json("signup", { error: null });
});

// POST: Signup Process
app.post("/signup", async (req, res) => {
  const { user_id, password, name } = req.body;
  try {
    const existingUser = await db.query("SELECT * FROM users WHERE user_id = $1", [user_id]);
    if (existingUser.rows.length > 0) {
      return res.json("signup", { error: "User ID is already taken. Please choose another." });
    }

    await db.query(
      "INSERT INTO users (user_id, password, name) VALUES ($1, $2, $3)",
      [user_id, password, name]
    );

    res.redirect("/signin");
  } catch (err) {
    console.error(err);
    res.json("signup", { error: "An error occurred during signup. Try again." });
  }
});

// GET: Signin Page
app.get("/signin", (req, res) => {
  res.json("signin", { error: null });
});

// POST: Signin Process
app.post("/signin", async (req, res) => {
  const { user_id, password } = req.body;
  try {
    const result = await db.query(
      "SELECT * FROM users WHERE user_id = $1 AND password = $2",
      [user_id, password]
    );

    if (result.rows.length === 0) {
      return res.json("signin", { error: "Invalid User ID or Password combination." });
    }

    // Set User Session
    req.session.user = {
      user_id: result.rows[0].user_id,
      name: result.rows[0].name
    };

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.json("signin", { error: "An error occurred during signin." });
  }
});

// GET: Signout
app.get("/signout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/signin");
  });
});

// blog posting stuff --------------------

// GET: Homepage 
app.get("/", async (req, res) => {
  const selectedCategory = req.query.category || "All";
  try {
    let query = "SELECT * FROM blogs ORDER BY date_created DESC";
    let params = [];

    if (selectedCategory !== "All") {
      query = "SELECT * FROM blogs WHERE category = $1 ORDER BY date_created DESC";
      params = [selectedCategory];
    }

    const result = await db.query(query, params);
    res.json("index", { 
      posts: result.rows, 
      selectedCategory 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database Query Error");
  }
});

// POST: Create post, needs Auth now
app.post("/posts", requireAuth, async (req, res) => {
  const { title, content, category } = req.body;
  const { user_id, name } = req.session.user;

  try {
    await db.query(
      "INSERT INTO blogs (creator_name, creator_user_id, title, body, category, date_created) VALUES ($1, $2, $3, $4, $5, NOW())",
      [name, user_id, title, content, category]
    );
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

// GET: Edit page, needs ownership
app.get("/posts/:id/edit", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM blogs WHERE blog_id = $1", [id]);
    const post = result.rows[0];
    if (!post) return res.redirect("/");

    // Enforce Ownership Verification
    if (post.creator_user_id !== req.session.user.user_id) {
      return res.status(403).send("Unauthorized: You can only edit your own posts.");
    }

    res.json("edit", { post });
  } catch (err) {
    console.error(err);
    res.json("edit", { error: "An error occurred while fetching the post for edit." });
  }
});

// PUT: update post, needs ownership
app.put("/posts/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, content, category } = req.body;

  try {
    // Check ownership before updating
    const check = await db.query("SELECT creator_user_id FROM blogs WHERE blog_id = $1", [id]);
    if (check.rows.length === 0 || check.rows[0].creator_user_id !== req.session.user.user_id) {
      return res.status(403).send("Unauthorized: You can only edit your own posts.");
    }

    await db.query(
      "UPDATE blogs SET title = $1, body = $2, category = $3 WHERE blog_id = $4",
      [title, content, category, id]
    );
    res.json("index", { error: "Post updated successfully." });
  } catch (err) {
    console.error(err);
    res.json("index", { error: "An error occurred while updating the post." });
  }
});

// DELETE: Remove post, needs ownership
app.delete("/posts/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Check ownership before deleting
    const check = await db.query("SELECT creator_user_id FROM blogs WHERE blog_id = $1", [id]);
    if (check.rows.length === 0 || check.rows[0].creator_user_id !== req.session.user.user_id) {
      return res.status(403).send("Unauthorized: You can only delete your own posts.");
    }

    await db.query("DELETE FROM blogs WHERE blog_id = $1", [id]);
    res.json("index", { error: "Post deleted successfully." });
  } catch (err) {
    console.error(err);
    res.json("index", { error: "An error occurred while deleting the post." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});