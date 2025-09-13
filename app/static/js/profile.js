document.addEventListener("DOMContentLoaded", () => {
  const profileSection = document.querySelector(".profile-section");

  // --- Load profile info từ localStorage ---
  if (profileSection) {
    const userNameEl = profileSection.querySelector("#tab-user .profile-username");
    const mailEl = profileSection.querySelector("#tab-user .profile-mail");
    const phoneEl = profileSection.querySelector("#tab-user .profile-phone");
    const passwordEl = profileSection.querySelector("#tab-user .profile-password");

    const username = localStorage.getItem("username") || "Guest";
    const email = localStorage.getItem("email") || "-";
    const phone = localStorage.getItem("phone") || "-";
    const password = localStorage.getItem("password") || "******";

    if (userNameEl) userNameEl.textContent = username;
    if (mailEl) mailEl.textContent = email;
    if (phoneEl) phoneEl.textContent = phone;
    if (passwordEl) passwordEl.textContent = password;
  }

  // --- Handle sidebar click to switch tabs with fade effect ---
  const sidebarItems = document.querySelectorAll(".profile-sidebar .list-group-item");
  const tabPanes = document.querySelectorAll(".profile-content .tab-pane");

  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      // Active sidebar
      sidebarItems.forEach(el => el.classList.remove("active"));
      item.classList.add("active");

      // Show đúng content (có hiệu ứng fade)
      const targetId = item.getAttribute("data-target");
      tabPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add("show", "active");
          pane.classList.remove("d-none");
        } else {
          pane.classList.remove("show", "active");
          pane.classList.add("d-none");
        }
      });
    });
  });

  const userId = localStorage.getItem("userid");

  async function fetchOrders() {
    try {
      const res = await fetch(`/orders/${userId}`);
      if (!res.ok) {
        throw new Error('Không tìm thấy đơn hàng');
      }
      const data = await res.json();
      renderOrders(data.orders);
    } catch (error) {
      console.error(error);
      document.getElementById('orders-container').innerHTML = `<p>${error.message}</p>`;
    }
  }

  function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';

    orders.forEach((order, index) => {
      const orderDiv = document.createElement('div');
      orderDiv.className = 'card mb-3 p-3';

      orderDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">#${index + 1}. Transaction ID: ${order.transaction_id}</h5>
                ${generateStatus(order.status)}
            </div>
            <p class="mb-1">Order date: ${new Date(order.order_time).toLocaleString()}</p>
            <table class="table table-bordered table-sm my-2">
                <thead>
                    <tr>
                        <th style="text-align: center;">#</th>
                        <th style="text-align: ;">Food Name</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: center;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map((item, index) => `
                        <tr>
                            <td style="text-align: center;">${index + 1}</td>
                            <td style="text-align: left;">${item.food_name}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: center;">${formatVND(item.price)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="2" style="text-align: center;">Total</th>
                        <th style="text-align: center;">${order.totalQuantity}</th>
                        <th style="text-align: center;">${formatVND(order.total)}</th>
                    </tr>
                </tfoot>
            </table>
        `;

      container.appendChild(orderDiv);
    });
  }

  fetchOrders();

  document.querySelectorAll(".profile-section .card-header-tabs .nav-link").forEach(tab => {
    tab.addEventListener("click", function () {
      const title = this.dataset.title || this.textContent.trim();
      const breadcrumbChild = document.querySelector(".breadcrumb-item-child");
      const breadcrumbTitle = document.querySelector(".breadcrumb-title");

      if (breadcrumbChild) breadcrumbChild.textContent = title;
      if (breadcrumbTitle) breadcrumbTitle.textContent = title;
    });
  });

});

function generateStatus(statusInit) {
  const status = statusInit.toUpperCase();
  switch (statusInit) {
    case "completed":
      return `<span class="badge bg-cyan text-cyan-fg">${status}</span>`;
    case "cancelled":
      return `<span class="badge bg-red text-red-fg">${status}</span>`;
    case "pending":
      return `<span class="badge bg-blue text-blue-fg">${status}</span>`;
    case "confirmed":
      return `<span class="badge bg-azure text-azure-fg">${status}</span>`;
    case "preparing":
      return `<span class="badge bg-orange text-orange-fg">${status}</span>`;
    case "delivering":
      return `<span class="badge bg-lime text-lime-fg">${status}</span>`;
    case "failed":
      return `<span class="badge bg-yellow text-yellow-fg">${status}</span>`;
    default:
      return `<span class="badge bg-purple text-purple-fg">${status}</span>`;
  }
}

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}