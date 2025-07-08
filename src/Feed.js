import React, { useState, useEffect } from "react";
import "./Feed.css";
import {
  FaHeart,
  FaTrash,
  FaHome,
  FaUser,
  FaMoon,
  FaSearch,
  FaRegBookmark,
  FaBookmark, // <-- Add this import
  FaBell
} from "react-icons/fa";
import axios from "axios";

// Generate or get user ID
function getUserId() {
  let userId = localStorage.getItem("spaceanon_user_id");
  if (!userId) {
    userId = Math.random().toString(36).substr(2, 12) + Date.now();
    localStorage.setItem("spaceanon_user_id", userId);
  }
  return userId;
}

const Feed = ({
  posts = [],
  setPosts = () => {},
  page = "home",
  setPage = () => {},
  bookmarkedPosts = [],
  setBookmarkedPosts = () => {},
}) => {
  const [newPost, setNewPost] = useState({ title: "", content: "", tags: "" });
  const [error, setError] = useState("");
  const [showAddPostModal, setShowAddPostModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTag, setSearchTag] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const userId = getUserId();

  // Add state for expanded posts
  const [expandedPosts, setExpandedPosts] = useState({});
  // Add missing state for delete modal and related results
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [relatedResults, setRelatedResults] = useState([]);
  // State for comments
  const [comments, setComments] = useState({}); // postId -> nested array of comments
  const [newComment, setNewComment] = useState({}); // postId or commentId -> comment content
  const [showComments, setShowComments] = useState({}); // postId -> boolean
  const [replyBox, setReplyBox] = useState({}); // commentId -> boolean
  // Add state for comment pagination
  const [commentPagination, setCommentPagination] = useState({}); // postId -> {limit, offset, hasMore}
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let url;
        if (page === "dashboard") {
          url = `http://localhost:5000/api/myposts/${userId}`;
        } else {
          url = "http://localhost:5000/api/posts";
        }
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        setPosts(data || []);
      } catch (err) {
        setPosts([]);
        console.error("Failed to fetch posts:", err);
      }
    };
    fetchPosts();
    // Add setPosts to dependency array to satisfy eslint
  }, [page, userId, setPosts]);

  // Defensive: ensure posts and bookmarkedPosts are always arrays
  const safePosts = Array.isArray(posts) ? posts : [];
  const safeBookmarkedPosts = Array.isArray(bookmarkedPosts) ? bookmarkedPosts : [];

  // Ensure every post has a unique 'id' property
  const normalizedPosts = safePosts.map((post, idx) => ({
    ...post,
    id: post.id ?? post._id ?? idx,
  }));

  // Helper to get the correct posts for the current page
  const getPostsToShow = () => {
    if (page === "dashboard") {
      // Only show posts created by the current user
      return normalizedPosts.filter(
        (post) =>
          post.user_id === userId ||
          post.userId === userId ||
          (post.user && (post.user === userId || post.user._id === userId))
      );
    }
    if (page === "bookmarks") {
      // Only show bookmarked posts that still exist in all posts
      return safeBookmarkedPosts.filter(
        (b) =>
          normalizedPosts.some((p) => (p.id ?? p._id) === (b.id ?? b._id))
      );
    }
    // Default to "home" or any other value: show all posts
    return normalizedPosts;
  };

  const postsToShow = getPostsToShow();

  const handlePostSubmit = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError("Both title and content are required!");
      return;
    }
    setError("");
    const tagsArray = newPost.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const response = await fetch("http://localhost:5000/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newPost, user_id: userId, tags: tagsArray }),
      });
      if (!response.ok) {
        const errMsg = await response.text();
        setError("Failed to add post: " + errMsg);
        return;
      }
      const addedPost = await response.json();

      // Always add the new post to the posts list so it appears immediately
      setPosts((prev) => [addedPost, ...prev]);
      setNewPost({ title: "", content: "", tags: "" });
      setShowAddPostModal(false);
    } catch (error) {
      setError("Error adding post: " + error.message);
      console.error("Error adding post:", error);
    }
  };

  // Like logic: toggle like for this user (by userId) and update backend
  const handleLikePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        const updatedPost = await response.json();
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            (post.id ?? post._id) === (updatedPost.id ?? updatedPost._id) ? updatedPost : post
          )
        );
        setSearchResults((prevResults) =>
          prevResults.map((post) =>
            (post.id ?? post._id) === (updatedPost.id ?? updatedPost._id) ? updatedPost : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDeleteClick = (postId) => {
    setDeleteId(postId);
    setShowDeleteWarning(true);
  };

  // Delete logic: update backend and remove from UI
  const handleConfirmDelete = async () => {
    try {
      await fetch(`http://localhost:5000/api/post/${deleteId}`, { method: "DELETE" });
    } catch (e) {
      // Ignore error, still remove from UI
    }
    setPosts((prev) =>
      prev.filter((p, idx) =>
        (p.id ?? p._id ?? idx) !== deleteId
      )
    );
    setBookmarkedPosts((prev) =>
      prev.filter((b, idx) =>
        (b.id ?? b._id ?? idx) !== deleteId
      )
    );
    setShowDeleteWarning(false);
    setDeleteId(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteWarning(false);
    setDeleteId(null);
  };

  // Combined search for tags and post content/title
  const handleCombinedSearch = async (e) => {
    e && e.preventDefault();
    if (!searchTag.trim()) return;
    setSearchLoading(true);
    setSearchResults([]);
    // Search by tag
    const tagRes = await fetch(`http://localhost:5000/api/posts/tag/${encodeURIComponent(searchTag.trim())}`);
    const tagData = await tagRes.json();
    // Search all posts for title/content match
    const allRes = await fetch("http://localhost:5000/api/posts");
    const allPosts = await allRes.json();
    const textMatches = allPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(searchTag.trim().toLowerCase()) ||
        post.content.toLowerCase().includes(searchTag.trim().toLowerCase())
    );
    // Merge and deduplicate results
    const merged = [...tagData, ...textMatches.filter(
      (post) => !tagData.some((t) => t.id === post.id)
    )];
    setSearchResults(merged);
    // Related: partial tag match if no results
    if (merged.length === 0) {
      const related = allPosts.filter(
        (post) =>
          post.tags &&
          post.tags.some((tag) =>
            tag.toLowerCase().includes(searchTag.trim().toLowerCase())
          )
      );
      setRelatedResults(related);
    }
    setSearchLoading(false);
  };

  // Bookmark logic
  const handleBookmark = (post) => {
    const id = post.id ?? post._id;
    if (!id) return;
    // Avoid duplicates by id
    if (bookmarkedPosts.some((b) => (b.id ?? b._id) === id)) {
      setBookmarkedPosts((prev) => prev.filter((b) => (b.id ?? b._id) !== id));
    } else {
      setBookmarkedPosts((prev) => {
        // Avoid duplicates if post already exists
        if (prev.some((b) => (b.id ?? b._id) === id)) return prev;
        return [...prev, post];
      });
    }
  };

  // Show a warning if required props are not provided
  useEffect(() => {
    if (typeof setPosts !== "function" || typeof setPage !== "function") {
      // eslint-disable-next-line no-console
      console.warn(
        "Feed: setPosts and setPage must be provided by the parent component for sidebar and posting to work."
      );
    }
  }, [setPosts, setPage]);

  // Live related results as user types in search bar (debounced)
  useEffect(() => {
    if (!searchTag.trim()) {
      setRelatedResults([]);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const allRes = await fetch("http://localhost:5000/api/posts", { signal: controller.signal });
        const allPosts = await allRes.json();
        const related = allPosts.filter(
          (post) =>
            post.tags &&
            post.tags.some((tag) =>
              tag.toLowerCase().includes(searchTag.trim().toLowerCase())
            )
        );
        setRelatedResults(related);
      } catch (e) {
        // Ignore abort errors
      }
    }, 200); // Debounce for 200ms

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line
  }, [searchTag]);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    // Only save if not on the bookmarks page to avoid overwriting with filtered posts
    if (page !== "bookmarks") {
      localStorage.setItem("spaceanon_bookmarks", JSON.stringify(bookmarkedPosts));
    }
  }, [bookmarkedPosts, page]);

  // Load bookmarks from localStorage on mount (only once)
  useEffect(() => {
    const saved = localStorage.getItem("spaceanon_bookmarks");
    if (saved) {
      try {
        setBookmarkedPosts(JSON.parse(saved));
      } catch {}
    }
    // eslint-disable-next-line
  }, []);

  // Fetch paginated comments for a post
  const fetchComments = async (postId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/comments/${postId}`);
      const data = response.data || [];
      setComments((prev) => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Load more comments for a post
  const loadMoreComments = async (postId) => {
    try {
      await fetchComments(postId); // Refresh comments for real-time update
    } catch (error) {
      console.error("Error loading more comments:", error);
    }
  };

  // Like/unlike a comment
  const handleLikeComment = async (commentId, postId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/${commentId}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        fetchComments(postId); // Refresh comments for real-time update
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  // Toggle comments section
  const toggleComments = (postId) => {
    setShowComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
    if (!showComments[postId]) fetchComments(postId);
  };

  // Delete a comment or reply (and its children)
  const handleDeleteComment = async (commentId, postId) => {
    try {
      await axios.delete(`http://localhost:5000/api/comments/${commentId}`);
      // Wait a moment to ensure backend deletes all children before refetching
      setTimeout(() => fetchComments(postId), 200);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Recursive render for nested comments (unlimited depth)
  const renderComments = (commentsArr, postId) => {
    if (!commentsArr) return null;
    return commentsArr.map((comment) => {
      const cid = comment.id ?? comment._id;
      return (
        <div
          key={cid}
          style={{
            marginBottom: 10,
            marginLeft: comment.parent_id ? 24 : 0,
            borderLeft: comment.parent_id ? "2px solid #23264A" : "none",
            paddingLeft: comment.parent_id ? 12 : 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 500, color: "#E63946" }}>{comment.userid}</span>
            <span style={{ marginLeft: 8, color: "#fff" }}>{comment.content}</span>
            <button
              onClick={() => handleLikeComment(cid, postId)}
              style={{
                background: "none",
                border: "none",
                color: (comment.likes || []).includes(userId) ? "#E63946" : "#C4C4C4",
                marginLeft: 12,
                cursor: "pointer",
                fontSize: "1.1em"
              }}
            >
              <FaHeart />
              <span style={{ marginLeft: 4, fontWeight: 500 }}>{(comment.likes || []).length}</span>
            </button>
            <button
              onClick={() => setReplyBox((prev) => ({ ...prev, [cid]: !prev[cid] }))}
              style={{
                background: "none",
                border: "none",
                color: "#A362EA",
                marginLeft: 8,
                cursor: "pointer",
                fontSize: "1em"
              }}
            >
              Reply
            </button>
            <button
              onClick={() => handleDeleteComment(cid, postId)}
              style={{
                background: "none",
                border: "none",
                color: "#F48C8C",
                marginLeft: 8,
                cursor: "pointer",
                fontSize: "1em"
              }}
              aria-label="Delete comment"
            >
              <FaTrash />
            </button>
          </div>
          {replyBox[cid] && (
            <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
              <input
                type="text"
                placeholder="Write a reply..."
                value={newComment[cid] || ""}
                onChange={(e) => setNewComment((prev) => ({ ...prev, [cid]: e.target.value }))}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: "#23264A",
                  color: "#fff",
                }}
              />
              <button
                onClick={async () => {
                  await handleAddComment(postId, cid);
                  setReplyBox((prev) => ({ ...prev, [cid]: false }));
                  setNewComment((prev) => ({ ...prev, [cid]: "" }));
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: "#A362EA",
                  color: "#fff",
                  fontWeight: 500,
                  transition: "background 0.2s",
                }}
              >
                Reply
              </button>
            </div>
          )}
          {/* Render replies recursively */}
          {renderComments(comment.replies, postId)}
        </div>
      );
    });
  };

  const handleAddComment = async (postId, parentId = null) => {
    const key = parentId || postId;
    const content = newComment[key];
    if (!content?.trim()) return;
    try {
      await axios.post("http://localhost:5000/api/comments", {
        postid: postId,
        userid: userId,
        content,
        parent_id: parentId,
      });
      setNewComment((prev) => ({ ...prev, [key]: "" }));
      setReplyBox((prev) => ({ ...prev, [parentId]: false }));
      fetchComments(postId); // Refresh comments for real-time update
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Poll notifications every 10 seconds
  useEffect(() => {
    let interval;
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/notifications/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.length); // Simple: all are unread (for demo)
        }
      } catch (e) {
        // ignore
      }
    };
    fetchNotifications();
    interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className={`dashboard-container${sidebarCollapsed ? " collapsed" : ""}`}>
      <aside className="dashboard-sidebar">
        <div className="dashboard-logo-row">
          <button
            className="dashboard-toggle-btn"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label="Toggle sidebar"
          >
            <FaMoon />
          </button>
          {!sidebarCollapsed && (
            <>
              <span className="dashboard-logo-icon"><FaMoon /></span>
              <span className="dashboard-logo-text">Space Anon</span>
            </>
          )}
        </div>
        <nav className="dashboard-nav">
          <button
            type="button"
            className={`dashboard-nav-btn${page === "home" ? " active" : ""}`}
            onClick={() => setPage("home")}
            aria-current={page === "home" ? "page" : undefined}
            style={page === "home" ? { background: "#A362EA", color: "#fff" } : {}}
          >
            <FaHome />
            {!sidebarCollapsed && <span>Home</span>}
          </button>
          <button
            type="button"
            className={`dashboard-nav-btn${page === "dashboard" ? " active" : ""}`}
            onClick={() => setPage("dashboard")}
            aria-current={page === "dashboard" ? "page" : undefined}
            style={page === "dashboard" ? { background: "#A362EA", color: "#fff" } : {}}
          >
            <FaUser />
            {!sidebarCollapsed && <span>My Posts</span>}
          </button>
          {/* Remove the bookmarks button from the dashboard */}
          {/* 
          <button
            type="button"
            className={`dashboard-nav-btn${page === "bookmarks" ? " active" : ""}`}
            onClick={() => setPage("bookmarks")}
            aria-current={page === "bookmarks" ? "page" : undefined}
            style={page === "bookmarks" ? { background: "#A362EA", color: "#fff" } : {}}
          >
            <FaBookmark />
            {!sidebarCollapsed && <span>Bookmarks</span>}
          </button>
          */}
        </nav>
        {/* Removed user/profile section and dashboard things */}
      </aside>
      <main className="dashboard-main">
        {/* Always visible search bar at the top of main content, on home and my posts */}
        {(page === "home" || page === "dashboard") && (
          <form className="dashboard-main-search-bar sticky-search-bar" onSubmit={handleCombinedSearch}>
            <FaSearch className="search-icon-btn" />
            <input
              type="text"
              placeholder="Search posts or tags"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="tag-search-input"
              autoFocus
            />
            <button type="submit" className="tag-search-btn">Search</button>
          </form>
        )}
        <button className="add-post-btn" onClick={() => setShowAddPostModal(true)}>
          Add Post
        </button>
        {/* Tag & post search results */}
        {searchTag.trim() && (
          <div
            className="feed search-results"
            style={{
              width: "550px",
              maxWidth: "550px",
              minWidth: "550px",
              margin: "0 auto",
            }}
          >
            {searchLoading ? (
              <p className="search-loading">Searching...</p>
            ) : searchResults.length > 0 ? (
              <>
                <h2 style={{ color: "#A362EA", margin: "0 0 12px 0" }}>
                  Results for: {searchTag}
                </h2>
                {searchResults.map((post, idx) => {
                  const id = post.id ?? post._id ?? idx;
                  const expanded = expandedPosts[id];
                  const content = post.content || "";
                  const likesArr = Array.isArray(post.likes) ? post.likes : [];
                  const liked = likesArr.includes(userId);
                  return (
                    <div
                      className={`post${expanded ? " expanded" : ""}`}
                      key={id}
                      style={{
                        width: "100%",
                        maxWidth: 780,
                        minWidth: 780,
                        margin: "0 auto",
                        minHeight: 120,
                        maxHeight: expanded ? "none" : 220,
                        overflow: expanded ? "visible" : "hidden",
                        textAlign: "left",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        background: "#181C3A",
                      }}
                    >
                      <h3 style={{ textAlign: "left", margin: "0 0 8px 0" }}>{post.title}</h3>
                      <p
                        style={{
                          ...(expanded
                            ? { display: "block", overflow: "visible", WebkitLineClamp: "unset", maxHeight: "none" }
                            : {
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 8,
                                overflow: "hidden",
                                maxHeight: "12em"
                              }),
                          textAlign: "left",
                          marginBottom: 0,
                          width: "100%",
                          wordBreak: "break-word",
                        }}
                      >
                        {content}
                      </p>
                      {content.split(/\s+/).length > 60 && (
                        <span
                          className="show-more-less"
                          style={{ color: "#A362EA", cursor: "pointer", marginLeft: 8, fontWeight: 500 }}
                          onClick={() =>
                            setExpandedPosts((prev) => ({
                              ...prev,
                              [id]: !prev[id],
                            }))
                          }
                        >
                          {expanded ? " Show less" : " Show more"}
                        </span>
                      )}
                      <div className="post-tags" style={{ textAlign: "left", marginTop: 8 }}>
                        {post.tags && post.tags.map((tag, i) => (
                          <span className="post-tag" key={i}>#{tag}</span>
                        ))}
                      </div>
                      <div
                        className="post-actions"
                        style={{
                          marginTop: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 18,
                          width: "100%",
                        }}
                      >
                        <button
                          className="post-like-btn"
                          onClick={() => handleLikePost(id)}
                          aria-label="Like post"
                          style={{
                            background: "#23264A",
                            border: "none",
                            cursor: "pointer",
                            color: Array.isArray(post.likes) && post.likes.includes(userId) ? "#E63946" : "#C4C4C4",
                            fontSize: "1.2rem",
                            borderRadius: "50%",
                            padding: "6px 12px",
                            display: "flex",
                            alignItems: "center",
                            transition: "color 0.2s, background 0.2s",
                          }}
                        >
                          <FaHeart
                            color={Array.isArray(post.likes) && post.likes.includes(userId) ? "#E63946" : "#C4C4C4"}
                            style={{ marginRight: 6 }}
                          />
                          <span style={{
                            color: "#C4C4C4",
                            fontWeight: 500,
                            fontSize: "1.05rem",
                            marginLeft: 2,
                            minWidth: 18,
                            display: "inline-block"
                          }}>
                            {Array.isArray(post.likes) ? post.likes.length : 0}
                          </span>
                        </button>
                        <button
                          className="post-delete-btn"
                          onClick={() => handleDeleteClick(id)}
                          aria-label="Delete post"
                          style={{
                            background: "#23264A",
                            border: "none",
                            cursor: "pointer",
                            color: "#F48C8C",
                            fontSize: "1.2rem",
                            borderRadius: "50%",
                            padding: "6px 12px",
                            marginLeft: "auto",
                            transition: "color 0.2s, background 0.2s"
                          }}
                        >
                          <FaTrash color="#F48C8C" />
                        </button>
                      </div>
                      {/* Comments section - hidden by default */}
                      <div className="post-comments-section" style={{ marginTop: 16, width: "100%" }}>
                        <button
                          className="toggle-comments-btn"
                          onClick={() => toggleComments(id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#A362EA",
                            fontSize: "1rem",
                            padding: 0,
                            margin: "0 0 12px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {showComments[id] ? "▲" : "▼"} Comments
                        </button>
                        {showComments[id] && (
                          <div className="comments-container" style={{ width: "100%", paddingLeft: 24 }}>
                            {/* Comments list */}
                            <div className="comments-list" style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
                              {renderComments(comments[id] || [], id)}
                            </div>
                            {/* New comment form */}
                            <div className="new-comment-form" style={{ display: "flex", gap: 8 }}>
                              <input
                                type="text"
                                placeholder="Add a comment..."
                                value={newComment[id] || ""}
                                onChange={(e) => setNewComment((prev) => ({ ...prev, [id]: e.target.value }))}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  border: "1px solid #333",
                                  background: "#23264A",
                                  color: "#fff",
                                }}
                              />
                              <button
                                className="add-comment-btn"
                                onClick={() => handleAddComment(id)}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: 8,
                                  border: "none",
                                  cursor: "pointer",
                                  background: "#A362EA",
                                  color: "#fff",
                                  fontWeight: 500,
                                  transition: "background 0.2s",
                                }}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p>No results found for "{searchTag}".</p>
            )}
          </div>
        )}
        {/* Main feed: show posts, related results, or a message */}
        <div
          className="feed feed-scrollable"
          style={{
            width: "550px",
            maxWidth: "550px",
            minWidth: "550px",
            margin: "0 auto",
          }}
        >
          {postsToShow.length > 0 ? (
            postsToShow.map((post, idx) => {
              const id = post.id ?? post._id ?? idx;
              const isBookmarked = bookmarkedPosts.some((b) => (b.id ?? b._id) === id);
              const expanded = expandedPosts[id];
              const content = post.content || "";
              // Always show all text if expanded, otherwise clamp to 10 lines
              return (
                <div
                  className={`post${expanded ? " expanded" : ""}`}
                  key={id}
                  style={{
                    width: "100%",
                    maxWidth: 530,
                    minWidth: 530,
                    margin: "0 auto",
                    wordBreak: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  <h3
                    style={{
                      wordBreak: "break-word",
                      whiteSpace: "normal",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    {post.title}
                  </h3>
                  <p
                    style={{
                      ...(expanded
                        ? { display: "block", overflow: "visible", WebkitLineClamp: "unset", maxHeight: "none" }
                        : {
                            display: "-webkit-box",
                            WebkitBoxOrient: "vertical",
                            WebkitLineClamp: 10,
                            overflow: "hidden",
                            maxHeight: "18em"
                          }),
                      textAlign: "left",
                      marginBottom: 0,
                      width: "100%",
                      wordBreak: "break-word",
                      whiteSpace: "pre-line", // Allow line breaks and wrapping
                    }}
                  >
                    {content}
                  </p>
                  {content.split(/\s+/).length > 60 && (
                    <span
                      className="show-more-less"
                      style={{ color: "#A362EA", cursor: "pointer", marginLeft: 8, fontWeight: 500 }}
                      onClick={() => setExpandedPosts((prev) => ({
                        ...prev,
                        [id]: !prev[id],
                      }))}
                    >
                      {expanded ? " Show less" : " Show more"}
                    </span>
                  )}
                  <div className="post-tags">
                    {post.tags && post.tags.map((tag, i) => (
                      <span className="post-tag" key={i}>#{tag}</span>
                    ))}
                  </div>
                  <div className="post-actions">
                    <button
                      className="post-like-btn"
                      onClick={() => handleLikePost(id)}
                      aria-label="Like post"
                    >
                      <FaHeart color={Array.isArray(post.likes) && post.likes.includes(userId) ? "#E63946" : "#ccc"} />
                      <span style={{ marginLeft: 6, color: "#C4C4C4", fontWeight: 500 }}>
                        {Array.isArray(post.likes) ? post.likes.length : 0}
                      </span>
                    </button>
                    <button
                      className="post-delete-btn"
                      onClick={() => handleDeleteClick(id)}
                      aria-label="Delete post"
                    >
                      <FaTrash color="#ccc" />
                    </button>
                  </div>
                  {/* Comments section - hidden by default */}
                  <div className="post-comments-section" style={{ marginTop: 16, width: "100%" }}>
                    <button
                      className="toggle-comments-btn"
                      onClick={() => toggleComments(id)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#A362EA",
                        fontSize: "1rem",
                        padding: 0,
                        margin: "0 0 12px 0",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {showComments[id] ? "▲" : "▼"} Comments
                    </button>
                    {showComments[id] && (
                      <div className="comments-container" style={{ width: "100%", paddingLeft: 24 }}>
                        {/* Comments list */}
                        <div className="comments-list" style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
                          {renderComments(comments[id] || [], id)}
                        </div>
                        {/* New comment form */}
                        <div className="new-comment-form" style={{ display: "flex", gap: 8 }}>
                          <input
                            type="text"
                            placeholder="Add a comment..."
                            value={newComment[id] || ""}
                            onChange={(e) => setNewComment((prev) => ({ ...prev, [id]: e.target.value }))}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: 8,
                              border: "1px solid #333",
                              background: "#23264A",
                              color: "#fff",
                            }}
                          />
                          <button
                            className="add-comment-btn"
                            onClick={() => handleAddComment(id)}
                            style={{
                              padding: "8px 16px",
                              borderRadius: 8,
                              border: "none",
                              cursor: "pointer",
                              background: "#A362EA",
                              color: "#fff",
                              fontWeight: 500,
                              transition: "background 0.2s",
                            }}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ textAlign: "center", color: "#666", padding: "32px 0" }}>
              {page === "home" && "Welcome to Space Anon! Share your thoughts with the world."}
              {page === "dashboard" && "You haven't created any posts yet."}
              {page === "bookmarks" && "No bookmarks yet. Find something interesting and bookmark it!"}
            </p>
          )}
        </div>
        {/* Add Post modal - always at the end of the main content */}
        {showAddPostModal && (
          <div className="add-post-modal">
            <div className="add-post-modal-content">
              <h2>Create a New Post</h2>
              {error && <p className="error-message">{error}</p>}
              <div className="add-post-form-group">
                <label htmlFor="post-title">
                  Title <span style={{ color: "#F48C8C" }}>*</span>
                </label>
                <input
                  id="post-title"
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  placeholder="Enter post title"
                  required
                />
              </div>
              <div className="add-post-form-group">
                <label htmlFor="post-content">
                  Content <span style={{ color: "#F48C8C" }}>*</span>
                </label>
                <textarea
                  id="post-content"
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  placeholder="What's on your mind?"
                  rows={8} // Make content space bigger
                  required
                  style={{ minHeight: 140, height: 180, maxHeight: 320 }}
                />
              </div>
              <div className="add-post-form-group">
                <label htmlFor="post-tags">
                  Tags <span style={{ color: "#C4C4C4", fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="post-tags"
                  type="text"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                  placeholder="e.g. thoughts, advice, vent (comma separated)"
                />
              </div>
              <div className="add-post-modal-actions">
                <button className="add-post-submit" onClick={handlePostSubmit}>
                  Submit
                </button>
                <button className="add-post-cancel" onClick={() => setShowAddPostModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete confirmation warning - always at the end */}
        {showDeleteWarning && (
          <div className="delete-warning-modal">
            <div className="delete-warning-content" style={{
              background: "#181C3A",
              borderRadius: 14,
              padding: "38px 32px 28px 32px",
              boxShadow: "0 4px 32px rgba(244,140,140,0.18)",
              color: "#fff",
              minWidth: 320,
              maxWidth: "90vw",
              textAlign: "center",
              position: "relative",
              border: "2px solid #A362EA"
            }}>
              <h2 style={{ color: "#F48C8C" }}>Confirm Delete</h2>
              <p style={{ color: "#fff" }}>Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="delete-warning-actions" style={{ display: "flex", justifyContent: "center", gap: 18 }}>
                <button
                  className="delete-warning-confirm"
                  onClick={handleConfirmDelete}
                  style={{
                    padding: "10px 28px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "#F48C8C",
                    color: "#fff",
                    transition: "background 0.2s, color 0.2s"
                  }}
                >
                  Yes, delete it
                </button>
                <button
                  className="delete-warning-cancel"
                  onClick={handleCancelDelete}
                  style={{
                    padding: "10px 28px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "#23264A",
                    color: "#fff",
                    transition: "background 0.2s, color 0.2s"
                  }}
                >
                  No, keep it
                </button>
              </div>
            </div>
          </div>
        )}
        <div style={{ position: "relative", display: "inline-block", margin: "16px 0 0 16px" }}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              position: "relative",
              fontSize: "1.6em",
              color: "#A362EA"
            }}
            aria-label="Show notifications"
          >
            <FaBell />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute",
                top: -6,
                right: -6,
                background: "#E63946",
                color: "#fff",
                borderRadius: "50%",
                fontSize: "0.8em",
                padding: "2px 6px",
                fontWeight: 700,
                minWidth: 18,
                textAlign: "center"
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div style={{
              position: "absolute",
              top: 32,
              left: 0,
              background: "#23264A",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
              minWidth: 260,
              zIndex: 100,
              maxHeight: 320,
              overflowY: "auto"
            }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid #444", fontWeight: 600 }}>
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div style={{ padding: 16, color: "#aaa" }}>No notifications</div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} style={{ padding: "10px 16px", borderBottom: "1px solid #333" }}>
                    {n.type === "reply" ? "Someone replied to your comment" : "Someone commented on your post"}
                    <div style={{ fontSize: "0.95em", color: "#A362EA", marginTop: 2 }}>
                      Post #{n.post_id} • Comment #{n.comment_id}
                    </div>
                    <div style={{ fontSize: "0.8em", color: "#888" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Feed;
