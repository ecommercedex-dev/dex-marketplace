// Seller Follow/Like/Review Helper Functions
const BASE_URL = 'http://localhost:5000/api';

const getToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser'));
    return user?.token || '';
  } catch {
    return '';
  }
};

// Follow seller
export async function followSeller(sellerId) {
  const token = getToken();
  if (!token) {
    alert('Please log in to follow sellers');
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/seller/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sellerId })
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Unfollow seller
export async function unfollowSeller(sellerId) {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/seller/follow/${sellerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Get follow status
export async function getFollowStatus(sellerId) {
  const token = getToken();
  if (!token) return { isFollowing: false, followers: 0 };

  try {
    const res = await fetch(`${BASE_URL}/seller/follow/${sellerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return { isFollowing: false, followers: 0 };
  }
}

// Like seller
export async function likeSeller(sellerId) {
  const token = getToken();
  if (!token) {
    alert('Please log in to like sellers');
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/seller/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sellerId })
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Unlike seller
export async function unlikeSeller(sellerId) {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${BASE_URL}/seller/like/${sellerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Get like status
export async function getLikeStatus(sellerId) {
  const token = getToken();
  if (!token) return { isLiked: false, likes: 0 };

  try {
    const res = await fetch(`${BASE_URL}/seller/like/${sellerId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return { isLiked: false, likes: 0 };
  }
}

// Submit seller review
export async function submitSellerReview(sellerId, rating, comment) {
  const token = getToken();
  if (!token) {
    alert('Please log in to review sellers');
    return null;
  }

  try {
    const res = await fetch(`${BASE_URL}/seller-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ sellerId, rating, comment })
    });

    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}
