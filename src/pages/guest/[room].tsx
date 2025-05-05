import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  Room,
  createLocalAudioTrack,
  createLocalVideoTrack,
  VideoPresets,
} from "livekit-client";

export default function GuestPage() {
  const { room } = useRouter().query as { room?: string };
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  useEffect(() => {
    if (!room) return;

    const connectToRoom = async () => {
      setStatus("connecting");
      try {
        // Fetch token and server URL from API
        const res = await fetch(`/api/token?identity=guest-${room}&room=${room}`);
        const { wsUrl, token } = await res.json();

        console.log("Received token and wsUrl", { wsUrl, token });

        // Connect to LiveKit
        const lkRoom = new Room();
        await lkRoom.connect(wsUrl, token);

        // Create local video and audio tracks
        const videoTrack = await createLocalVideoTrack({
          resolution: VideoPresets.h180.resolution,
        });
        const audioTrack = await createLocalAudioTrack();

        // Publish tracks to the room
        await lkRoom.localParticipant.publishTrack(videoTrack);
        await lkRoom.localParticipant.publishTrack(audioTrack);

        // Attach local video preview (muted)
        if (videoContainerRef.current) {
          const videoElement = videoTrack.attach();
          videoElement.className = "w-full h-full object-cover rounded-md";
          videoElement.muted = true; // Prevent feedback
          videoElement.autoplay = true;
          videoElement.playsInline = true;

          // Clear previous children and add new video
          videoContainerRef.current.innerHTML = "";
          videoContainerRef.current.appendChild(videoElement);
        }

        setStatus("connected");
      } catch (err) {
        console.error("Guest connect error:", err);
        setStatus("error");
      }
    };

    connectToRoom();

    return () => {
      // Clean up if needed
    };
  }, [room]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Guest Stream: {room}</h1>
      <div
        ref={videoContainerRef}
        className="w-full max-w-md aspect-video bg-black rounded-md overflow-hidden shadow-lg"
      />
      <p className="mt-4 text-sm text-gray-600">
        Status: <span className="font-semibold">{status}</span>
      </p>
    </div>
  );
}
