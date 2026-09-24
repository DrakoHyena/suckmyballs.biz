const balls = [
    {
        name: "Cosmic Stress Ball",
        desc: "A light and squishy foam ball with a Cosmic design. Excellent condition.",
        price: "$20.00",
        size: 80,
        img: "/assets/cosmicball.png"
    }
];

balls.forEach(b => {
    const url = b.img;
    b.img = new Image();
    b.img.src = url;
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// --- Device Orientation & Gravity Setup ---
let gravityX = 0;
let gravityY = 0.3; // default downward gravity when flat/unsupported

function handleOrientation(event) {
    // gamma: left-to-right tilt in degrees [-90, 90]
    // beta: front-to-back tilt in degrees [-180, 180]
    const gamma = event.gamma || 0;
    const beta = event.beta || 90;
    // Scale down values to control gravity strength
    const SENSITIVITY = 0.01;
    gravityX = gamma * SENSITIVITY;
    gravityY = beta * SENSITIVITY;
}

// Request permission (Required for iOS 13+)
function initOrientation() {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
            .then(state => {
                if (state === "granted") {
                    window.addEventListener("deviceorientation", handleOrientation);
                }
            })
            .catch(console.error);
    } else {
        // Standard Android / Desktop / Older iOS
        window.addEventListener("deviceorientation", handleOrientation);
    }
}

// Initialize orientation on first user interaction
window.addEventListener("click", initOrientation, { once: true });
window.addEventListener("touchstart", initOrientation, { once: true });

const shopButton = document.getElementById("shopBtn");
shopButton.onclick = () => { for (let i = 0; i < 5; i++) spawnBalls(); };

const closeShopButton = document.getElementById("closeShopButton");
closeShopButton.onclick = hidePurchase;

const activeBalls = [];
function spawnBalls() {
    for (let ball of balls) {
        activeBalls.push({
            data: ball,
            x: canvas.width * Math.random(),
            y: ball.size,
            vx: 0,
            vy: 0,
            alpha: 0
        });
    }
}
for (let i = 0; i < 5; i++) spawnBalls();


const popUpMenu = document.getElementById("popupMenu");
const popUpImage = document.getElementById("popupImg");
const popUpTitle = document.getElementById("popupTitle");
const popUpDesc = document.getElementById("popupDesc");
const popUpPrice = document.getElementById("popupPrice");

function showPurchase(ball) {
    popUpMenu.style.top = "50%";
    popUpImage.src = ball.data.img.src;
    popUpTitle.innerText = ball.data.name;
    popUpDesc.innerText = ball.data.desc;
    popUpPrice.innerText = ball.data.price;
}

function hidePurchase() {
    popUpMenu.style.top = "-50%";
}

window.addEventListener("pointerdown", (e) => {
    // 1. Ignore clicks if the user tapped on the shop button or inside the popup menu
    if (e.target.closest("#shopBtn, #popupMenu")) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    // 2. Ignore clicks that happen outside the canvas boundary
    if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
    ) {
        return;
    }

    // 3. Convert client CSS coordinates to internal canvas coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // 4. Hit detection with a small forgiveness buffer for moving targets
    const HIT_BUFFER = 8;

    for (let i = activeBalls.length - 1; i >= 0; i--) {
        const ball = activeBalls[i];
        const dx = clickX - ball.x;
        const dy = clickY - ball.y;
        const radius = (ball.data.size / 2) + HIT_BUFFER;

        if (dx * dx + dy * dy <= radius * radius) {
            showPurchase(ball);
            break; // Open purchase for the topmost ball only
        }
    }
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.95;
}
window.addEventListener("resize", resize);
resize();

const FORCE_DAMP = 2;
const COLLISION_CHECKS = 10;

const grad = ctx.createLinearGradient(0, 0, 0, 5);
grad.addColorStop(0, "red");
grad.addColorStop(0.3, "red");
grad.addColorStop(0.5, "deeppink");
grad.addColorStop(0.7, "red");
grad.addColorStop(1, "red");

function draw() {
    requestAnimationFrame(draw);

    ctx.fillStyle = grad;
    ctx.save();
    ctx.scale(canvas.width / 5, canvas.height / 5)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    for (let ball of activeBalls) {
        if (ball.alpha < 1) {
            ball.alpha += 0.025;
        }

        // Apply dynamic orientation gravity
        ball.vx += gravityX;
        ball.vy += gravityY;

        // Bounce off walls (X axis)
        if (ball.x < ball.data.size / 2) {
            ball.vx *= -0.7; // add slight bounce damping
            ball.x = ball.data.size / 2;
        } else if (ball.x > canvas.width - ball.data.size / 2) {
            ball.vx *= -0.7;
            ball.x = canvas.width - ball.data.size / 2;
        }

        // Bounce off walls (Y axis)
        if (ball.y < ball.data.size / 2) {
            ball.vy *= -0.7;
            ball.y = ball.data.size / 2;
        } else if (ball.y > canvas.height - ball.data.size / 2) {
            ball.vy *= -0.7;
            ball.y = canvas.height - ball.data.size / 2;
        }

        // Motion
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Air Resistance / Friction
        ball.vx *= 0.98;
        ball.vy *= 0.98;

        // Ball-to-ball collisions
        for (let i = 0; i < COLLISION_CHECKS; i++) {
            const ranBall = activeBalls[Math.random() * activeBalls.length | 0];
            if (ranBall !== ball) {
                const dx = ranBall.x - ball.x;
                const dy = ranBall.y - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = (ranBall.data.size / 2) + (ball.data.size / 2);
                if (distance < minDist && distance > 0) {
                    ranBall.vx += (dx / distance) * FORCE_DAMP;
                    ranBall.vy += (dy / distance) * FORCE_DAMP;
                }
            }
        }

        ctx.globalAlpha = ball.alpha;
        ctx.drawImage(
            ball.data.img,
            ball.x - ball.data.size / 2,
            ball.y - ball.data.size / 2,
            ball.data.size,
            ball.data.size
        );
        ctx.globalAlpha = 1;
    }
}
draw();
