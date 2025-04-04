class AnimatedBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d");
        this.particles = [];
        this.init();
    }

    init() {
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        window.addEventListener("resize", () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.particles = [];
        this.createParticles();
    }

    createParticles() {
        for (let i = 0; i < 50; i++) {
            let size = Math.random() * 5 + 2;
            let x = Math.random() * this.canvas.width;
            let y = Math.random() * this.canvas.height;
            let speedX = (Math.random() - 0.5) * 2;
            let speedY = (Math.random() - 0.5) * 2;
            this.particles.push(new Particle(x, y, size, speedX, speedY, this.ctx));
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((particle) => {
            particle.update();
            particle.draw();
        });

        requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    constructor(x, y, size, speedX, speedY, ctx) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = speedX;
        this.speedY = speedY;
        this.ctx = ctx;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > window.innerWidth || this.x < 0) this.speedX *= -1;
        if (this.y > window.innerHeight || this.y < 0) this.speedY *= -1;
    }

    draw() {
        let gradient = this.ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
        gradient.addColorStop(0, "#00ffcc");
        gradient.addColorStop(1, "#0055ff");

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

// Iniciar la animación al cargar la página
document.addEventListener("DOMContentLoaded", () => {
    new AnimatedBackground("background");
});
