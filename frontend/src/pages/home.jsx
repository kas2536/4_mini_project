import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home({ currentUser }) {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tech");
  const [content, setContent] = useState("");

  // 1. Fetch posts with Express API
  const fetchPosts = async (cat) => {
    try {
      const url = cat && cat !== "All" 
        ? `http://localhost:5000/api/blogs?category=${cat}` 
        : "http://localhost:5000/api/blogs";

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  useEffect(() => {
    fetchPosts(selectedCategory);
  }, [selectedCategory]);

  // 2. Handle Publishing a New Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, category, body: content }),
        credentials: "include",
      });

      if (res.ok) {
        setTitle("");
        setContent("");
        setCategory("Tech");
        fetchPosts(selectedCategory); 
      }
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };

  // 3. Handle Deleting a Post
  const handleDelete = async (blogId) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/blogs/${blogId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setPosts(posts.filter((post) => post.blog_id !== blogId));
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  return (
    <div className="row g-4">
      {/* Left Column: Creation Form (Only visible if signed in) */}
      <div className="col-lg-4">
        {currentUser ? (
          <div className="card shadow-sm border-0 sticky-lg-top" style={{ top: "1.5rem" }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-pencil-square text-primary"></i> Create Blog Post
              </h5>
              <form onSubmit={handleCreatePost}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Blog Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Category</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="Tech">Tech</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Education">Education</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Content</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Write your content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button type="submit" className="btn btn-primary w-100 fw-bold">
                  Publish Post
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card shadow-sm border-0 bg-white p-4 text-center">
            <i className="bi bi-person-lock fs-1 text-secondary mb-2"></i>
            <h5 className="fw-bold">Sign in to Publish</h5>
            <p className="text-muted small">
              You must be signed in to create, edit, or delete blog posts.
            </p>
            <Link to="/signin" className="btn btn-primary btn-sm fw-bold">
              Sign In Now
            </Link>
          </div>
        )}
      </div>

      {/* Right Column: Blog Feed */}
      <div className="col-lg-8">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
          <h4 className="fw-bold m-0">Recent Posts</h4>

          {/* Category Filter */}
          <div className="d-flex align-items-center gap-2">
            <label className="form-label m-0 small fw-semibold text-secondary">Filter:</label>
            <select
              className="form-select form-select-sm w-auto"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Tech">Tech</option>
              <option value="Lifestyle">Lifestyle</option>
              <option value="Education">Education</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="alert alert-info border-0 shadow-sm text-center py-4">
            No posts found.
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {posts.map((post) => (
              <div key={post.blog_id} className="card shadow-sm border-0 blog-card">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary-subtle text-primary fw-semibold px-2.5 py-1">
                      {post.category}
                    </span>
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      {new Date(post.date_created).toLocaleString()}
                    </small>
                  </div>
                  <h5 className="card-title fw-bold text-dark mb-1">{post.title}</h5>
                  <p className="text-muted small mb-3">
                    By <span className="fw-medium text-dark">{post.creator_name} (@{post.creator_user_id})</span>
                  </p>
                  <p className="card-text text-secondary mb-4">{post.body}</p>

                  {/* Row-Level Ownership Check */}
                  {currentUser && currentUser.user_id === post.creator_user_id && (
                    <div className="d-flex gap-2 justify-content-end border-top pt-3">
                      <Link
                        to={`/posts/${post.blog_id}/edit`}
                        className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                      >
                        <i className="bi bi-pencil"></i> Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(post.blog_id)}
                        className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                      >
                        <i className="bi bi-trash"></i> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}