document.addEventListener('DOMContentLoaded', () => {
    async function loadParticles() {
        await tsParticles.load("tsparticles", {
            "background": {
                "color": "#0b0f14"
            },
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#ffffff"
                },
                "shape": {
                    "type": "circle"
                },
                "opacity": {
                    "value": 0.5,
                    "random": true
                },
                "size": {
                    "value": 3,
                    "random": true
                },
                "move": {
                    "enable": true,
                    "speed": 0.5,
                    "direction": "none",
                    "out_mode": "out",
                    "random": true,
                    "straight": false
                }
            },
            "interactivity": {
                "events": {
                    "onHover": {
                        "enable": false
                    },
                    "onClick": {
                        "enable": false
                    }
                }
            }
        });
    }

    loadParticles();
});
