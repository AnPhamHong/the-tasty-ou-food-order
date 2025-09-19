document.addEventListener("DOMContentLoaded", () => {

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  if (tabParam) {
    // mapping tab param với id tab
    const tabIdMap = {
      "user": "#tab-user",
      "orders": "#tab-orders",
      "address": "#tab-address",
      "card": "#tab-card",
      "help": "#tab-help"
    };

    const targetTab = tabIdMap[tabParam.toLowerCase()];
    if (targetTab) {
      const triggerEl = document.querySelector(`a[href="${targetTab}"]`);
      if (triggerEl) {
        const tab = new bootstrap.Tab(triggerEl);
        tab.show();
      }
    }
  }
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
        throw new Error('We couldn’t find your order');
      }
      const data = await res.json();
      renderOrders(data.orders);
    } catch (error) {
      console.error(error);
      document.getElementById('orders-container').innerHTML = `<p>${error.message}</p>`;
    }
  }

  // format tiền sang VND (Intl)
  function formatUSD(value) {
    const n = Number(String(value).replace(/[^\d.-]/g, '')) || 0;
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  }

  // capitalize first letter
  function capitalize(str) {
    if (!str) return '';
    str = String(str);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // generate bootstrap badge for status
  function generateStatus(status) {
    const s = String(status || '').toLowerCase();
    const map = {
      pending: 'bg-warning text-dark',
      confirmed: 'bg-primary text-white',
      preparing: 'bg-info text-dark',
      delivering: 'bg-secondary text-white',
      completed: 'bg-success text-white',
      cancelled: 'bg-danger text-white',
      canceled: 'bg-danger text-white',
      failed: 'bg-dark text-white'
    };
    const cls = map[s] || 'bg-secondary text-white';
    return `<span class="badge ${cls}">${capitalize(s)}</span>`;
  }

  // render orders
  function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';

    if (!orders || !orders.length) {
      container.innerHTML = `<div class="alert alert-light">No orders found.</div>`;
      return;
    }

    orders.forEach((order, idx) => {
      const orderDiv = document.createElement('div');
      orderDiv.className = 'card mb-3 p-3';

      // ensure numbers
      const totalQty = Number(order.totalQuantity) || 0;
      // prefer order.totalPrice (computed), fallback to order.total
      const totalPriceNum = Number(order.totalPrice ?? order.total) || 0;

      // build items HTML (safe parsing for price & quantity)
      const itemsHtml = (order.items || []).map((item, i) => {
        const qty = parseInt(item.quantity, 10) || 0;
        const priceNum = item.price * item.quantity || 0;
        return `
        <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
          <div class="d-flex justify-content-start gap-2 align-items-center">
            <img src="${item.image_url}" alt="${item.food_name}" style="width: 40px; height: 40px;"/>
            <div class="text-truncate" style="padding-right: .5rem;">${item.food_name} - <span style="padding-left: .5rem; font-size: .8rem; font-style: italic;"> ${item.price} x${qty}</span></div>
          </div>
          <div style="text-align:right; font-size: .8rem;">${formatUSD(priceNum)}</div>
        </div>
      `;
      }).join('');

      orderDiv.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h6 class="mb-0">#${idx + 1}. Transaction ID: ${order.transaction_id}</h6>
        ${generateStatus(order.status)}
      </div>
      <p class="mb-2 text-muted">Order date: ${new Date(order.order_time).toLocaleString('vi-VN')}</p>
      <div class="mb-2">
        ${itemsHtml || '<div class="text-muted">No items</div>'}
      </div>
      <div class="d-flex justify-content-between align-items-center fw-semibold">
        <span style="font-size: .8rem;">Total: ${totalQty} items</span>
        <span style="font-size: .8rem; text-align:right;">${formatUSD(totalPriceNum)}</span>
      </div>
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

// function generateStatus(statusInit) {
//   const status = statusInit.toUpperCase();
//   switch (statusInit) {
//     case "completed":
//       return `<span class="badge bg-cyan text-cyan-fg">${status}</span>`;
//     case "cancelled":
//       return `<span class="badge bg-red text-red-fg">${status}</span>`;
//     case "pending":
//       return `<span class="badge bg-blue text-blue-fg">${status}</span>`;
//     case "confirmed":
//       return `<span class="badge bg-azure text-azure-fg">${status}</span>`;
//     case "preparing":
//       return `<span class="badge bg-orange text-orange-fg">${status}</span>`;
//     case "delivering":
//       return `<span class="badge bg-lime text-lime-fg">${status}</span>`;
//     case "failed":
//       return `<span class="badge bg-yellow text-yellow-fg">${status}</span>`;
//     default:
//       return `<span class="badge bg-purple text-purple-fg">${status}</span>`;
//   }
// }