const tabs = document.querySelectorAll('.restaurant-tab');
const restaurantList = document.getElementById('restaurant-list');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    fetchRestaurants(tabName);
  });
});

async function fetchRestaurants(tab) {
  try {
    const res = await fetch(`/restaurants?tab=${tab}`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    const data = await res.json();
    renderRestaurants(data);
  } catch (err) {
    console.error(err);
    restaurantList.innerHTML = '<p>Error loading restaurants</p>';
  }
}

function renderRestaurants(restaurants) {
  restaurantList.innerHTML = ''; // clear

  restaurants.forEach(r => {
    let badges = [];
    try {
      badges = JSON.parse(r.badges);
    } catch (e) { }

    const dishes = r.products.map(p => p.name).join(', ');

    const col = document.createElement('div');
    col.className = 'col-md-3 col-sm-6 mb-4';

    col.innerHTML = `
      <div class="vertical-product-box border rounded p-3 bg-white shadow-sm">
  <!-- Badge -->
  <div class="seller-badge new-badge d-flex align-items-center mb-2">
    <img src="${r.image_url}" alt="medal" class="img-fluid badge me-2" style="width: 20px; height: 20px;">
    <h6 class="mb-0">Newest</h6>
  </div>

  <!-- Product Image -->
  <div class="vertical-product-box-img position-relative">
    <a class="bg-size d-block" href="/zomo/order/menu-listing/ribeye-junction" 
       style="background-image: url(${r.image_url}); background-size: cover; background-position: center; height: 180px; border-radius: .5rem;">
      <img src="${r.image_url}" alt="${r.name}" class="product-img-top w-100 bg-img d-none">
    </a>

    <!-- Offer -->
    <div class="offers position-absolute top-0 start-0 m-2 bg-danger text-white px-2 py-1 rounded">
      <h6 class="mb-0">upto $2</h6>
      <div class="d-flex align-items-center justify-content-between">
        <h4 class="mb-0">50% OFF</h4>
      </div>
    </div>
  </div>

  <!-- Body -->
  <div class="vertical-product-body mt-3">
    <div class="d-flex align-items-center justify-content-between">
      <a href="/zomo/order/menu-listing/ribeye-junction" class="text-decoration-none">
        <h4 class="vertical-product-title h6 mb-0">Ribeye Junction</h4>
      </a>
      <h6 class="rating-star mb-0">
        <span class="text-warning"><i class="ri-star-s-fill"></i></span> 3.2
      </h6>
    </div>

    <h5 class="product-items text-muted small mt-1">Chicken quesadilla, avocado....</h5>

    <div class="location-distance d-flex align-items-center justify-content-between pt-2">
      <h5 class="place mb-0 small fw-semibold">California</h5>
      <ul class="distance list-unstyled d-flex mb-0 gap-3 small text-muted">
        <li><i class="ri-map-pin-fill icon"></i> 1 km</li>
        <li><i class="ri-time-fill icon"></i> 10 min</li>
      </ul>
    </div>
  </div>
</div>

    `;
    restaurantList.appendChild(col);
  });
}

// load default
document.addEventListener('DOMContentLoaded', () => {
  fetchRestaurants('rating');
});