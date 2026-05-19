import { useRef, useState } from "react";

interface Props {
  onCapture: (file: File) => void;
  label?: string;
}

export function CameraCapture({ onCapture, label = "Take photo" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch {
      inputRef.current?.click();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStreaming(false);
  };

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(new File([blob], "capture.jpg", { type: "image/jpeg" }));
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onCapture(file);
    e.target.value = "";
  };

  return (
    <div className="camera-capture">
      {streaming ? (
        <div className="camera-live">
          <video ref={videoRef} playsInline muted />
          <div className="camera-actions">
            <button type="button" className="btn primary" onClick={snap}>
              Capture
            </button>
            <button type="button" className="btn ghost" onClick={stopCamera}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="camera-actions">
          <button type="button" className="btn primary" onClick={startCamera}>
            {label}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={() => inputRef.current?.click()}
          >
            Upload image
          </button>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={onFile}
      />
    </div>
  );
}
