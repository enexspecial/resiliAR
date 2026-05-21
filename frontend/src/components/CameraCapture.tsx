import { useRef, useState } from "react";
import { UI_TOOLTIPS } from "../lib/tooltips";
import { IconCamera } from "./ui/Icons";
import { InfoTip } from "./ui/InfoTip";
import { Tooltip } from "./ui/Tooltip";

interface Props {
  onCapture: (file: File) => void;
  title?: string;
  hint?: string;
}

export function CameraCapture({
  onCapture,
  title = "Take a photo",
  hint = "Good lighting, face the camera directly",
}: Props) {
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

  if (streaming) {
    return (
      <div className="camera-live">
        <video ref={videoRef} playsInline muted />
        <div className="capture-actions capture-actions--row" style={{ padding: "0.75rem" }}>
          <button type="button" className="btn btn--primary" onClick={snap}>
            Use this photo
          </button>
          <button type="button" className="btn btn--secondary" onClick={stopCamera}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="capture-zone">
      <IconCamera className="capture-zone__icon" />
      <p className="capture-zone__title label-with-tip">
        {title}
        <InfoTip content={hint} wide label="Photo tips" />
      </p>
      <p className="capture-zone__hint">{hint}</p>
      <div className="capture-actions">
        <button type="button" className="btn btn--primary" onClick={startCamera}>
          Open camera
        </button>
        <Tooltip content={UI_TOOLTIPS.uploadGallery} position="top">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => inputRef.current?.click()}
          >
            Upload from gallery
          </button>
        </Tooltip>
      </div>
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
