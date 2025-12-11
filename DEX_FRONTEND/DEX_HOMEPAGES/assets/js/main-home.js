import { loadStats } from './modules/stats.js';
import { loadTestimonials } from './modules/testimonials.js';
import { loadFeaturedSellers } from './modules/featured-sellers.js';
import { loadTrending } from './modules/trending.js';
import { setupNewsletter } from './modules/newsletter.js';

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadTestimonials();
  loadFeaturedSellers();
  loadTrending();
  setupNewsletter();
});
