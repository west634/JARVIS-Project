/**
 * Plays streamed MP3 responses from the backend. Prefers MediaSource so
 * playback can begin before the whole clip has arrived; falls back to
 * buffering the full response when MediaSource / the mime type isn't
 * supported (e.g. some WebKit builds). Wires the element through a
 * WebAudio AnalyserNode so the visualizer can react to real playback
 * amplitude instead of a synthetic animation.
 */
export class StreamingAudioPlayer {
  private audio: HTMLAudioElement;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private levelBuffer: Uint8Array<ArrayBuffer> | null = null;
  private activeObjectUrl: string | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.crossOrigin = "anonymous";
  }

  private ensureGraph() {
    if (this.audioCtx) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new Ctor();
    this.sourceNode = this.audioCtx.createMediaElementSource(this.audio);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;
    this.sourceNode.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    this.levelBuffer = new Uint8Array(this.analyser.frequencyBinCount);
  }

  /** RMS amplitude of the current playback, 0..1. */
  getLevel(): number {
    if (!this.analyser || !this.levelBuffer) return 0;
    this.analyser.getByteTimeDomainData(this.levelBuffer);
    let sumSquares = 0;
    for (const sample of this.levelBuffer) {
      const normalized = (sample - 128) / 128;
      sumSquares += normalized * normalized;
    }
    return Math.sqrt(sumSquares / this.levelBuffer.length);
  }

  private cleanupObjectUrl() {
    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }
  }

  async play(response: Response, onEnded: () => void): Promise<void> {
    this.ensureGraph();
    await this.audioCtx?.resume();
    this.stop();

    const canUseMediaSource =
      "MediaSource" in window && MediaSource.isTypeSupported("audio/mpeg") && response.body;

    if (canUseMediaSource) {
      await this.playViaMediaSource(response, onEnded);
    } else {
      await this.playViaBlob(response, onEnded);
    }
  }

  private async playViaMediaSource(response: Response, onEnded: () => void): Promise<void> {
    const mediaSource = new MediaSource();
    const url = URL.createObjectURL(mediaSource);
    this.activeObjectUrl = url;
    this.audio.src = url;

    await new Promise<void>((resolve) => {
      mediaSource.addEventListener(
        "sourceopen",
        () => {
          const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
          const reader = response.body!.getReader();
          const queue: Uint8Array[] = [];
          let readerDone = false;

          const pump = () => {
            if (sourceBuffer.updating) return;
            if (queue.length > 0) {
              sourceBuffer.appendBuffer(queue.shift()! as BufferSource);
              return;
            }
            if (readerDone && mediaSource.readyState === "open") {
              try {
                mediaSource.endOfStream();
              } catch {
                // already closed
              }
            }
          };

          sourceBuffer.addEventListener("updateend", pump);

          (async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) {
                  readerDone = true;
                  pump();
                  break;
                }
                if (value) queue.push(new Uint8Array(value));
                pump();
              }
            } catch {
              readerDone = true;
            }
          })();

          resolve();
        },
        { once: true }
      );
    });

    this.audio.onended = () => {
      this.cleanupObjectUrl();
      onEnded();
    };
    await this.audio.play();
  }

  private async playViaBlob(response: Response, onEnded: () => void): Promise<void> {
    const buffer = await response.arrayBuffer();
    const blob = new Blob([buffer], { type: "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    this.activeObjectUrl = url;
    this.audio.src = url;
    this.audio.onended = () => {
      this.cleanupObjectUrl();
      onEnded();
    };
    await this.audio.play();
  }

  stop(): void {
    this.audio.onended = null;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.cleanupObjectUrl();
  }

  get isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }
}
