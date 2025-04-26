// pages/index.tsx
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
} from "@livekit/components-react";
import "@livekit/components-styles";

const PROPERTY_ROOMS = ["property-101", "property-102", "property-103"];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <h1 className="sr-only">Receptionist Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROPERTY_ROOMS.map((roomName) => (
          <div key={roomName} className="relative bg-black rounded overflow-hidden">
            <PropertyFeed roomName={roomName} label={roomName} />
          </div>
        ))}
      </div>
    </div>
  );
}

function PropertyFeed({ roomName, label }: { roomName: string; label: string }) {
  const [token, setToken] = useState<string>();
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  useEffect(() => {
    fetch(`/api/token?identity=receptionist&room=${roomName}`)
      .then((r) => r.json())
      .then((data) => setToken(data.token))
      .catch(console.error);
  }, [roomName]);

  if (!token) return null;

  return (
    <LiveKitRoom serverUrl={serverUrl} token={token} connectOptions={{ autoSubscribe: true }}>
      <div className="relative w-full h-96">
        <VideoGrid />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm font-medium px-2 py-1 rounded">
          {label}
        </div>
      </div>
    </LiveKitRoom>
  );
}

function VideoGrid() {
  const tracks = useTracks(); // fetch all tracks

  const videoTracks = tracks.filter(
    (t) => t.publication.kind === "video" && t.publication.isSubscribed
  );

  if (videoTracks.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full text-white">
        No video feed
      </div>
    );
  }

  return (
    <>
      {videoTracks.map((trackRef: TrackReferenceOrPlaceholder) => (
        <VideoTrack
          key={trackRef.publication.trackSid}
          trackRef={trackRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ))}
    </>
  );
}
