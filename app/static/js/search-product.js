const getEmptyBlock = () => {
  return `<div class="search-empty empty d-flex" style="height: 350px; max-height: 350px;">
                        <div class="empty-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="icon" width="24" height="24"
                                viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <circle cx="12" cy="12" r="9" />
                                <line x1="9" y1="10" x2="9.01" y2="10" />
                                <line x1="15" y1="10" x2="15.01" y2="10" />
                                <path d="M9.5 15.25a3.5 3.5 0 0 1 5 0" />
                            </svg>
                        </div>
                        <p class="empty-title">No results found</p>
                        <p class="empty-subtitle text-secondary">
                            Try adjusting your search or filter to find what you're looking for.
                        </p>
                    </div>`
}

async function loadSearchResults(keyword = '') {
  const listContainer = document.getElementById('search-list');
  document.getElementById('overlay-modal-search-product').style.display = 'flex';
  try {
    const response = await fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`);

    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType.includes('application/json')) {
      console.error('API error or not JSON', response.status, contentType);
      listContainer.innerHTML = getEmptyBlock();
      return;
    }

    const data = await response.json();

    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (data.results.length === 0) {
      listContainer.innerHTML = getEmptyBlock();
      return;
    }

    data.results.forEach(item => {
      let foodsHtml = "";
      const menuUrl = `/restaurant/${item.id}/menu`;

      if (item.lst_food && item.lst_food.length > 0) {
        foodsHtml = `
          <div class="mt-3">
            <div class="fw-bold small" style="font-style: italic;">Menu highlights</div>
            <div class="d-flex flex-wrap gap-2 mt-1">
              ${item.lst_food.map(food => `
                <a href="${menuUrl}" alt="${food.name}">
                <div class="border rounded p-2 d-flex flex-column align-items-center" style="width: 150px;">
                  <img src="${food.image_url || './static/avatars/default-food.jpg'}" 
                      alt="${food.name}" 
                      class="img-fluid rounded mb-1" 
                      style="height:80px; width: 100%; object-fit:cover;">
                  <div class="small text-truncate" style="max-width: 100px;" data-bs-toggle="tooltip" data-bs-placement="right" title="${food.name}">${food.name}</div>
                  <div class="text-muted small">$${food.price}</div>
                </div>
                </a>
              `).join("")}
            </div>
          </div>
        `;
      }
      const html = `
        <div class="list-group-item">
          <div class="row align-items-center">
            <div class="col-auto d-flex justify-content-center align-items-center gap-2">
              <a href="${menuUrl}" alt="${item.name}">
                <span class="avatar avatar-1" style="width: 80px; height: 80px; background-image: url(${item.image_url || './static/avatars/default.jpg'})"></span>
              </a>
              <div class="d-flex flex-column justify-content-center align-items-start gap-2">
                <a href="${menuUrl}" alt="${item.name}"><span style="color: #182423;">${item.name}</span></a>
                <div class="d-flex justify-content-center align-items-start gap-2">
                  <span class="small">
                    <i class="fa-solid fa-star ps-1" style="color: #FFD43B;"></i>${item.rating}</span>
                  <span class="small"><i class="fa-solid fa-location-crosshairs px-1" style="color: #bd0013;"></i>${item.location}</span>
                </div>
              </div>
            </div>
            <div class="col text-truncate"></div>
            <div class="col-auto">
              <span class="small text-green"><span class="badge bg-green me-1"></span>Opening</span>
            </div>
          </div>
          
          <div class="row align-items-center">${foodsHtml}</div>
        </div>
      `;
      listContainer.insertAdjacentHTML('beforeend', html);
    });

    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(el => new bootstrap.Tooltip(el))
  } catch (error) {
    console.error('Unexpected error', error);
    listContainer.innerHTML = getEmptyBlock();
  } finally {

    setTimeout(() =>
      document.getElementById('overlay-modal-search-product').style.display = 'none', 500)
  }
}

function handleSearchInput(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  input.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const keyword = input.value.trim();
      if (!keyword) return;

      loadSearchResults(keyword)
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSearchResults();
  handleSearchInput("searchInput");
});