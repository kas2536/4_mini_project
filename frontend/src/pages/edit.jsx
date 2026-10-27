import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

export default function EditPost() {
  const { id } = useParams(); 
  const navigate = useNavigate();

  // Form input state
  const [author, setAuthor] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tech");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Fetch current post data to pre-fill the form
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/blogs/${id}`, {
          credentials: "include",
        });

        if (!res.ok) {
          setError("Failed to load post data.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setAuthor(data.author || data.creator_name || "");
        setTitle(data.title || "");
        setCategory(data.category || "Tech");
        setContent(data.content || data.body || "");
        setLoading(false);
      } catch (err) {
        console.error("Error fetching post:", err);
        setError("Network error loading post.");
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // 2. Submit updated post via PUT request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`http://localhost:5000/api/blogs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, title, category, body: content }),
        credentials: "include", // Keeps express-session auth working
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update post.");
        return;
      }

      // Redirect back to home feed after successful update
      navigate("/");
    } catch (err) {
      console.error("Error updating post:", err);
      setError("Network error updating post.");
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading post details...</div>;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <h3 className="card-title fw-bold mb-3">Edit Blog Post</h3>

            {error && <div className="alert alert-danger py-2">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Creator Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Category</label>
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
                <label className="form-label">Blog Content</label>
                <textarea
                  className="form-control"
                  rows="6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                ></textarea>
              </div>
              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary fw-bold flex-grow-1">
                  Update Post
                </button>
                <Link to="/" className="btn btn-outline-secondary">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}