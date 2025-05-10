import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  useTracks,
  TrackReferenceOrPlaceholder,
  VideoTrack,
  AudioTrack,
  ControlBar,
  TrackToggle 
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from 'livekit-client'
import { Mic, MicOff } from "lucide-react"; 
import { Maximize, Minimize } from "lucide-react";

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
  const [wsUrl, setWsUrl] = useState<string>();
  const [token, setToken] = useState<string>();
  const [audioMuted, setAudioMuted] = useState(false);

  useEffect(() => {
    fetch(`/api/token?identity=receptionist&room=${roomName}`)
      .then((r) => r.json())
      .then(({ wsUrl, token }) => {
        setWsUrl(wsUrl);
        setToken(token);
      })
      .catch(console.error);
  }, [roomName]);

  if (!wsUrl || !token) return null;

  return (
    <LiveKitRoom
      serverUrl={wsUrl}
      token={token}
      connectOptions={{ autoSubscribe: true }}
      video={true}
      audio={true}
      publishDefaults={{ simulcast: true }}
      onConnected={(room: any) => {
        console.log("Receptionist connected and can publish tracks.");
      }}
    >
      <div className="relative w-full h-96">
        <VideoGrid audioMuted={audioMuted} />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm font-medium px-2 py-1 rounded">
          {label}  <button style={{ color: 'white', marginTop: '4px' }} 
        onClick={() => setAudioMuted((prev) => !prev)}
        aria-label={audioMuted ? "Unmute" : "Mute"}
      >
        {audioMuted ? <MicOff size={15} /> : <Mic size={15} />}
      </button>
        </div>
        

        
      </div>

      <TrackToggle source={Track.Source.Microphone} style={{ color: 'white' }} />
      <TrackToggle source={Track.Source.Camera} style={{ color: 'white' }} />
    </LiveKitRoom>
  );
}

function VideoGrid({ audioMuted }: { audioMuted: boolean }) {
  const tracks = useTracks();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const remoteVideoTracks = tracks.filter(
    (t) =>
      t.publication.kind === "video" &&
      t.publication.isSubscribed &&
      !t.participant.isLocal
  );

  const remoteAudioTracks = tracks.filter(
    (t) =>
      t.publication.kind === "audio" &&
      t.publication.isSubscribed &&
      !t.participant.isLocal
  );

  const renderAudioTracks = () =>
    remoteAudioTracks.map((trackRef: TrackReferenceOrPlaceholder) => (
      <AudioTrack
        key={trackRef.publication.trackSid}
        trackRef={trackRef}
        muted={audioMuted}
      />
    ));

  return (
    <>
      <div className={`relative w-full h-full ${isFullscreen ? "hidden" : "block"}`}>
        {remoteVideoTracks.map((trackRef) => (
          <VideoTrack
            key={trackRef.publication.trackSid}
            trackRef={trackRef}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ))}
        {renderAudioTracks()}
        <button
  onClick={() => setIsFullscreen(true)}
  className="absolute top-2 right-2 flex items-center gap-1 bg-black bg-opacity-50 text-white text-sm font-medium px-3 py-1 rounded hover:bg-opacity-70 transition"
>
  <Maximize className="w-4 h-4" />
</button>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
          <div className="relative w-full h-full max-w-screen-lg max-h-screen">
            {remoteVideoTracks.map((trackRef) => (
              <VideoTrack
                key={trackRef.publication.trackSid}
                trackRef={trackRef}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ))}
            {renderAudioTracks()}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-sm font-medium px-2 py-1 rounded"
            >
              <Minimize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
