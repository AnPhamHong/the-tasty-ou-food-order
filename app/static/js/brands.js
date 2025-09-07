document.addEventListener("DOMContentLoaded", function () {
  const carousel = $("#brand-carousel");

  // Init owl
  carousel.owlCarousel({
    loop: true,
    margin: 24,
    nav: true,
    dots: false,
    autoplay: true,
    autoplayTimeout: 1000,
    autoplayHoverPause: true,
    responsive: {
      0: { items: 2 },
      576: { items: 3 },
      768: { items: 4 },
      992: { items: 5 },
      1200: { items: 8 }
    }
  });

  // 🔥 Load brands từ API Flask
  fetch("/api/brands")
    .then(res => res.json())
    .then(data => {
      data.forEach(brand => {
        const item = $(`
          <div class="brand-item">
            <a href="${brand.link}">
              <img src="${brand.image_url}" alt="${brand.name}" class="img-fluid rounded-3">
            </a>
          </div>
        `);

        // Thêm item vào carousel
        carousel.trigger("add.owl.carousel", [item]);
      });

      // Refresh lại carousel để apply item mới
      carousel.trigger("refresh.owl.carousel");
    })
    .catch(err => console.error("Error loading brands:", err));
});
