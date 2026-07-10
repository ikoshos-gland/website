import React from 'react';

interface ScrambleTextProps {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
}

// Single-paint gradient text with a reliable CSS entrance animation.
// It paints the gradient itself (the wrapper only supplies the CSS vars) so the
// glyphs are drawn exactly once — the previous double-paint (wrapper + this span
// both using background-clip:text) produced a ghosted, offset "M".
const ScrambleText: React.FC<ScrambleTextProps> = ({
    text,
    className = '',
    delay = 0,
    duration = 600,
}) => {
    return (
        <span
            className={className}
            style={{
                backgroundImage:
                    'linear-gradient(135deg, var(--text-gradient-start, #e0e0e0), var(--text-gradient-end, #909090))',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: 'drop-shadow(0 4px 5px rgba(0, 0, 0, 0.5))',
                display: 'inline-block',
                // `both` fill-mode holds the start state during the delay and the
                // end state afterwards, so the text always settles fully visible.
                animation: `heroWordFade ${duration}ms ease-out ${delay}ms both`,
            }}
        >
            {text}
        </span>
    );
};

export default ScrambleText;
