import { Composition } from 'remotion';
import { TextVideo, TextVideoSchema } from './TextVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TextVideo"
        component={TextVideo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        schema={TextVideoSchema}
        defaultProps={{
          text: 'Hello World',
          fontSize: 72,
          fontFamily: 'Inter, sans-serif',
          textColor: '#ffffff',
          backgroundColor: '#1a1a2e',
          animation: 'fadeSlideUp',
        }}
      />
    </>
  );
};