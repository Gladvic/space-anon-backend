/*
Add to your Express backend:

// Add parent_id and likes to your comments table:
-- SQL migration:
ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id);
ALTER TABLE comments ADD COLUMN likes TEXT[] DEFAULT '{}';

// POST /api/comments/:postid (already exists, just accept parent_id)
app.post('/api/comments/:postid', async (req, res) => {
  const { postid } = req.params;
  const { user_id, content, parent_id } = req.body;
  const result = await pool.query(
    'INSERT INTO comments (postid, user_id, content, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
    [postid, user_id, content, parent_id]
  );
  res.json(result.rows[0]);
});

// GET /api/comments/:postid (already exists, just return parent_id and likes)
app.get('/api/comments/:postid', async (req, res) => {
  const { postid } = req.params;
  const result = await pool.query('SELECT * FROM comments WHERE postid = $1 ORDER BY created_at ASC', [postid]);
  res.json(result.rows);
});

// POST /api/comments/like/:commentid
app.post('/api/comments/like/:commentid', async (req, res) => {
  const { commentid } = req.params;
  const { userId } = req.body;
  const result = await pool.query('SELECT likes FROM comments WHERE id = $1', [commentid]);
  if (result.rows.length === 0) return res.status(404).send("Comment not found");
  let likes = result.rows[0].likes || [];
  if (likes.includes(userId)) {
    likes = likes.filter(id => id !== userId);
  } else {
    likes.push(userId);
  }
  const update = await pool.query('UPDATE comments SET likes = $1 WHERE id = $2 RETURNING *', [likes, commentid]);
  res.json(update.rows[0]);
});
*/
