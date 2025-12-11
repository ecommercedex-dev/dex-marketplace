const API_URL = "http://localhost:5000/api";

export async function loadStats() {
  try {
    const res = await fetch(`${API_URL}/home/stats`);
    const data = await res.json();
    
    document.getElementById("stat-products").textContent = `${data.products}+`;
    document.getElementById("stat-sellers").textContent = `${data.sellers}+`;
    document.getElementById("stat-orders").textContent = `${data.orders}+`;
    document.getElementById("stat-buyers").textContent = `${data.buyers}+`;
  } catch (err) {
    console.error("Stats load error:", err);
  }
}
