const balls = [
    {
        name: "Cosmic Stress Ball",
        desc: "A light and squishy foam ball with a Cosmic design. Excellent condition.",
        price: "$20.00",
        size: 100,
        img: "./cosmicball.png"
    }
]

balls.map(b => {
    const url = b.img;
    b.img = new Image();
    b.img.src = url;
})

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const shopButton = document.getElementById("shopBtn");
shopButton.onclick = () => { for (let i = 0; i < 5; i++) spawnBalls() };

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
        })
    }
}

const popUpMenu = document.getElementById("popupMenu")
const popUpImage = document.getElementById("popupImg");
const popUpTitle = document.getElementById("popupTitle");
const popUpDesc = document.getElementById("popupDesc");
const popUpPrice = document.getElementById("popupPrice");
function showPurchase(ball) {
    popUpMenu.style.top = "5%";
    popUpImage.src = ball.data.img.src
    popUpTitle.innerText = ball.data.name
    popUpDesc.innerText = ball.data.desc
    popUpPrice.innerText = ball.data.price;
}

let selectedBall = null;
document.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    for (let i = activeBalls.length - 1; i >= 0; i--) {
        const ball = activeBalls[i];
        const dx = mouseX - ball.x;
        const dy = mouseY - ball.y;
        const radius = ball.data.size / 2;
        if (dx * dx + dy * dy <= radius * radius) {
            showPurchase(ball)
            break;
        }
    }
});

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * .95;
}
window.addEventListener("resize", resize)
resize();

const FORCE_DAMP = 1.25;
const COLLISION_CHECKS = 10;
function draw() {
    requestAnimationFrame(draw);

    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let ball of activeBalls) {
        // fade
        if (ball.alpha < 1) {
            ball.alpha += .05
        }

        // gravity
        ball.vy += .1;

        if (ball.x < ball.data.size / 2) {
            ball.vx *= -1;
            ball.x = ball.data.size / 2;
        } else if (ball.x > canvas.width - ball.data.size / 2) {
            ball.vx *= -1;
            ball.x = canvas.width - ball.data.size / 2;
        }

        if (ball.y < ball.data.sizei / 2) {
            ball.vy *= -1;
            ball.y = ball.data.size / 2;
        } else if (ball.y > canvas.height - ball.data.size / 2) {
            ball.vy *= -1;
            ball.y = canvas.height - ball.data.size / 2;
        }

        // motion
        ball.x += ball.vx;
        ball.y += ball.vy;

        // resist
        ball.vx *= .97;
        ball.vy *= .99;

        for (let i = 0; i < COLLISION_CHECKS; i++) {
            const ranBall = activeBalls[Math.random() * activeBalls.length | 0];
            if (ranBall !== ball) {
                const dx = ranBall.x - ball.x;
                const dy = ranBall.y - ball.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minDist = (ranBall.data.size / 2) + (ball.data.size / 2);
                if (distance < minDist) {
                    if (distance > 0) {
                        ranBall.vx += (dx / distance) * FORCE_DAMP;
                        ranBall.vy += (dy / distance) * FORCE_DAMP;
                    }
                }
            }
        }

        ctx.globalAlpha = ball.alpha;
        ctx.drawImage(ball.data.img, ball.x - ball.data.size / 2, ball.y - ball.data.size / 2, ball.data.size, ball.data.size)
        ctx.globalAlpha = 1;
    }
}
draw();
