import { useRef } from "preact/hooks";
import "./app.css";

export function App() {
    const backgroundRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (event: MouseEvent) => {
        if (backgroundRef.current) {
            const { clientX, clientY } = event;
            const { offsetWidth, offsetHeight } = backgroundRef.current;
            const xPos = (clientX / offsetWidth) * -2;
            const yPos = (clientY / offsetHeight) * -2;
            backgroundRef.current.style.backgroundPosition = `${xPos}% ${yPos}%`;
        }
    };

    return (
        <>
            <div
                className="background"
                onMouseMove={handleMouseMove}
                ref={backgroundRef}
            >
                <main className="px-4">
                    <h1>Thank you for playing L3ak CTF 2024!</h1>
                    <h2>We hope to see you again next year :)</h2>
                </main>
            </div>
        </>
    );
}
