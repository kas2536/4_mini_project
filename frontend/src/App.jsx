import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "./layout";
import Home from "./pages/home";
import SignIn from "./pages/signIn";
import SignUp from "./pages/signUp.jsx";
import EditPost from "./pages/edit";

function AppRoutes() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Check if user is already logged in when the React app loads
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/me", {
          credentials: "include", 
        });
        const data = await res.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Error checking session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // 2. Handle Sign Out 
  const handleSignOut = async () => {
    try {
      await fetch("http://localhost:5000/api/signout", {
        method: "POST",
        credentials: "include",
      });
      setCurrentUser(null);
      navigate("/signin");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading DevBlog...</div>;
  }

  return (
    <Routes>
      {/* Parent route renders persistent Navbar and Footer via Layout */}
      <Route
        path="/"
        element={
          <Layout currentUser={currentUser} onSignOut={handleSignOut} />
        }
      >
        <Route index element={<Home currentUser={currentUser} />} />
        <Route
          path="signin"
          element={<SignIn setCurrentUser={setCurrentUser} />}
        />
        <Route
          path="signup"
          element={<SignUp setCurrentUser={setCurrentUser} />}
        />
        <Route path="posts/:id/edit" element={<EditPost />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}