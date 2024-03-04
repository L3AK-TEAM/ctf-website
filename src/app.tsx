import { useEffect, useState } from "preact/hooks";
import { useRef } from "preact/hooks";
import "./app.css";

function getTimeUntilDate(date: Date): string {
    const now = new Date().getTime();
    const distance = date.getTime() - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    return `${days} ${days === 1 ? "Day" : "Days"}, ${hours} ${
        hours === 1 ? "Hour" : "Hours"
    }, ${minutes} ${minutes === 1 ? "Minute" : "Minutes"}, and ${seconds} ${
        seconds === 1 ? "Second" : "Seconds"
    }`;
}

export function App() {
    const ctfDate = new Date("May 24, 2024 00:00:00");
    const [countdown, setCountdown] = useState(getTimeUntilDate(ctfDate));

    const backgroundRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateCountdown = () => {
            setCountdown(getTimeUntilDate(ctfDate));
        };

        const countdownInterval = setInterval(updateCountdown, 1000);

        return () => {
            clearInterval(countdownInterval);
        };
    }, []);

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
                    <h1>L3ak CTF starts in</h1>
                    <h2>{countdown}</h2>
                </main>
            </div>
        </>
    );
}
