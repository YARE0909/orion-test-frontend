import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import {
  Room,
  createLocalAudioTrack,
  createLocalVideoTrack,
  VideoPresets,
  RemoteParticipant,
  RemoteTrackPublication,
  RemoteVideoTrack,
  Track,
} from "livekit-client";
import { Mic, MicOff } from "lucide-react"; 

export default function GuestPage() {
  const { room } = useRouter().query as { room?: string };
  const guestVideoRef = useRef<HTMLDivElement>(null);
  const receptionistVideoRef = useRef<HTMLDivElement>(null);
  const receptionistVideoActive = useRef(false);

  const lkRoomRef = useRef<Room | null>(null);
  const localAudioTrackRef = useRef<Track | null>(null);

  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!room) return;

    const connectToRoom = async () => {
      setStatus("connecting");

      try {
        const res = await fetch(`/api/token?identity=guest-${room}&room=${room}`);
        const { wsUrl, token } = await res.json();

        const lkRoom = new Room();

        lkRoom.on("participantConnected", handleRemoteParticipant);
        lkRoom.on("trackPublished", handleTrackPublished);

        await lkRoom.connect(wsUrl, token);

        const videoTrack = await createLocalVideoTrack({
          resolution: VideoPresets.h180.resolution,
        });
        const audioTrack = await createLocalAudioTrack();
        
        await lkRoom.localParticipant.publishTrack(videoTrack, { simulcast: true });
        await lkRoom.localParticipant.publishTrack(audioTrack, { simulcast: true });

        localAudioTrackRef.current = audioTrack; 

        lkRoomRef.current = lkRoom;

        if (guestVideoRef.current) {
          const videoElement = videoTrack.attach();
          videoElement.className = "w-full h-full object-cover rounded-md";
          videoElement.muted = true;
          guestVideoRef.current.innerHTML = "";
          guestVideoRef.current.appendChild(videoElement);
        }

        // Set fallback initially
        clearReceptionistVideo();

        setStatus("connected");

        // Handle already connected participants
        lkRoom.remoteParticipants.forEach((p) => {
          handleRemoteParticipant(p);
        });
        

        function handleRemoteParticipant(p: RemoteParticipant) {
          if (!p.identity.startsWith("receptionist")) return;

          p.on("trackSubscribed", (track, pub) => {
            if (track.kind === Track.Kind.Video) {
              renderReceptionistVideo(track as RemoteVideoTrack);
            } else if (track.kind === Track.Kind.Audio) {
              // Attach remote audio track
              const audioEl = track.attach();
              audioEl.autoplay = true;
              audioEl.controls = false;
              audioEl.style.display = "none"; // Hide the audio element
              document.body.appendChild(audioEl);
            }
          });
          
          p.on("trackUnsubscribed", (track, pub) => {
            if (track.kind === Track.Kind.Video) {
              clearReceptionistVideo();
            } else if (track.kind === Track.Kind.Audio) {
              track.detach().forEach(el => el.remove());
            }
          });

          // Render already subscribed tracks
          p.trackPublications.forEach((pub) => {
            if (pub.kind === Track.Kind.Video && pub.isSubscribed && pub.track) {
              renderReceptionistVideo(pub.track as RemoteVideoTrack);
            } else if (pub.kind === Track.Kind.Audio && pub.isSubscribed && pub.track) {
              const audioEl = pub.track.attach();
              audioEl.autoplay = true;
              audioEl.controls = false;
              audioEl.style.display = "none";
              document.body.appendChild(audioEl);
            }
          });
        }

        function handleTrackPublished(pub: RemoteTrackPublication, participant: RemoteParticipant) {
          if (participant.identity.startsWith("receptionist") && pub.kind === Track.Kind.Video && pub.isSubscribed) {
            const track = pub.track as RemoteVideoTrack;
            renderReceptionistVideo(track);
          }
        }

        function renderReceptionistVideo(track: RemoteVideoTrack) {
          receptionistVideoActive.current = true;

          if (receptionistVideoRef.current) {
            receptionistVideoRef.current.innerHTML = "";
            const el = track.attach();
            el.className = "w-full h-full object-cover rounded-md";
            receptionistVideoRef.current.appendChild(el);
          }
        }

        function clearReceptionistVideo() {
          receptionistVideoActive.current = false;

          if (receptionistVideoRef.current) {
            receptionistVideoRef.current.innerHTML = `
              <div class="text-white text-center mt-12 text-lg">Virtual Receptionist</div>
            `;
          }
        }
      } catch (err) {
        console.error("Guest connect error:", err);
        setStatus("error");
      }
    };

    connectToRoom();

    return () => {
      // Optionally: add disconnect logic
    };
  }, [room]);

  const handleToggleMute = () => {
    const audioTrack = localAudioTrackRef.current;
    if (audioTrack) {
      if (isMuted) {
        audioTrack.enable();
      } else {
        audioTrack.disable();
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Guest Stream: {room}</h1>

      <div
        className="w-full max-w-md aspect-video bg-black rounded-md overflow-hidden shadow-md"
        ref={guestVideoRef}
      />

      <div
        className="w-full max-w-md aspect-video bg-gray-800 rounded-md overflow-hidden shadow-md flex items-center justify-center"
        ref={receptionistVideoRef}
      >
        <div className="text-white text-center">Waiting for receptionist...</div>
      </div>

      <div className="mt-4">
      <button
        onClick={handleToggleMute}
        className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
    </div>

      <p className="text-sm text-gray-600">
        Status: <span className="font-semibold">{status}</span>
      </p>
    </div>
  );
}
