import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill } from 'remotion';
import { z } from 'zod';

export const TextVideoSchema = z.object({
  text: z.string().describe('The text to display'),
  fontSize: z.number().min(12).max(200).optional().describe('Font size in pixels'),
  fontFamily: z.string().optional().describe('Font family'),
  textColor: z.string().optional().describe('Text color (hex)'),
  backgroundColor: z.string().optional().describe('Background color (hex)'),
  animation: z.enum(['fadeSlideUp', 'fadeSlideDown', 'fadeIn', 'scale']).optional().describe('Animation type'),
});

type TextVideoProps = z.infer<typeof TextVideoSchema>;

const animations = {
  fadeSlideUp: (frame: number, fps: number) => ({
    opacity: interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' }),
    y: interpolate(frame, [0, fps], [100, 0], { extrapolateRight: 'clamp' }),
    scale: 1,
  }),
  fadeSlideDown: (frame: number, fps: number) => ({
    opacity: interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' }),
    y: interpolate(frame, [0, fps], [-100, 0], { extrapolateRight: 'clamp' }),
    scale: 1,
  }),
  fadeIn: (frame: number, fps: number) => ({
    opacity: interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' }),
    y: 0,
    scale: 1,
  }),
  scale: (frame: number, fps: number) => ({
    opacity: interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' }),
    y: 0,
    scale: interpolate(frame, [0, fps], [0.5, 1], { extrapolateRight: 'clamp' }),
  }),
};

export const TextVideo: React.FC<TextVideoProps> = ({
  text,
  fontSize = 72,
  fontFamily = 'Inter, sans-serif',
  textColor = '#ffffff',
  backgroundColor = '#1a1a2e',
  animation = 'fadeSlideUp',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animationConfig = animations[animation];
  const { opacity, y, scale } = animationConfig(frame, fps);

  // Calculate text wrapping for longer text
  const lines = text.split('\n').length > 1 ? text.split('\n') : [text];

  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px) scale(${scale})`,
          textAlign: 'center',
        }}
      >
        {lines.map((line, index) => (
          <div
            key={index}
            style={{
              fontSize,
              color: textColor,
              fontWeight: 'bold',
              lineHeight: 1.3,
              textShadow: `0 4px 20px rgba(0,0,0,0.5)`,
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};