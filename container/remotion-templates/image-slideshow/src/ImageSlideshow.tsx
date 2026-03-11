import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  Sequence,
} from 'remotion';
import { z } from 'zod';

// Schema for individual slide
const SlideSchema = z.object({
  src: z.string().describe('Image URL or path'),
  caption: z.string().optional().describe('Optional caption for the image'),
  captionPosition: z.enum(['bottom', 'top', 'center']).optional().describe('Caption position'),
});

// Schema for the slideshow
export const ImageSlideshowSchema = z.object({
  slides: z.array(SlideSchema).min(1).describe('Array of images to display'),
  durationPerSlide: z.number().min(1).max(30).optional().describe('Duration per slide in seconds (default: 3)'),
  transition: z.enum(['fade', 'slideLeft', 'slideRight', 'slideUp', 'slideDown', 'zoom', 'wipe']).optional().describe('Transition effect'),
  transitionDuration: z.number().min(0.2).max(2).optional().describe('Transition duration in seconds (default: 0.5)'),
  backgroundColor: z.string().optional().describe('Background color (hex)'),
  captionStyle: z.object({
    fontSize: z.number().optional(),
    fontFamily: z.string().optional(),
    color: z.string().optional(),
    backgroundColor: z.string().optional(),
    backgroundOpacity: z.number().min(0).max(1).optional(),
  }).optional().describe('Caption styling'),
  fitMode: z.enum(['cover', 'contain', 'fill']).optional().describe('How images fit the frame'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1', '4:3']).optional().describe('Output aspect ratio'),
});

type Slide = z.infer<typeof SlideSchema>;
type ImageSlideshowProps = z.infer<typeof ImageSlideshowSchema>;

// Transition calculations
const transitions = {
  fade: (progress: number) => ({
    opacity: progress,
    x: 0,
    y: 0,
    scale: 1,
  }),
  slideLeft: (progress: number) => ({
    opacity: 1,
    x: interpolate(progress, [0, 1], [100, 0]),
    y: 0,
    scale: 1,
  }),
  slideRight: (progress: number) => ({
    opacity: 1,
    x: interpolate(progress, [0, 1], [-100, 0]),
    y: 0,
    scale: 1,
  }),
  slideUp: (progress: number) => ({
    opacity: 1,
    x: 0,
    y: interpolate(progress, [0, 1], [100, 0]),
    scale: 1,
  }),
  slideDown: (progress: number) => ({
    opacity: 1,
    x: 0,
    y: interpolate(progress, [0, 1], [-100, 0]),
    scale: 1,
  }),
  zoom: (progress: number) => ({
    opacity: interpolate(progress, [0, 0.5, 1], [0, 1, 1]),
    x: 0,
    y: 0,
    scale: interpolate(progress, [0, 1], [0.8, 1]),
  }),
  wipe: (progress: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
  }),
};

// Single slide component
const Slide: React.FC<{
  slide: Slide;
  index: number;
  totalSlides: number;
  slideDurationFrames: number;
  transitionFrames: number;
  transition: keyof typeof transitions;
  captionStyle: NonNullable<ImageSlideshowProps['captionStyle']>;
  fitMode: NonNullable<ImageSlideshowProps['fitMode']>;
}> = ({
  slide,
  index,
  totalSlides,
  slideDurationFrames,
  transitionFrames,
  transition,
  captionStyle,
  fitMode,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const startFrame = index * slideDurationFrames;
  const endFrame = startFrame + slideDurationFrames;
  const transitionProgress = Math.min(1, Math.max(0, (frame - startFrame) / transitionFrames));
  const exitProgress = Math.min(1, Math.max(0, (frame - (endFrame - transitionFrames)) / transitionFrames));

  const isEntering = frame >= startFrame && frame < startFrame + transitionFrames;
  const isExiting = frame >= endFrame - transitionFrames && frame < endFrame;

  let transform = { opacity: 1, x: 0, y: 0, scale: 1, clipPath: undefined as string | undefined };

  if (isEntering) {
    const trans = transitions[transition](transitionProgress);
    transform = {
      opacity: trans.opacity,
      x: trans.x,
      y: trans.y,
      scale: trans.scale,
      clipPath: 'clipPath' in trans ? trans.clipPath : undefined,
    };
  }

  // Ken Burns effect - slow zoom/pan during display
  const displayProgress = (frame - startFrame) / slideDurationFrames;
  const kenBurnsScale = interpolate(displayProgress, [0, 1], [1, 1.05]);
  const kenBurnsX = interpolate(displayProgress, [0, 1], [0, index % 2 === 0 ? 2 : -2]);
  const kenBurnsY = interpolate(displayProgress, [0, 1], [0, index % 2 === 0 ? -1 : 1]);

  const objectFit = fitMode === 'fill' ? 'fill' : fitMode === 'contain' ? 'contain' : 'cover';
  const objectPosition = fitMode === 'cover' ? 'center' : undefined;

  const captionFontSize = captionStyle.fontSize || 48;
  const captionFontFamily = captionStyle.fontFamily || 'Inter, sans-serif';
  const captionColor = captionStyle.color || '#ffffff';
  const captionBg = captionStyle.backgroundColor || 'rgba(0,0,0,0.6)';
  const captionBgOpacity = captionStyle.backgroundOpacity ?? 0.6;

  const captionPosition = slide.captionPosition || 'bottom';

  return (
    <AbsoluteFill
      style={{
        backgroundColor: 'transparent',
      }}
    >
      {/* Image */}
      <div
        style={{
          width: '100%',
          height: '100%',
          opacity: transform.opacity,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale * kenBurnsScale})`,
          clipPath: transform.clipPath,
        }}
      >
        <Img
          src={slide.src}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            objectPosition,
            transform: `translate(${kenBurnsX}%, ${kenBurnsY}%)`,
          }}
        />
      </div>

      {/* Caption */}
      {slide.caption && (
        <AbsoluteFill
          style={{
            justifyContent: captionPosition === 'top' ? 'flex-start' : captionPosition === 'center' ? 'center' : 'flex-end',
            alignItems: 'center',
            padding: 60,
          }}
        >
          <div
            style={{
              fontSize: captionFontSize,
              fontFamily: captionFontFamily,
              color: captionColor,
              backgroundColor: `rgba(0,0,0,${captionBgOpacity})`,
              padding: '16px 32px',
              borderRadius: 8,
              textAlign: 'center',
              maxWidth: '80%',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {slide.caption}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const ImageSlideshow: React.FC<ImageSlideshowProps> = ({
  slides,
  durationPerSlide = 3,
  transition = 'fade',
  transitionDuration = 0.5,
  backgroundColor = '#000000',
  captionStyle = {},
  fitMode = 'cover',
}) => {
  const { fps } = useVideoConfig();
  const slideDurationFrames = durationPerSlide * fps;
  const transitionFrames = transitionDuration * fps;

  const mergedCaptionStyle = {
    fontSize: 48,
    fontFamily: 'Inter, sans-serif',
    color: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    backgroundOpacity: 0.6,
    ...captionStyle,
  };

  return (
    <AbsoluteFill style={{ backgroundColor }}>
      {slides.map((slide, index) => (
        <Sequence
          key={index}
          from={index * slideDurationFrames}
          durationInFrames={slideDurationFrames}
        >
          <Slide
            slide={slide}
            index={index}
            totalSlides={slides.length}
            slideDurationFrames={slideDurationFrames}
            transitionFrames={transitionFrames}
            transition={transition}
            captionStyle={mergedCaptionStyle}
            fitMode={fitMode}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};