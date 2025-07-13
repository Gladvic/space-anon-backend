console.log("DB URL at startup:", process.env.DATABASE_URL);

require('dotenv').config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// Only log DATABASE_URL in development
if (process.env.NODE_ENV !== "production") {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
}

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection using environment variables and Render-compatible SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Async table creation and server start
async function init() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        category VARCHAR(50),
        tags TEXT[],
        likes TEXT[] DEFAULT '{}',
        user_id TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookmarks (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        postid INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        postid INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        userid TEXT,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        createdat TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
        userid TEXT,
        UNIQUE (comment_id, userid)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        post_id INTEGER NOT NULL,
        comment_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // --- ROUTES ---

    // Get all posts
    app.get("/api/posts", async (req, res) => {
      const result = await pool.query("SELECT * FROM posts ORDER BY id DESC");
      res.json(result.rows);
    });

    // Get posts by user_id (My Posts)
    app.get("/api/myposts/:user_id", async (req, res) => {
      const { user_id } = req.params;
      const result = await pool.query(
        "SELECT * FROM posts WHERE user_id = $1 ORDER BY id DESC",
        [user_id]
      );
      res.json(result.rows);
    });

    // Get bookmarked posts for a user
    app.get("/api/bookmarks/:user_id", async (req, res) => {
      const { user_id } = req.params;
      const result = await pool.query(
        `SELECT p.* FROM posts p
         JOIN bookmarks b ON p.id = b.postid
         WHERE b.user_id = $1
         ORDER BY b.id DESC`,
        [user_id]
      );
      res.json(result.rows);
    });

    // Add a new post (with tags and category)
    app.post("/api/post", async (req, res) => {
      const { title, content, user_id, tags = [], category = null } = req.body;
      const result = await pool.query(
        "INSERT INTO posts (title, content, user_id, tags, category) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [title, content, user_id, tags, category]
      );
      res.json(result.rows[0]);
    });

    // Like/unlike a post (store user IDs in posts.likes array)
    app.put("/api/posts/:id/like", async (req, res) => {
      const { id } = req.params;
      const { userId } = req.body;
      const post = await pool.query("SELECT likes FROM posts WHERE id = $1", [id]);
      if (post.rows.length === 0) return res.status(404).send("Post not found");
      let likes = post.rows[0].likes || [];
      if (likes.includes(userId)) {
        likes = likes.filter(uid => uid !== userId);
      } else {
        likes.push(userId);
      }
      const updated = await pool.query("UPDATE posts SET likes = $1 WHERE id = $2 RETURNING *", [likes, id]);
      res.json(updated.rows[0]);
    });

    // --- COMMENTS API ---

    // POST /api/comments → create comment or reply (with notification)
    app.post("/api/comments", async (req, res) => {
      const { postid, userid, content, parent_id } = req.body;
      // Insert comment
      const result = await pool.query(
        "INSERT INTO comments (postid, userid, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *",
        [postid, userid, content, parent_id || null]
      );
      const comment = result.rows[0];

      // Find who should receive the notification
      let notifyUserId = null;
      let type = "comment";
      if (parent_id) {
        // It's a reply, notify the parent comment's user
        const parent = await pool.query("SELECT userid FROM comments WHERE id = $1", [parent_id]);
        if (parent.rows.length && parent.rows[0].userid !== userid) {
          notifyUserId = parent.rows[0].userid;
          type = "reply";
        }
      } else {
        // It's a top-level comment, notify the post owner
        const post = await pool.query("SELECT user_id FROM posts WHERE id = $1", [postid]);
        if (post.rows.length && post.rows[0].user_id !== userid) {
          notifyUserId = post.rows[0].user_id;
          type = "comment";
        }
      }
      if (notifyUserId) {
        await pool.query(
          "INSERT INTO notifications (user_id, type, post_id, comment_id) VALUES ($1, $2, $3, $4)",
          [notifyUserId, type, postid, comment.id]
        );
      }

      res.json(comment);
    });

    // GET /api/comments/:postId?limit=20&offset=0 → fetch paginated comments & replies for a post (nested)
    app.get("/api/comments/:postId", async (req, res) => {
      const { postId } = req.params;
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      // Fetch top-level comments for the post, paginated, with likes
      const topLevelResult = await pool.query(
        `SELECT c.*, 
          COALESCE(json_agg(cl.userid) FILTER (WHERE cl.id IS NOT NULL), '[]') AS likes
         FROM comments c
         LEFT JOIN comment_likes cl ON cl.comment_id = c.id
         WHERE c.postid = $1 AND c.parent_id IS NULL
         GROUP BY c.id
         ORDER BY c.createdat ASC
         LIMIT $2 OFFSET $3`,
        [postId, limit, offset]
      );
      const topLevelComments = topLevelResult.rows;

      // Fetch all replies for these top-level comments (1 level deep)
      const topIds = topLevelComments.map(c => c.id);
      let replies = [];
      if (topIds.length > 0) {
        const replyResult = await pool.query(
          `SELECT c.*, 
            COALESCE(json_agg(cl.userid) FILTER (WHERE cl.id IS NOT NULL), '[]') AS likes
           FROM comments c
           LEFT JOIN comment_likes cl ON cl.comment_id = c.id
           WHERE c.parent_id = ANY($1)
           GROUP BY c.id
           ORDER BY c.createdat ASC`,
          [topIds]
        );
        replies = replyResult.rows;
      }

      // Build nested structure
      const map = {};
      topLevelComments.forEach(c => { c.replies = []; map[c.id] = c; });
      replies.forEach(r => {
        if (map[r.parent_id]) {
          map[r.parent_id].replies.push(r);
        }
      });

      res.json(topLevelComments);
    });

    // GET all comments and replies for a post (no limit, unlimited nesting)
    app.get("/api/comments/unlimited/:postId", async (req, res) => {
      const { postId } = req.params;
      // Fetch all comments for the post, with likes
      const result = await pool.query(
        `SELECT c.*, 
          COALESCE(json_agg(cl.userid) FILTER (WHERE cl.id IS NOT NULL), '[]') AS likes
         FROM comments c
         LEFT JOIN comment_likes cl ON cl.comment_id = c.id
         WHERE c.postid = $1
         GROUP BY c.id
         ORDER BY c.createdat ASC`, [postId]);
      // Build unlimited nested structure
      const comments = result.rows;
      const map = {};
      comments.forEach(c => { c.replies = []; map[c.id] = c; });
      const tree = [];
      comments.forEach(c => {
        if (c.parent_id) {
          map[c.parent_id]?.replies.push(c);
        } else {
          tree.push(c);
        }
      });
      res.json(tree);
    });

    // PUT /api/comments/:id/like → like/unlike a comment
    app.put("/api/comments/:id/like", async (req, res) => {
      const { id } = req.params;
      const { userId } = req.body;
      const exists = await pool.query("SELECT * FROM comment_likes WHERE comment_id = $1 AND userid = $2", [id, userId]);
      if (exists.rows.length) {
        await pool.query("DELETE FROM comment_likes WHERE comment_id = $1 AND userid = $2", [id, userId]);
      } else {
        await pool.query("INSERT INTO comment_likes (comment_id, userid) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, userId]);
      }
      // Return updated comment with likes
      const comment = await pool.query(
        `SELECT c.*, COALESCE(json_agg(cl.userid) FILTER (WHERE cl.id IS NOT NULL), '[]') AS likes
         FROM comments c
         LEFT JOIN comment_likes cl ON cl.comment_id = c.id
         WHERE c.id = $1
         GROUP BY c.id`, [id]);
      res.json(comment.rows[0]);
    });

    // Delete a post
    app.delete("/api/post/:id", async (req, res) => {
      await pool.query("DELETE FROM posts WHERE id = $1", [req.params.id]);
      res.sendStatus(204);
    });

    // Delete a comment or reply (and all its children)
    app.delete("/api/comments/:id", async (req, res) => {
      const { id } = req.params;
      // Recursively delete all child comments
      await pool.query(`
        WITH RECURSIVE to_delete AS (
          SELECT id FROM comments WHERE id = $1
          UNION ALL
          SELECT c.id FROM comments c
          INNER JOIN to_delete td ON c.parent_id = td.id
        )
        DELETE FROM comments WHERE id IN (SELECT id FROM to_delete)
      `, [id]);
      res.sendStatus(204);
    });

    // Search posts by tag
    app.get("/api/posts/tag/:tag", async (req, res) => {
      const { tag } = req.params;
      const result = await pool.query(
        "SELECT * FROM posts WHERE $1 = ANY(tags) ORDER BY id DESC",
        [tag]
      );
      res.json(result.rows);
    });

    // Search posts by category
    app.get("/api/posts/category/:category", async (req, res) => {
      const { category } = req.params;
      const result = await pool.query(
        "SELECT * FROM posts WHERE category = $1 ORDER BY id DESC",
        [category]
      );
      res.json(result.rows);
    });

    // GET all notifications for a specific user (most recent first)
    app.get("/api/notifications/:user_id", async (req, res) => {
      const { user_id } = req.params;
      const result = await pool.query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
        [user_id]
      );
      res.json(result.rows);
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Error creating tables or starting server:", err);
    process.exit(1);
  }
}

init();