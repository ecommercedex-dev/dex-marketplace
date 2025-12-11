const API_URL = "http://localhost:5000/api";

export function setupNewsletter() {
  const form = document.getElementById("newsletter-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("newsletter-email").value.trim();
    const btn = form.querySelector("button");
    const original = btn.textContent;
    
    try {
      btn.textContent = "Subscribing...";
      btn.disabled = true;
      
      const res = await fetch(`${API_URL}/home/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        btn.textContent = "✓ Subscribed!";
        form.reset();
        setTimeout(() => btn.textContent = original, 3000);
      } else {
        throw new Error("Subscription failed");
      }
    } catch (err) {
      btn.textContent = "Try Again";
      console.error("Newsletter error:", err);
    } finally {
      btn.disabled = false;
    }
  });
}
