import { useRef, useState, useEffect } from "preact/hooks";
import * as THREE from "three";
import "./app.css";

const targetDate = new Date("2025-07-11T17:00:00Z").getTime();

export function App() {
    const mountRef = useRef<HTMLDivElement>(null);
    const [timeLeft, setTimeLeft] = useState(getTimeRemaining());

    function getTimeRemaining() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            return {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                expired: true,
            };
        }

        return {
            days: Math.floor(distance / (1000 * 60 * 60 * 24)),
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000),
            expired: false,
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(getTimeRemaining());
        }, 1000);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current!.appendChild(renderer.domElement);

        const backgroundGeometry = new THREE.PlaneGeometry(200, 200);
        const backgroundMaterial = new THREE.ShaderMaterial({
            vertexShader: `
                void main() {
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec2 u_resolution;
                uniform float u_time;
                void main() {
                    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
                    float n = sin(uv.x * 5.0 + uv.y * 5.0 + u_time) * 0.02 + 0.98; // Very subtle noise, darker base
                    vec3 color = vec3(
                        0.05 + sin(u_time * 0.1) * 0.02, // Very dark purple-blue
                        0.03 + cos(u_time * 0.15) * 0.02, // Very dark blue-magenta
                        0.02 + 0.01                        // Deep black base
                    ) * n;
                    gl_FragColor = vec4(color, 0.9); // Slightly higher opacity for depth
                }
            `,
            uniforms: {
                u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                u_time: { value: 0.0 }
            },
            transparent: true
        });
        const background = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        background.position.z = -50;
        scene.add(background);

        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 8000;
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 100;
            colors[i] = Math.random() * 0.6 + 0.4;
        }

        particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending 
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        const dustTrails: THREE.Points[] = [];
        const dustGeometry = new THREE.BufferGeometry();
        const dustCount = 2000;
        const dustPositions = new Float32Array(dustCount * 3);
        const dustColors = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount * 3; i++) {
            dustPositions[i] = (Math.random() - 0.5) * 80;
            dustColors[i] = Math.random() * 0.3 + 0.1;
        }

        dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
        dustGeometry.setAttribute("color", new THREE.BufferAttribute(dustColors, 3));

        const dustMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        function spawnDustTrail() {
            const dust = new THREE.Points(dustGeometry, dustMaterial);
            dust.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60 - 40
            );
            dust.userData.velocity = {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: Math.random() * 0.02
            };
            scene.add(dust);
            dustTrails.push(dust);
            setTimeout(spawnDustTrail, Math.random() * 5000 + 2000);
        }
        spawnDustTrail();

        camera.position.z = 5;

        let mouseX = 0;
        let mouseY = 0;
        const movementSensitivity = 0.03;
        const minZ = 2;
        const maxZ = 15;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (event.clientY / window.innerHeight - 0.5) * 2;
        };

        window.addEventListener("mousemove", handleMouseMove);

        let time = 0;
        function animate() {
            requestAnimationFrame(animate);

            particles.rotation.y += 0.0004;
            particles.rotation.x += 0.00015;

            const targetX = mouseX * movementSensitivity * 8;
            const targetY = -mouseY * movementSensitivity * 6;
            const targetZ = 5 + (mouseY * movementSensitivity * -12);

            camera.position.x += (targetX - camera.position.x) * 0.08;
            camera.position.y += (targetY - camera.position.y) * 0.08;
            camera.position.z += (targetZ - camera.position.z) * 0.08;
            camera.position.z = Math.max(minZ, Math.min(maxZ, camera.position.z));

            dustTrails.forEach((dust) => {
                dust.position.x += dust.userData.velocity.x;
                dust.position.y += dust.userData.velocity.y;
                dust.position.z += dust.userData.velocity.z;
                if (dust.position.z > 10 || dust.position.distanceTo(camera.position) > 100) {
                    scene.remove(dust);
                    dustTrails.splice(dustTrails.indexOf(dust), 1);
                }
            });

            time += 0.01;
            backgroundMaterial.uniforms.u_time.value = time;

            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        }

        animate();

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            backgroundMaterial.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            clearInterval(timer);
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            mountRef.current!.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div className="background">
            <div ref={mountRef} className="absolute inset-0" />
            <main className="px-4 relative z-10">
                <h1 className="mb-4 font-extrabold">L3ak CTF 2025</h1>
                {timeLeft.expired ? (
                    <h2>The event has started!</h2>
                ) : (
                    <>
                        <h2>Countdown to Start:</h2>
                        <div className="timer-grid">
                            <div className="timer-unit">
                                <span>{timeLeft.days}</span>
                                <span>Days</span>
                            </div>
                            <div className="timer-unit">
                                <span>{timeLeft.hours}</span>
                                <span>Hours</span>
                            </div>
                            <div className="timer-unit">
                                <span>{timeLeft.minutes}</span>
                                <span>Minutes</span>
                            </div>
                            <div className="timer-unit">
                                <span>{timeLeft.seconds}</span>
                                <span>Seconds</span>
                            </div>
                        </div>
                        <p className="mt-4">Starts: Friday, 11 July 2025, 17:00 UTC</p>
                        <p className="mt-2 text-blue-600">More details at <a href="https://ctftime.org/event/2629" target="_blank" rel="noopener noreferrer">ctftime</a>!</p>
                        <div className="mt-6 flex justify-center gap-6">
                            <a href="https://x.com/l3akctf" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a href="https://discord.gg/3QGaF45wab" target="_blank" rel="noopener noreferrer" className="text-white hover:text-gray-300">
                                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                </svg>
                            </a>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}