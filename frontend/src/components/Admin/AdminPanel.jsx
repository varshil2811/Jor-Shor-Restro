import { useState, useEffect, useRef } from "react";
import "./AdminPanel.css";
import {
  LayoutDashboard,
  UtensilsCrossed,
  ImagePlus,
  CalendarCheck,
  MessageSquare,
  Trash2,
  X,
  Pencil,
  Plus,
  LogOut,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Users,
  Star,
  ChevronRight,
  Menu as MenuIcon,
  TrendingUp,
  AlertCircle,
  Flame,
  Leaf,
  Film,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─── tiny helpers ─────────────────────────────── */
const Toast = ({ msg, onClose }) => (
  <div className="ap-toast" onClick={onClose}>
    <AlertCircle size={18} /> {msg}
    <button className="ap-toast-close">
      <X size={14} />
    </button>
  </div>
);

const StatCard = ({ icon, label, value, accent }) => (
  <div className={`ap-stat-card ap-stat-${accent}`}>
    <div className="ap-stat-icon">{icon}</div>
    <div className="ap-stat-body">
      <span className="ap-stat-value">{value}</span>
      <span className="ap-stat-label">{label}</span>
    </div>
  </div>
);

/* ─── main component ────────────────────────────── */
const AdminPanel = () => {
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || null,
  );
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [reels, setReels] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const prevPendingRef = useRef(-1);

  /* form state */
  const [form, setForm] = useState({
    category: "SOUP",
    name: "",
    desc: "",
    price: "",
    type: "veg",
    spice: 0,
  });
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryPreview, setGalleryPreview] = useState(null);
  const [reelFile, setReelFile] = useState(null);
  const [reelPreview, setReelPreview] = useState(null);
  const [reelTitle, setReelTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  /* menu pdf state */
  const [menuPdfFile, setMenuPdfFile] = useState(null);
  const [menuPdfUrl, setMenuPdfUrl] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  /* ── fetchers ── */
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchMenu = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/admin/menu`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP error! status: ${res.status} - ${errText}`);
      }
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {
      console.error("fetchMenu failed:", err);
      throw err;
    }
  };
  const fetchCategories = async () => {
    const res = await fetch(`${API_URL}/categories`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setCategories(await res.json());
  };
  const fetchGallery = async () => {
    const res = await fetch(`${API_URL}/gallery`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setGallery(await res.json());
  };
  const fetchReels = async () => {
    const res = await fetch(`${API_URL}/reels`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setReels(await res.json());
  };
  const fetchReservations = async (silent = false) => {
    if (!token) return;
    const res = await fetch(`${API_URL}/reservations`, {
      headers: getAuthHeaders(),
      cache: 'no-store'
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const pending = data.filter((r) => r.status === "Pending").length;
    if (
      silent &&
      prevPendingRef.current !== -1 &&
      pending > prevPendingRef.current
    ) {
      showToast("🛎️ New Reservation Request!");
    }
    prevPendingRef.current = pending;
    setReservations(data);
  };
  const fetchReviews = async () => {
    const res = await fetch(`${API_URL}/reviews`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    setReviews(await res.json());
  };
  const fetchMenuPdf = async () => {
    try {
      const res = await fetch(`${API_URL}/settings/menu_pdf`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setMenuPdfUrl(data.value);
      }
    } catch (err) {
      console.log('No menu PDF setting found');
    }
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setFetchError("");
        await Promise.all([
          fetchMenu(),
          fetchCategories(),
          fetchGallery(),
          fetchReels(),
          fetchReservations(),
          fetchReviews(),
          fetchMenuPdf(),
        ]);
      } catch (error) {
        console.error("Error loading admin data:", error);
        setFetchError(error.message || "Failed to load admin data");
        if (error.message && error.message.includes("401")) {
          setToken(null);
          localStorage.removeItem("adminToken");
        }
      } finally {
        setLoading(false);
      }
    })();
    const id = setInterval(() => fetchReservations(true), 10000);
    return () => clearInterval(id);
  }, [token]);

  /* ── derived counts ── */
  const pendingRes = reservations.filter((r) => r.status === "Pending").length;
  const pendingRev = reviews.filter((r) => r.status === "Pending").length;
  const confirmedRes = reservations.filter(
    (r) => r.status === "Confirmed",
  ).length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  /* ── menu handlers ── */
  const handleFormChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleImgChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    setImgPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm({
      category: "SOUP",
      name: "",
      desc: "",
      price: "",
      type: "veg",
      spice: 0,
    });
    setImgFile(null);
    setImgPreview(null);
    setEditingId(null);
    const el = document.getElementById("img-upload");
    if (el) el.value = "";
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.name.trim() || !form.desc.trim() || !form.price.trim()) {
      alert("Please fill in all required fields (Category, Name, Description, Price).");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imgFile) fd.append("image", imgFile);
      const url = editingId
        ? `${API_URL}/menu/${editingId}`
        : `${API_URL}/menu`;
      const meth = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method: meth,
        headers: getAuthHeaders(),
        body: fd,
      });
      if (!res.ok) {
        let errStr = "Failed to save menu item";
        try {
          const errData = await res.json();
          if (errData.error) errStr = errData.error;
        } catch (e) {}
        throw new Error(errStr);
      }
      const data = await res.json();
      if (!editingId) {
        setMenuItems(prev => [data, ...prev]);
      } else {
        setMenuItems(prev => prev.map((m) => (m._id === editingId ? data : m)));
      }
      showToast(editingId ? "✅ Item updated!" : "✅ Item added!");
      resetForm();
      fetchMenu();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim().toUpperCase() }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add category");
      }
      showToast("✅ Category added!");
      setNewCategoryName("");
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete category");
      showToast("🗑 Category deleted!");
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMenuPdfSubmit = async (e) => {
    e.preventDefault();
    if (!menuPdfFile) {
      showToast("⚠️ Please select a PDF file first");
      return;
    }
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append("pdf", menuPdfFile);
      const res = await fetch(`${API_URL}/settings/menu-pdf`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });
      if (!res.ok) throw new Error("Failed to upload Menu PDF");
      const data = await res.json();
      setMenuPdfUrl(data.value);
      setMenuPdfFile(null);
      const el = document.getElementById("menu-pdf-upload");
      if (el) el.value = "";
      showToast("✅ Menu PDF uploaded successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      category: item.category,
      name: item.name,
      desc: item.desc,
      price: item.price,
      type: item.type,
      spice: item.spice,
    });
    setIsNewCategory(false);
    setImgPreview(
      item.imageUrl
        ? item.imageUrl.startsWith("http")
          ? item.imageUrl
          : `http://localhost:5000/uploads/${item.imageUrl}`
        : null,
    );
    setImgFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteMenu = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    await fetch(`${API_URL}/menu/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    showToast("🗑️ Item deleted");
    fetchMenu();
  };

  /* ── gallery handlers ── */
  const handleGalleryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGalleryFile(file);
    setGalleryPreview(URL.createObjectURL(file));
  };

  const handleGalleryUpload = async (e) => {
    e.preventDefault();
    if (!galleryFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", galleryFile);
      await fetch(`${API_URL}/gallery`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });
      showToast("✅ Image uploaded!");
      setGalleryFile(null);
      setGalleryPreview(null);
      const el = document.getElementById("gallery-upload");
      if (el) el.value = "";
      fetchGallery();
    } catch {
      showToast("❌ Upload failed");
    }
    setUploading(false);
  };

  const handleDeleteGallery = async (id) => {
    if (!confirm("Delete this image?")) return;
    await fetch(`${API_URL}/gallery/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    showToast("🗑️ Image deleted");
    fetchGallery();
  };

  /* ── reel handlers ── */
  const handleReelFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReelFile(file);
    setReelPreview(URL.createObjectURL(file));
  };

  const handleReelUpload = async (e) => {
    e.preventDefault();
    if (!reelFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("video", reelFile);
      if (reelTitle) fd.append("title", reelTitle);
      await fetch(`${API_URL}/reels`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });
      showToast("✅ Reel uploaded!");
      setReelFile(null);
      setReelPreview(null);
      setReelTitle("");
      const el = document.getElementById("reel-upload");
      if (el) el.value = "";
      fetchReels();
    } catch {
      showToast("❌ Upload failed");
    }
    setUploading(false);
  };

  const handleDeleteReel = async (id) => {
    if (!confirm("Delete this reel?")) return;
    await fetch(`${API_URL}/reels/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    showToast("🗑️ Reel deleted");
    fetchReels();
  };

  /* ── reservation handlers ── */
  const handleConfirmRes = async (id) => {
    await fetch(`${API_URL}/reservations/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Confirmed" }),
    });
    showToast("✅ Reservation confirmed & email sent!");
    setReservations((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: "Confirmed" } : r)),
    );
  };

  const handleDeleteRes = async (id) => {
    if (!confirm("Delete this reservation?")) return;
    await fetch(`${API_URL}/reservations/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    showToast("🗑️ Reservation deleted");
    setReservations((prev) => prev.filter((r) => r._id !== id));
  };

  /* ── review handlers ── */
  const handleApproveReview = async (id) => {
    await fetch(`${API_URL}/reviews/${id}`, {
      method: "PUT",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Approved" }),
    });
    showToast("✅ Review approved!");
    setReviews((prev) =>
      prev.map((r) => (r._id === id ? { ...r, status: "Approved" } : r)),
    );
  };

  const handleDeleteReview = async (id) => {
    if (!confirm("Delete this review?")) return;
    await fetch(`${API_URL}/reviews/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    showToast("🗑️ Review deleted");
    setReviews((prev) => prev.filter((r) => r._id !== id));
  };

  const navItems = [
    {
      key: "dashboard",
      icon: <LayoutDashboard size={18} />,
      label: "Dashboard",
    },
    {
      key: "menu",
      icon: <UtensilsCrossed size={18} />,
      label: "Menu Management",
    },
    { key: "gallery", icon: <ImagePlus size={18} />, label: "Gallery" },
    { key: "reels", icon: <Film size={18} />, label: "Reels / Shorts" },
    {
      key: "reservations",
      icon: <CalendarCheck size={18} />,
      label: "Reservations",
      badge: pendingRes,
    },
    {
      key: "reviews",
      icon: <MessageSquare size={18} />,
      label: "Reviews",
      badge: pendingRev,
    },
  ];

  const navigate = (key) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        localStorage.setItem("adminToken", data.token);
      } else {
        setLoginError("Invalid username or password");
      }
    } catch {
      setLoginError("Login failed. Server error.");
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("adminToken");
  };

  if (!token) {
    return (
      <div
        className="ap-root"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <div
          className="ap-card"
          style={{ maxWidth: 400, width: "90%", padding: "2rem" }}
        >
          <h2
            style={{
              color: "var(--ap-text)",
              textAlign: "center",
              marginBottom: "1.5rem",
            }}
          >
            Admin Login
          </h2>
          {loginError && (
            <div
              className="ap-sub"
              style={{
                color: "var(--ap-red)",
                textAlign: "center",
                marginBottom: "1rem",
              }}
            >
              {loginError}
            </div>
          )}
          <form className="ap-form" onSubmit={handleLogin}>
            <div className="ap-field">
              <label>Username</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
              />
            </div>
            <div className="ap-field">
              <label>Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
              />
            </div>
            <button
              type="submit"
              className="ap-btn ap-btn-primary"
              style={{ marginTop: "1rem" }}
            >
              Login
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <Link to="/" className="ap-link">
              ← Back to Main Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="ap-full-loader">
        <div className="ap-loader-ring" />
        <p>Loading Admin Panel…</p>
      </div>
    );

  /* ════════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div className="ap-root">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* overlay */}
      {sidebarOpen && (
        <div className="ap-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`ap-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="ap-brand">
          <div className="ap-brand-logo">JS</div>
          <div>
            <div className="ap-brand-name">Jor Shor</div>
            <div className="ap-brand-sub">Admin Panel</div>
          </div>
          <button
            className="ap-icon-btn ap-sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="ap-nav">
          {navItems.map(({ key, icon, label, badge }) => (
            <button
              key={key}
              className={`ap-nav-item ${activeTab === key ? "active" : ""}`}
              onClick={() => navigate(key)}
            >
              <span className="ap-nav-icon">{icon}</span>
              <span className="ap-nav-label">{label}</span>
              {badge > 0 && <span className="ap-badge">{badge}</span>}
              <ChevronRight size={14} className="ap-nav-arrow" />
            </button>
          ))}
        </nav>

        <div className="ap-sidebar-footer">
          <button
            className="ap-exit-btn"
            onClick={handleLogout}
            style={{
              width: "100%",
              marginBottom: "0.5rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              textAlign: "left",
            }}
          >
            <LogOut size={16} /> Logout Admin
          </button>
          <Link to="/" className="ap-exit-btn">
            <X size={16} /> Exit to Site
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="ap-main">
        {/* topbar */}
        <header className="ap-topbar">
          <button
            className="ap-icon-btn ap-menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon size={22} />
          </button>
          <h1 className="ap-page-title">
            {navItems.find((n) => n.key === activeTab)?.label}
          </h1>
          <div className="ap-topbar-right">
            <div className="ap-avatar">A</div>
          </div>
        </header>

        <div className="ap-body">
          {/* ══════════ DASHBOARD ══════════ */}
          {activeTab === "dashboard" && (
            <div className="ap-fade">
              <div className="ap-stats-grid">
                <StatCard
                  icon={<UtensilsCrossed size={22} />}
                  label="Menu Items"
                  value={menuItems.length}
                  accent="gold"
                />
                <StatCard
                  icon={<ImagePlus size={22} />}
                  label="Gallery Photos"
                  value={gallery.length}
                  accent="blue"
                />
                <StatCard
                  icon={<Clock size={22} />}
                  label="Pending Bookings"
                  value={pendingRes}
                  accent="amber"
                />
                <StatCard
                  icon={<Star size={22} />}
                  label="Avg Rating"
                  value={avgRating}
                  accent="green"
                />
              </div>

              <div className="ap-dash-grid">
                {/* recent reservations */}
                <div className="ap-card">
                  <div className="ap-card-head">
                    <h3>Recent Reservations</h3>
                    <button
                      className="ap-link"
                      onClick={() => navigate("reservations")}
                    >
                      View all
                    </button>
                  </div>
                  {reservations.slice(0, 5).map((r) => (
                    <div key={r._id} className="ap-dash-row">
                      <div className="ap-dash-avatar">{r.name[0]}</div>
                      <div className="ap-dash-info">
                        <strong>{r.name}</strong>
                        <span>
                          {r.date} · {r.time} · {r.guests} guests
                        </span>
                      </div>
                      <span
                        className={`ap-pill ${r.status === "Confirmed" ? "ap-pill-green" : "ap-pill-amber"}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                  {reservations.length === 0 && (
                    <p className="ap-empty">No reservations yet.</p>
                  )}
                </div>

                {/* recent reviews */}
                <div className="ap-card">
                  <div className="ap-card-head">
                    <h3>Recent Reviews</h3>
                    <button
                      className="ap-link"
                      onClick={() => navigate("reviews")}
                    >
                      View all
                    </button>
                  </div>
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r._id} className="ap-dash-row">
                      <div className="ap-dash-avatar">{r.name[0]}</div>
                      <div className="ap-dash-info">
                        <strong>{r.name}</strong>
                        <span>
                          {"★".repeat(r.rating)}
                          {"☆".repeat(5 - r.rating)} — {r.text.slice(0, 50)}
                          {r.text.length > 50 ? "…" : ""}
                        </span>
                      </div>
                      <span
                        className={`ap-pill ${r.status === "Approved" ? "ap-pill-green" : "ap-pill-amber"}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                  {reviews.length === 0 && (
                    <p className="ap-empty">No reviews yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ MENU ══════════ */}
          {activeTab === "menu" && (
            <div className="ap-fade ap-two-col">
              {/* left column: forms */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {/* menu pdf upload form */}
                <div className="ap-card">
                  <h3 className="ap-card-title">
                    <Plus size={16} /> Manage Full PDF Menu
                  </h3>
                  <div style={{ marginBottom: '1rem', color: 'var(--ap-text-muted)', fontSize: '0.9rem' }}>
                    Upload a custom PDF menu for visitors to download. If not uploaded, a PDF will be generated automatically.
                  </div>
                  {menuPdfUrl && (
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Current PDF:</strong> <a href={menuPdfUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--ap-gold)' }}>View Uploaded PDF</a>
                    </div>
                  )}
                  <form
                    onSubmit={handleMenuPdfSubmit}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center"
                    }}
                  >
                    <input
                      id="menu-pdf-upload"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setMenuPdfFile(e.target.files[0])}
                      className="ap-custom-file-input"
                    />
                    <button 
                      type="submit" 
                      className="ap-btn ap-btn-primary" 
                      disabled={uploadingPdf}
                      style={{ padding: "0.6rem 1.5rem", whiteSpace: "nowrap" }}
                    >
                      {uploadingPdf ? "Uploading..." : "Upload PDF"}
                    </button>
                  </form>
                </div>

                {/* manage categories form */}
                <div className="ap-card">
                  <h3 className="ap-card-title">
                    <Plus size={16} /> Manage Categories
                  </h3>
                  <form
                    onSubmit={handleAddCategory}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      marginBottom: "1.5rem",
                      alignItems: "center"
                    }}
                  >
                    <input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                      placeholder="New Category (e.g. DESSERT)"
                      style={{ 
                        flex: 1, 
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid var(--ap-input-border)",
                        backgroundColor: "var(--ap-input-bg)",
                        color: "var(--ap-text)"
                      }}
                    />
                    <button 
                      type="submit" 
                      className="ap-btn ap-btn-primary" 
                      style={{ padding: "0.6rem 1.5rem", whiteSpace: "nowrap" }}
                    >
                      Add
                    </button>
                  </form>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                  >
                    {categories.map((c) => (
                      <div
                        key={c._id}
                        className="ap-pill"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.6rem",
                          backgroundColor: "var(--ap-bg-darker)",
                          color: "var(--ap-gold)",
                          border: "1px solid var(--ap-gold)",
                          padding: "0.5rem 1rem",
                          borderRadius: "20px",
                          fontSize: "0.9rem",
                          fontWeight: "600"
                        }}
                      >
                        {c.name}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c._id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--ap-text-muted)",
                            padding: 0,
                            display: "flex",
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <span className="ap-empty" style={{ margin: 0 }}>
                        No categories yet.
                      </span>
                    )}
                  </div>
                </div>

                {/* add/edit item form */}
                <div className="ap-card">
                  <h3 className="ap-card-title">
                    {editingId ? (
                      <>
                        <Pencil size={16} /> Edit Item
                      </>
                    ) : (
                      <>
                        <Plus size={16} /> Add New Item
                      </>
                    )}
                  </h3>
                  <form onSubmit={handleMenuSubmit} className="ap-form">
                    <div className="ap-form-row">
                      <div className="ap-field">
                        <label>Category</label>
                        <select
                          name="category"
                          value={form.category}
                          onChange={handleFormChange}
                          required
                          style={{ width: "100%" }}
                        >
                          <option value="" disabled>
                            Select Category
                          </option>
                          {categories.map((c) => (
                            <option key={c._id} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="ap-field">
                        <label>Item Name</label>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          required
                          placeholder="Item name"
                        />
                      </div>
                    </div>

                    <div className="ap-field">
                      <label>Description</label>
                      <textarea
                        name="desc"
                        value={form.desc}
                        onChange={handleFormChange}
                        required
                        rows="3"
                        placeholder="Short description…"
                      />
                    </div>

                    <div className="ap-form-row-three">
                      <div className="ap-field">
                        <label>Price</label>
                        <input
                          name="price"
                          value={form.price}
                          onChange={handleFormChange}
                          required
                          placeholder="e.g. ₹250"
                        />
                      </div>
                      <div className="ap-field">
                        <label>Type</label>
                        <select
                          name="type"
                          value={form.type}
                          onChange={handleFormChange}
                        >
                          <option value="veg">🟢 Vegetarian</option>
                          <option value="non-veg">🔴 Non-Vegetarian</option>
                        </select>
                      </div>
                      <div className="ap-field">
                        <label>Spice (0–3)</label>
                        <select
                          name="spice"
                          value={form.spice}
                          onChange={handleFormChange}
                        >
                          <option value={0}>None</option>
                          <option value={1}>🌶 Mild</option>
                          <option value={2}>🌶🌶 Medium</option>
                          <option value={3}>🌶🌶🌶 Hot</option>
                        </select>
                      </div>
                    </div>

                    <div className="ap-field">
                      <label>Item Image</label>
                      <div className="ap-file-zone">
                        {imgPreview ? (
                          <div className="ap-img-preview-wrap">
                            <img
                              src={imgPreview}
                              alt="preview"
                              className="ap-img-preview"
                            />
                            <button
                              type="button"
                              className="ap-img-clear"
                              onClick={() => {
                                setImgFile(null);
                                setImgPreview(null);
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <label htmlFor="img-upload" className="ap-file-label">
                            <ImageIcon size={28} />
                            <span>Click to choose image</span>
                          </label>
                        )}
                        <input
                          type="file"
                          id="img-upload"
                          accept="image/*"
                          onChange={handleImgChange}
                          style={{ display: "none" }}
                        />
                      </div>
                    </div>

                    <div className="ap-form-actions">
                      <button
                        type="submit"
                        className="ap-btn ap-btn-primary"
                        disabled={saving}
                      >
                        {saving
                          ? "Saving…"
                          : editingId
                            ? "Update Item"
                            : "Add Item"}
                      </button>
                      {editingId && (
                        <button
                          type="button"
                          className="ap-btn ap-btn-ghost"
                          onClick={resetForm}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* right column: table */}
              <div className="ap-card">
                <h3 className="ap-card-title">
                  <UtensilsCrossed size={16} /> Menu Items ({menuItems.length})
                </h3>
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Type</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {menuItems.map((item) => (
                        <tr key={item._id}>
                          <td>
                            <div className="ap-item-cell">
                              <div className="ap-item-thumb">
                                {item.imageUrl ? (
                                  <img
                                    src={
                                      item.imageUrl.startsWith("http")
                                        ? item.imageUrl
                                        : `http://localhost:5000/uploads/${item.imageUrl}`
                                    }
                                    alt={item.name}
                                  />
                                ) : (
                                  <ImageIcon size={18} />
                                )}
                              </div>
                              <div>
                                <strong>{item.name}</strong>
                                <span className="ap-sub">
                                  {item.desc?.slice(0, 40)}
                                  {item.desc?.length > 40 ? "…" : ""}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="ap-tag">{item.category}</span>
                          </td>
                          <td>
                            <strong>
                              ₹{String(item.price).replace(/[^0-9.]/g, "")}
                            </strong>
                          </td>
                          <td>
                            {item.type === "veg" ? (
                              <span className="ap-pill ap-pill-green">Veg</span>
                            ) : (
                              <span className="ap-pill ap-pill-red">
                                Non-Veg
                              </span>
                            )}
                          </td>
                          <td>
                            <div className="ap-actions">
                              <button
                                className="ap-icon-btn ap-edit-btn"
                                onClick={() => handleEdit(item)}
                                title="Edit"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                className="ap-icon-btn ap-del-btn"
                                onClick={() => handleDeleteMenu(item._id)}
                                title="Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {menuItems.length === 0 && (
                        <tr>
                          <td colSpan="5" className="ap-empty-row">
                            No items yet. Add one!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════ GALLERY ══════════ */}
          {activeTab === "gallery" && (
            <div className="ap-fade ap-two-col">
              <div className="ap-card">
                <h3 className="ap-card-title">
                  <ImagePlus size={16} /> Upload New Photo
                </h3>
                <form onSubmit={handleGalleryUpload} className="ap-form">
                  <div className="ap-field">
                    <div className="ap-file-zone">
                      {galleryPreview ? (
                        <div className="ap-img-preview-wrap">
                          <img
                            src={galleryPreview}
                            alt="preview"
                            className="ap-img-preview"
                          />
                          <button
                            type="button"
                            className="ap-img-clear"
                            onClick={() => {
                              setGalleryFile(null);
                              setGalleryPreview(null);
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="gallery-upload"
                          className="ap-file-label"
                        >
                          <ImageIcon size={32} />
                          <span>Click to choose a photo</span>
                          <small>JPG, PNG, WEBP</small>
                        </label>
                      )}
                      <input
                        type="file"
                        id="gallery-upload"
                        accept="image/*"
                        onChange={handleGalleryFileChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                  <div className="ap-form-actions">
                    <button
                      type="submit"
                      className="ap-btn ap-btn-primary"
                      disabled={uploading || !galleryFile}
                    >
                      {uploading ? "Uploading…" : "Upload Photo"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="ap-card">
                <h3 className="ap-card-title">
                  <ImageIcon size={16} /> Gallery Photos ({gallery.length})
                </h3>
                <div className="ap-gallery-grid">
                  {gallery.map((img) => (
                    <div key={img.id} className="ap-gallery-item">
                      <img src={img.url} alt="gallery" />
                      <div className="ap-gallery-overlay">
                        <button
                          className="ap-icon-btn ap-del-btn"
                          onClick={() => handleDeleteGallery(img.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="ap-gallery-empty">
                      <ImageIcon size={40} />
                      <p>No photos yet. Upload some!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ REELS ══════════ */}
          {activeTab === "reels" && (
            <div className="ap-fade ap-two-col">
              <div className="ap-card">
                <h3 className="ap-card-title">
                  <Film size={16} /> Upload New Reel
                </h3>
                <form onSubmit={handleReelUpload} className="ap-form">
                  <div className="ap-field">
                    <label>Caption / Title (Optional)</label>
                    <input
                      type="text"
                      value={reelTitle}
                      onChange={(e) => setReelTitle(e.target.value)}
                      placeholder="e.g. Our new Special Biryani!"
                    />
                  </div>
                  <div className="ap-field">
                    <div className="ap-file-zone">
                      {reelPreview ? (
                        <div
                          className="ap-img-preview-wrap"
                          style={{ aspectRatio: "9/16" }}
                        >
                          <video
                            src={reelPreview}
                            className="ap-img-preview"
                            muted
                            autoPlay
                            loop
                            playsInline
                            style={{ objectFit: "cover" }}
                          />
                          <button
                            type="button"
                            className="ap-img-clear"
                            onClick={() => {
                              setReelFile(null);
                              setReelPreview(null);
                            }}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="reel-upload" className="ap-file-label">
                          <Film size={32} />
                          <span>Click to choose a video</span>
                          <small>MP4, MOV (9:16 portrait recommended)</small>
                        </label>
                      )}
                      <input
                        type="file"
                        id="reel-upload"
                        accept="video/*"
                        onChange={handleReelFileChange}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                  <div className="ap-form-actions">
                    <button
                      type="submit"
                      className="ap-btn ap-btn-primary"
                      disabled={uploading || !reelFile}
                    >
                      {uploading
                        ? "Uploading… (This may take a minute)"
                        : "Upload Reel"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="ap-card">
                <h3 className="ap-card-title">
                  <Film size={16} /> Uploaded Reels ({reels.length})
                </h3>
                <div
                  className="ap-gallery-grid"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(120px, 1fr))",
                  }}
                >
                  {reels.map((reel) => (
                    <div
                      key={reel.id}
                      className="ap-gallery-item"
                      style={{ aspectRatio: "9/16" }}
                    >
                      <video
                        src={reel.url}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        muted
                        loop
                        playsInline
                      />
                      <div className="ap-gallery-overlay">
                        <button
                          className="ap-icon-btn ap-del-btn"
                          onClick={() => handleDeleteReel(reel.id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {reels.length === 0 && (
                    <div
                      className="ap-gallery-empty"
                      style={{ gridColumn: "1 / -1" }}
                    >
                      <Film size={40} />
                      <p>No reels yet. Upload some!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════ RESERVATIONS ══════════ */}
          {activeTab === "reservations" && (
            <div className="ap-fade">
              <div className="ap-stats-grid ap-stats-sm">
                <StatCard
                  icon={<Clock size={18} />}
                  label="Pending"
                  value={pendingRes}
                  accent="amber"
                />
                <StatCard
                  icon={<CheckCircle size={18} />}
                  label="Confirmed"
                  value={confirmedRes}
                  accent="green"
                />
                <StatCard
                  icon={<Users size={18} />}
                  label="Total"
                  value={reservations.length}
                  accent="blue"
                />
              </div>

              <div className="ap-card">
                <h3 className="ap-card-title">
                  <CalendarCheck size={16} /> All Reservations
                </h3>
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Guest</th>
                        <th>Date & Time</th>
                        <th>Guests</th>
                        <th>Special Requests</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((r) => (
                        <tr key={r._id} onClick={() => setSelectedReservation(r)} className="ap-table-row-clickable" style={{ cursor: "pointer" }}>
                          <td>
                            <div className="ap-item-cell">
                              <div className="ap-dash-avatar">{r.name[0]}</div>
                              <div>
                                <strong>{r.name}</strong>
                                <span className="ap-sub">{r.phone}</span>
                                {r.email && (
                                  <span className="ap-sub">{r.email}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{r.date}</strong>
                            <span className="ap-sub">{r.time}</span>
                          </td>
                          <td>
                            <span className="ap-tag">{r.guests} pax</span>
                          </td>
                          <td>
                            <span
                              className="ap-sub"
                              style={{
                                maxWidth: "180px",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.requests || "—"}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ap-pill ${r.status === "Confirmed" ? "ap-pill-green" : "ap-pill-amber"}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td>
                            <div className="ap-actions">
                              {r.status === "Pending" && (
                                <button
                                  className="ap-icon-btn ap-confirm-btn"
                                  onClick={(e) => { e.stopPropagation(); handleConfirmRes(r._id); }}
                                  title="Confirm"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button
                                className="ap-icon-btn ap-del-btn"
                                onClick={(e) => { e.stopPropagation(); handleDeleteRes(r._id); }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {reservations.length === 0 && (
                        <tr>
                          <td colSpan="6" className="ap-empty-row">
                            No reservations yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal for Reservation Details */}
              {selectedReservation && (
                <div className="ap-modal-overlay" onClick={() => setSelectedReservation(null)}>
                  <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="ap-modal-header">
                      <h3>Reservation Details</h3>
                      <button className="ap-modal-close" onClick={() => setSelectedReservation(null)}>
                        <X size={20} />
                      </button>
                    </div>
                    <div className="ap-modal-body">
                      <div className="ap-modal-row"><span>Name:</span> <strong>{selectedReservation.name}</strong></div>
                      <div className="ap-modal-row"><span>Phone:</span> <strong>{selectedReservation.phone}</strong></div>
                      {selectedReservation.email && <div className="ap-modal-row"><span>Email:</span> <strong>{selectedReservation.email}</strong></div>}
                      <div className="ap-modal-row"><span>Date:</span> <strong>{selectedReservation.date}</strong></div>
                      <div className="ap-modal-row"><span>Time:</span> <strong>{selectedReservation.time}</strong></div>
                      <div className="ap-modal-row"><span>Guests:</span> <strong>{selectedReservation.guests} pax</strong></div>
                      <div className="ap-modal-row"><span>Status:</span> <strong className={`ap-pill ${selectedReservation.status === "Confirmed" ? "ap-pill-green" : "ap-pill-amber"}`}>{selectedReservation.status}</strong></div>
                      <div className="ap-modal-row" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none' }}>
                        <span>Special Requests:</span>
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--ap-input-bg)', borderRadius: '8px', width: '100%', color: 'var(--ap-text)' }}>
                          {selectedReservation.requests || "No special requests"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════ REVIEWS ══════════ */}
          {activeTab === "reviews" && (
            <div className="ap-fade">
              <div className="ap-stats-grid ap-stats-sm">
                <StatCard
                  icon={<Star size={18} />}
                  label="Avg Rating"
                  value={avgRating}
                  accent="gold"
                />
                <StatCard
                  icon={<Clock size={18} />}
                  label="Pending"
                  value={pendingRev}
                  accent="amber"
                />
                <StatCard
                  icon={<CheckCircle size={18} />}
                  label="Approved"
                  value={reviews.filter((r) => r.status === "Approved").length}
                  accent="green"
                />
              </div>

              <div className="ap-card">
                <h3 className="ap-card-title">
                  <MessageSquare size={16} /> Customer Reviews
                </h3>
                <div className="ap-table-wrap">
                  <table className="ap-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Rating</th>
                        <th>Review</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviews.map((r) => (
                        <tr key={r._id} onClick={() => setSelectedReview(r)} className="ap-table-row-clickable" style={{ cursor: "pointer" }}>
                          <td>
                            <div className="ap-item-cell">
                              <div className="ap-dash-avatar">{r.name[0]}</div>
                              <strong>{r.name}</strong>
                            </div>
                          </td>
                          <td>
                            <div className="ap-stars">
                              {"★".repeat(r.rating)}
                              {"☆".repeat(5 - r.rating)}
                            </div>
                          </td>
                          <td>
                            <span
                              className="ap-sub"
                              style={{
                                maxWidth: "220px",
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {r.text}
                            </span>
                          </td>
                          <td>
                            <span className="ap-sub">
                              {new Date(r.createdAt).toLocaleDateString(
                                "en-IN",
                              )}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`ap-pill ${r.status === "Approved" ? "ap-pill-green" : "ap-pill-amber"}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td>
                            <div className="ap-actions">
                              {r.status === "Pending" && (
                                <button
                                  className="ap-icon-btn ap-confirm-btn"
                                  onClick={(e) => { e.stopPropagation(); handleApproveReview(r._id); }}
                                  title="Approve"
                                >
                                  <CheckCircle size={16} />
                                </button>
                              )}
                              <button
                                className="ap-icon-btn ap-del-btn"
                                onClick={(e) => { e.stopPropagation(); handleDeleteReview(r._id); }}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {reviews.length === 0 && (
                        <tr>
                          <td colSpan="6" className="ap-empty-row">
                            No reviews yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal for Review Details */}
              {selectedReview && (
                <div className="ap-modal-overlay" onClick={() => setSelectedReview(null)}>
                  <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="ap-modal-header">
                      <h3>Review Details</h3>
                      <button className="ap-modal-close" onClick={() => setSelectedReview(null)}>
                        <X size={20} />
                      </button>
                    </div>
                    <div className="ap-modal-body">
                      <div className="ap-modal-row"><span>Customer:</span> <strong>{selectedReview.name}</strong></div>
                      <div className="ap-modal-row"><span>Rating:</span> <strong style={{ color: 'var(--ap-gold)', fontSize: '16px' }}>{"★".repeat(selectedReview.rating)}{"☆".repeat(5 - selectedReview.rating)}</strong></div>
                      <div className="ap-modal-row"><span>Date:</span> <strong>{new Date(selectedReview.createdAt).toLocaleDateString("en-IN")}</strong></div>
                      <div className="ap-modal-row"><span>Status:</span> <strong className={`ap-pill ${selectedReview.status === "Approved" ? "ap-pill-green" : "ap-pill-amber"}`}>{selectedReview.status}</strong></div>
                      <div className="ap-modal-row" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none' }}>
                        <span>Review:</span>
                        <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--ap-input-bg)', borderRadius: '8px', width: '100%', color: 'var(--ap-text)', whiteSpace: 'pre-wrap' }}>
                          {selectedReview.text}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* ap-body */}
      </div>
      {/* ap-main */}
    </div>
  );
};

export default AdminPanel;
