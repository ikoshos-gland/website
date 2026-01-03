import React, { useState, useEffect } from 'react';

interface ScrambleTextProps {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
}

// Gentle fade-in animation that works with gradient text
const ScrambleText: React.FC<ScrambleTextProps> = ({
    text,
    className = '',
    delay = 0
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <span
            className={className}
            style={{
                // Inherit parent's gradient
                backgroundImage: 'inherit',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                // Animation
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
                display: 'inline-block',
            }}
        >
            {text}
        </span>
    );
};

export default ScrambleText;
