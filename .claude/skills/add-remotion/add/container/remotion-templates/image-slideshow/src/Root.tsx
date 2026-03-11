import { Composition } from 'remotion';
import { ImageSlideshow, ImageSlideshowSchema } from './ImageSlideshow';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ImageSlideshow"
        component={ImageSlideshow}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        schema={ImageSlideshowSchema}
        defaultProps={{
          slides: [
            {
              src: 'https://images.unsplash.com/photo-1506744038136-46273834b5fb?w=1920',
              caption: 'Beautiful Landscape',
            },
            {
              src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1920',
              caption: 'Mountain Vista',
            },
            {
              src: 'https://images.unsplash.com/photo-1447752875215-b2761cb3317d?w=1920',
              caption: 'Forest Path',
            },
          ],
          durationPerSlide: 3,
          transition: 'fade',
          transitionDuration: 0.5,
          backgroundColor: '#000000',
          fitMode: 'cover',
        }}
      />
    </>
  );
};