"use client";

import '../globals.css';

import React, { useState, useEffect } from "react";
import { useCart } from "../../lib/useCart";
import SectionTitle from "../../components/SectionTitle";
import SectionDivider from "../../components/SectionDivider";

function CoinsHubPage() {
  const { addItem } = useCart();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedVar, setSelectedVar] = useState(null);
  const [formData, setFormData] = useState({});
  const [loadingGames, setLoadingGames] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [message, setMessage] = useState("");
  const [addedToCart, setAddedToCart] = useState(false);

  // Fetch games
  useEffect(() => {
    fetch("/api/coins/games")
      .then((res) => res.json())
      .then((data) => {
        setGames(Array.isArray(data) ? data : []);
        setLoadingGames(false);
        if (Array.isArray(data) && data.length > 0) {
          // select first game by default
          handleSelectGame(data[0]);
        }
      })
      .catch((err) => {
        console.error("Error fetching games:", err);
        setLoadingGames(false);
      });
  }, []);

  const handleSelectGame = (game) => {
    setSelectedGame(game);
    setProducts([]);
    setSelectedVar(null);
    setFormData({});
    setLoadingProducts(true);
    setAddedToCart(false);
    setMessage("");

    fetch(`/api/coins/${game.slug}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoadingProducts(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoadingProducts(false);
      });
  };

  const handleSelectVar = (variation) => {
    setSelectedVar(variation);
    setAddedToCart(false);
    setMessage("");
    
    // Initialize form fields
    const initialForm = {};
    if (variation.required_fields) {
      variation.required_fields.forEach((field) => {
        initialForm[field] = "";
      });
    }
    setFormData(initialForm);
  };

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (!selectedVar) return;

    // Validate fields
    if (selectedVar.required_fields) {
      for (const field of selectedVar.required_fields) {
        if (!formData[field] || !formData[field].trim()) {
          setMessage("لطفاً تمامی فیلدهای مورد نیاز را تکمیل نمایید.");
          return;
        }
      }
    }

    // Add to cart with placeholder product_id = 999999 and variant_id = variation external ID
    const cartItem = {
      product_id: 999999,
      variant_id: selectedVar.external_variation_id,
      g4a4_variation_id: selectedVar.external_variation_id,
      name: `${selectedGame.name} - ${selectedVar.name}`,
      price: selectedVar.sell_toman,
      quantity: 1,
      slug: selectedGame.slug,
      account_type: "", // empty so it won't ask for generic credentials on checkout
      custom_fields_data: formData,
    };

    addItem(cartItem);
    setAddedToCart(true);
    setMessage("محصول با موفقیت به سبد خرید اضافه شد! 🩷");
  };

  // Helper translations for common required fields
  const getFieldLabel = (field) => {
    const labels = {
      game_email: "ایمیل بازی / اکانت",
      game_password: "رمز عبور اکانت",
      player_tag: "تگ بازیکن (Player Tag)",
      character_name: "نام کاراکتر در بازی",
      backup_code: "کد بکاپ / 2FA (اختیاری)",
      epic_email: "ایمیل اپیک گیمز",
      epic_password: "رمز عبور اپیک گیمز",
    };
    return labels[field] || field;
  };

  return (
    <div className="container" style={{ padding: "40px 16px", minHeight: "80vh", direction: "rtl" }}>
      <SectionTitle fa="شارژ کوین و پول درون بازی" en="Gaming Coins Hub" />
      <SectionDivider variant="drips" />

      {loadingGames ? (
        <div style={{ textAlignment: "center", padding: "40px", color: "var(--muted)" }}>
          در حال بارگذاری لیست بازی‌ها...
        </div>
      ) : (
        <div className="coins-grid-layout" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "32px", marginTop: "24px" }}>
          
          {/* Sidebar - Game list */}
          <aside className="games-sidebar" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "8px", color: "var(--text)" }}>انتخاب بازی</h3>
            {games.map((g) => (
              <button
                key={g.slug}
                onClick={() => handleSelectGame(g)}
                style={{
                  textAlign: "right",
                  padding: "14px 20px",
                  borderRadius: "14px",
                  background: selectedGame?.slug === g.slug ? "var(--primary)" : "var(--card)",
                  color: selectedGame?.slug === g.slug ? "#fff" : "var(--text)",
                  border: `1px solid ${selectedGame?.slug === g.slug ? "var(--primary)" : "var(--line)"}`,
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: selectedGame?.slug === g.slug ? "0 4px 15px rgba(255, 79, 163, 0.3)" : "none",
                }}
                className="game-select-btn"
              >
                🎮 {g.name}
              </button>
            ))}
          </aside>

          {/* Main Content Area */}
          <main className="coins-main-content">
            {selectedGame && (
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "24px", fontWeight: "900", color: "var(--text)" }}>خرید محصولات {selectedGame.name}</h2>
                <p style={{ color: "var(--muted)", marginTop: "4px" }}>واریانت مورد نظر خود را انتخاب کرده و فیلدهای لازم را پر کنید.</p>
              </div>
            )}

            {loadingProducts ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
                در حال بارگذاری بسته‌ها و قیمت‌های روز...
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", background: "var(--card)", borderRadius: "16px", border: "1px solid var(--line)" }}>
                هیچ محصول فعالی برای این بازی یافت نشد.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                
                {/* Products & Variations Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
                  {products.flatMap((prod) =>
                    prod.variations.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => handleSelectVar(v)}
                        style={{
                          background: "var(--card)",
                          border: `2px solid ${selectedVar?.id === v.id ? "var(--primary)" : "var(--line)"}`,
                          borderRadius: "20px",
                          padding: "20px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          position: "relative",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          minHeight: "180px",
                        }}
                        className="coin-variation-card"
                      >
                        {selectedVar?.id === v.id && (
                          <div style={{
                            position: "absolute",
                            top: "0",
                            left: "0",
                            background: "var(--primary)",
                            color: "#fff",
                            padding: "4px 12px",
                            fontSize: "11px",
                            fontWeight: "900",
                            borderBottomRightRadius: "12px",
                          }}>
                            انتخاب شده ✦
                          </div>
                        )}
                        <div style={{ marginTop: selectedVar?.id === v.id ? "16px" : "0" }}>
                          <h4 style={{ fontSize: "16px", fontWeight: "900", color: "var(--text)" }}>{v.name}</h4>
                          {v.region && (
                            <span style={{
                              display: "inline-block",
                              marginTop: "8px",
                              padding: "2px 8px",
                              background: "rgba(76, 201, 240, 0.12)",
                              color: "var(--accent)",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}>
                              ریجن: {v.region}
                            </span>
                          )}
                        </div>

                        <div style={{ marginTop: "24px" }}>
                          <div style={{ fontSize: "20px", fontWeight: "900", color: "var(--primary)" }}>
                            {v.sell_toman.toLocaleString("fa-IR")} <span style={{ fontSize: "13px" }}>تومان</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Form for Selected Variation */}
                {selectedVar && (
                  <div style={{
                    background: "var(--card)",
                    border: "1px solid var(--line)",
                    borderRadius: "24px",
                    padding: "32px",
                    maxWidth: "600px",
                  }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "900", marginBottom: "20px", color: "var(--text)" }}>
                      📝 اطلاعات لازم برای فعال‌سازی {selectedVar.name}
                    </h3>
                    
                    <form onSubmit={handleAddToCart} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {selectedVar.required_fields && selectedVar.required_fields.map((field) => (
                        <div key={field} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <label style={{ fontSize: "14px", fontWeight: "bold", color: "var(--text)" }}>
                            {getFieldLabel(field)} <span style={{ color: "var(--primary)" }}>*</span>
                          </label>
                          <input
                            type={field.includes("password") || field.includes("pass") ? "password" : "text"}
                            value={formData[field] || ""}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            required
                            style={{
                              padding: "12px 16px",
                              borderRadius: "12px",
                              border: "1px solid var(--line)",
                              background: "rgba(255,255,255,0.02)",
                              color: "var(--text)",
                              fontSize: "14px",
                              outline: "none",
                              transition: "border 0.15s ease",
                            }}
                            placeholder={`وارد کردن ${getFieldLabel(field)}`}
                          />
                          {(field.includes("password") || field.includes("pass")) && (
                            <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                              🔒 اطلاعات اکانت شما به صورت رمزنگاری‌شده و کاملاً امن ارسال و بلافاصله پس از تکمیل سفارش حذف می‌شود.
                            </span>
                          )}
                        </div>
                      ))}

                      {message && (
                        <div style={{
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: addedToCart ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                          color: addedToCart ? "#10b981" : "#ef4444",
                          fontSize: "14px",
                          fontWeight: "bold",
                          textAlign: "center",
                        }}>
                          {message}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="gradient-btn"
                        style={{
                          padding: "16px",
                          borderRadius: "14px",
                          border: "none",
                          color: "#fff",
                          fontWeight: "900",
                          fontSize: "16px",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {addedToCart ? "✓ اضافه شد (افزودن مجدد)" : "🛒 افزودن به سبد خرید"}
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}
          </main>

        </div>
      )}
    </div>
  );
}

export default function CoinsHubPageWithCart() {
  return <CoinsHubPage />;
}
