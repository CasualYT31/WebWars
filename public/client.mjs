/**
 * @file client.mjs
 * The entry point for a WebWars client.
 */

// React testing.

function Counter() {
    const [count, setCount] = React.useState(0);
    return (
        <>
            <h1 style={{ color: "white" }}>{count}</h1>
            <button onClick={() => setCount(count + 1)}>Increment</button>
        </>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Counter />);

// Phaser testing.

class Example extends Phaser.Scene {
    preload() {
        this.load.setBaseURL("https://labs.phaser.io");

        this.load.image("sky", "assets/skies/space3.png");
        this.load.image("logo", "assets/sprites/phaser3-logo.png");
        this.load.image("red", "assets/particles/red.png");
    }

    create() {
        this.add.image(400, 300, "sky");

        const particles = this.add.particles(0, 0, "red", {
            speed: 100,
            scale: { start: 1, end: 0 },
            blendMode: "ADD",
        });

        const logo = this.physics.add.image(400, 100, "logo");

        logo.setVelocity(100, 200);
        logo.setBounce(1, 1);
        logo.setCollideWorldBounds(true);

        particles.startFollow(logo);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    // Credit where it's due: https://stackoverflow.com/a/60216568.
    scale: {
        // Fit to window.
        mode: Phaser.Scale.FIT,
        // Center vertically and horizontally.
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: Example,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 200 },
        },
    },
};

const game = new Phaser.Game(config);

/**
 * Whenever the Phaser canvas resizes, we need to resize the React UI layer to match it.
 */
game.renderer.onResize = function () {
    const reactRoot = document.getElementById("root");
    const phaserCanvas = document.querySelector("canvas");
    reactRoot.style.width = phaserCanvas.style.width;
    reactRoot.style.height = phaserCanvas.style.height;
    reactRoot.style.marginLeft = phaserCanvas.style.marginLeft;
    reactRoot.style.marginTop = phaserCanvas.style.marginTop;
};
