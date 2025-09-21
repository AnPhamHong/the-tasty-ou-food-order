
document.addEventListener("DOMContentLoaded", function () {
    const _header = document.querySelector('.announcement.announcement-header');
    const _promotionMsg = _header.querySelector('#promoBannerText');
    const _promotionWrapper = _header.querySelector('#promoBannerWrapper');

    const mockResponse = {
        Result: "ok",
        Message: [
            { Text: "🎉 Big Sale Up To 70% Off!", BgColor: "#FF90B3", TextColor: "#2E2A2A" },
            { Text: "🍂 Vintage Autumn Collection", BgColor: "#C4A484", TextColor: "#3B2C2C" },
            { Text: "🔥 Gen Z Streetwear New Drop", BgColor: "#9B5DE5", TextColor: "#FFFFFF" },
            { Text: "☕ Cozy Retro Essentials", BgColor: "#D1BEA8", TextColor: "#2F1B12" },
            { Text: "⚡ Flash Deals Today Only!", BgColor: "#00F5D4", TextColor: "#001219" }
        ],
        Config: {
            Animation: "up-down", // left-right, right-left, up-down, down-up
            Duration: 2000
        }
    };

    if (mockResponse.Result.toLowerCase() === 'ok' && mockResponse.Message.length) {
        _promotionMsg.classList.remove('d-none');
        rotateMessages(mockResponse.Message, mockResponse.Config);
    } else {
        _promotionMsg.classList.add('d-none');
    }

    function rotateMessages(messages, config) {
        let index = 0;

        function showMessage(msg) {
            _promotionWrapper.style.backgroundColor = msg.BgColor;
            _promotionMsg.className = 'announcement__text promo-animation ' + config.Animation;
            _promotionMsg.textContent = msg.Text;
            _promotionMsg.style.color = msg.TextColor;

            // Trigger reflow
            void _promotionMsg.offsetWidth;

            // Start animation
            setTimeout(() => {
                _promotionMsg.classList.add('show-promotion');
            }, 200);
        }

        showMessage(messages[index]);
        setInterval(() => {
            index = (index + 1) % messages.length;
            showMessage(messages[index]);
        }, config.Duration);
    }
});
