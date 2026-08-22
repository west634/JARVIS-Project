import { useCallback, useRef, useState } from "react";
import { StreamingAudioPlayer } from "../services/audioPlayback";

export function useAudioPlayer() {
  const playerRef = useRef<StreamingAudioPlayer | null>(null);
  const rafRef = useRef<number | null>(null);
  const [level, setLevel] = useState(0);

  const getPlayer = () => {
    if (!playerRef.current) playerRef.current = new StreamingAudioPlayer();
    return playerRef.current;
  };

  const trackLevel = useCallback(() => {
    const player = getPlayer();
    const tick = () => {
      setLevel(player.getLevel());
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stopTrackingLevel = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLevel(0);
  }, []);

  const play = useCallback(
    (response: Response) =>
      new Promise<void>((resolve, reject) => {
        const player = getPlayer();
        trackLevel();
        player
          .play(response, () => {
            stopTrackingLevel();
            resolve();
          })
          .catch((err) => {
            stopTrackingLevel();
            reject(err);
          });
      }),
    [trackLevel, stopTrackingLevel]
  );

  const stop = useCallback(() => {
    playerRef.current?.stop();
    stopTrackingLevel();
  }, [stopTrackingLevel]);

  return { play, stop, level };
}
