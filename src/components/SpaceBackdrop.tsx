import { useEffect, useRef } from 'react';

/**
 * The moving backdrop: a short silent loop of space behind the whole app.
 *
 * Served from `public/` rather than imported, so it streams instead of being
 * bundled and the browser can start playing before the clip has finished
 * downloading. It is decorative — `aria-hidden`, no controls, no audio track —
 * and it sits under a vignette so cream cards and dim text keep their contrast
 * over the brightest frame of the loop.
 *
 * Three layers: the painted starfield, the drifting video over it, and a light
 * wash that guarantees text contrast. Motion is a preference, not a given —
 * `prefers-reduced-motion` hides only the video, so the painting stays and no
 * screen may depend on the loop being visible.
 */
export function SpaceBackdrop() {
  const ref = useRef<HTMLVideoElement>(null);

  // Browsers pause background tabs, and a paused decorative loop reads as a
  // broken image rather than a still. Nudge it back whenever the tab returns;
  // autoplay policy can still refuse, so the rejection is deliberately ignored.
  useEffect(() => {
    const resume = () => {
      const video = ref.current;
      if (!video || document.hidden) return;
      void video.play().catch(() => {});
    };
    resume();
    document.addEventListener('visibilitychange', resume);
    return () => document.removeEventListener('visibilitychange', resume);
  }, []);

  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop__image" />
      <video
        ref={ref}
        className="backdrop__video"
        src={`${import.meta.env.BASE_URL}media/background.mp4`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <div className="backdrop__scrim" />
    </div>
  );
}
