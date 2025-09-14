
const tabs = document.querySelectorAll('#featured-restaurants .restaurant-tab');
const restaurantList = document.getElementById('restaurant-list');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    fetchRestaurants(tabName);
  });
});

function showSkeleton(count = 4) {
  let skeletonHTML = '';
  for (let i = 0; i < count; i++) {
    skeletonHTML += `
      <div class="col-6 col-sm-6 col-lg-6 col-xl-3 col-md-6">
        <div class="restaurant-card bg-white">
          <div class="skeleton-img"></div>
          <div class="p-3">
            <div class="skeleton-text skeleton-title mb-2"></div>
            <div class="skeleton-text skeleton-line mb-2"></div>
            <div class="d-flex justify-content-between icon-text">
              <div class="skeleton-text skeleton-sm"></div>
              <div class="skeleton-text skeleton-sm"></div>
              <div class="skeleton-text skeleton-sm"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  restaurantList.innerHTML = skeletonHTML;
}


async function fetchRestaurants(tab) {
  try {
    showSkeleton(12);
    const res = await fetch(`/restaurants?tab=${tab}`);
    if (!res.ok) throw new Error('Failed to fetch restaurants');
    const data = await res.json();
    renderRestaurants(data);
  } catch (err) {
    console.error(err);
    restaurantList.innerHTML = '<p>Error loading restaurants</p>';
  }
}

function renderBadgeHtml(badges) {
  let badgeHTML = '';

  if (Array.isArray(badges) && badges.length > 0) {
    badgeHTML = badges.map(b => {
      switch (b.toLowerCase()) {
        case 'newest':
          return `
            <div class="seller-badge new-badge">
              <img src="static/images/restaurants/newest.svg" alt="medal">
              <h6>Newest</h6>
            </div>`;
        case 'exclusive':
          return `
            <div class="seller-badge">
              <img src="static/images/restaurants/exclusive.svg" alt="medal">
              <h6>Exclusive</h6>
            </div>`;
        case 'bestseller':
        case 'best seller':
          return `
            <div class="seller-badge exclusive-badge">
              <img src="static/images/restaurants/best-seller.svg" alt="medal">
              <h6>Best seller</h6>
            </div>`;
        default:
          return '';
      }
    }).join('');
  }
  return badgeHTML
}
const restaurantMenuBase = "{{ url_for('menu.restaurant_menu', restaurant_id=0) }}"; 
function renderRestaurants(restaurants) {
  restaurantList.innerHTML = ''; // clear

  restaurants.forEach(r => {
    let badges = [];
    try {
      badges = JSON.parse(r.badges);
    } catch (e) { }

    const dishes = r.products.length === 0 ? "&nbsp;" : r.products.map(p => p.name).join(', ');

    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-md-6 col-lg-4 col-xl-3 col-xxl-3';
    let badgeHTML = !badges.length ? '&nbsp;' : renderBadgeHtml(badges);

    const menuUrl = `/restaurant/${r.id}/menu`;

    col.innerHTML = `
      <div class="vertical-product-box roundedbg-white shadow-sm" style="border-radius: .5rem !important; border: 1px solid #e8e8e8; background: #fff;">
      <!-- Badge -->

      <!-- Product Image -->
      
      <div class="vertical-product-box-img position-relative">
        <a class="bg-size d-block" href="${menuUrl}" 
          style="background-image: url(${r.image_url}); background-size: cover; background-position: center; height: 200px; border-radius: .5rem;">
          <img src="${r.image_url}" alt="${r.name}" class="product-img-top w-100 bg-img d-none">
        </a>

        <!-- Offer -->
        ${badgeHTML}
      </div>

      <!-- Body -->
        <div class="vertical-product-body mt-3">
          <div class="d-flex align-items-center justify-content-between">
            <a href="${menuUrl}" class="text-decoration-none">
              <h6 class="vertical-product-title mb-0">${r.name}</h6>
            </a>
            <div class="rating-star mb-0 d-flex align-items-center justify-content-center gap-1">
              <svg style="width: 24px; height: 24px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#277d2a"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM10.8613 9.36335L10.7302 9.59849C10.5862 9.85677 10.5142 9.98591 10.402 10.0711C10.2897 10.1563 10.1499 10.188 9.87035 10.2512L9.61581 10.3088C8.63195 10.5314 8.14001 10.6427 8.02297 11.0191C7.90593 11.3955 8.2413 11.7876 8.91204 12.572L9.08557 12.7749C9.27617 12.9978 9.37147 13.1092 9.41435 13.2471C9.45722 13.385 9.44281 13.5336 9.41399 13.831L9.38776 14.1018C9.28635 15.1482 9.23565 15.6715 9.54206 15.9041C9.84847 16.1367 10.3091 15.9246 11.2303 15.5005L11.4686 15.3907C11.7304 15.2702 11.8613 15.2099 12 15.2099C12.1387 15.2099 12.2696 15.2702 12.5314 15.3907L12.7697 15.5005C13.6909 15.9246 14.1515 16.1367 14.4579 15.9041C14.7644 15.6715 14.7136 15.1482 14.6122 14.1018L14.586 13.831C14.5572 13.5336 14.5428 13.385 14.5857 13.2471C14.6285 13.1092 14.7238 12.9978 14.9144 12.7749L15.088 12.572C15.7587 11.7876 16.0941 11.3955 15.977 11.0191C15.86 10.6427 15.3681 10.5314 14.3842 10.3088L14.1296 10.2512C13.8501 10.188 13.7103 10.1563 13.598 10.0711C13.4858 9.98592 13.4138 9.85678 13.2698 9.5985L13.1387 9.36335C12.6321 8.45445 12.3787 8 12 8C11.6213 8 11.3679 8.45446 10.8613 9.36335Z" fill="#277d2a"></path> </g></svg>
              <span style="font-size: 0.75rem;">${parseFloat(r.rating || 0).toFixed(1)}</span>
            </div>
          </div>
          <span class="single-line-text">${dishes}</span>
          <div class="location-distance flex-wrap d-flex align-items-center justify-content-between pt-2 gap-2">
            <div class="place mb-0 small fw-semibold d-flex align-items-center justify-content-between">
              <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 9.5C13.3807 9.5 14.5 10.6193 14.5 12C14.5 13.3807 13.3807 14.5 12 14.5C10.6193 14.5 9.5 13.3807 9.5 12C9.5 10.6193 10.6193 9.5 12 9.5Z" fill="#000000"></path> </g></svg>
              <span style="font-size:0.75rem;">${r.location}</h7>
            </div>
            <div class="distance d-flex mb-0 gap-3 small text-muted">
              <div class="d-flex align-items-center justify-content-between gap-1">
              <div class="icon-location">  
                  <svg style="width: 15px; height: 15px;"  viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M12 12C13.1046 12 14 11.1046 14 10C14 8.89543 13.1046 8 12 8C10.8954 8 10 8.89543 10 10C10 11.1046 10.8954 12 12 12Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                </div>
                <span class="small">${r.distance_km}km</span>
              </div>
          
              <div class="d-flex align-items-center justify-content-between gap-1">
                <div class="icon-location"> 
                  <svg style="width: 15px; height: 15px;" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#ffffff"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M3 5.5L5 3.5M21 5.5L19 3.5M9 12.5L11 14.5L15 10.5M20 12.5C20 16.9183 16.4183 20.5 12 20.5C7.58172 20.5 4 16.9183 4 12.5C4 8.08172 7.58172 4.5 12 4.5C16.4183 4.5 20 8.08172 20 12.5Z" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                </div>
                <span class="small">${r.delivery_time_min} min</span>
              </div>
            </div>
          </div>
        </div>
    </div>
    `;
    restaurantList.appendChild(col);
  });
}

// load default
document.addEventListener('DOMContentLoaded', () => {
  fetchRestaurants('fast_delivery');
});