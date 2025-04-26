import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Room, createLocalAudioTrack, createLocalVideoTrack, VideoPresets } from 'livekit-client';

export default function GuestPage() {
  const router = useRouter();
  const { room } = router.query as { room: string };
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  useEffect(() => {
    if (!room) return;

    (async () => {
      setStatus('connecting');
      try {
        const res = await fetch(`/api/token?identity=guest-${room}&room=${room}`);
        const { token } = await res.json();

        const lkRoom = new Room();
        await lkRoom.connect(livekitUrl, token);

        const videoTrack = await createLocalVideoTrack({
          resolution: VideoPresets.h180.resolution,
        });
        const audioTrack = await createLocalAudioTrack();

        await lkRoom.localParticipant.publishTrack(videoTrack);
        await lkRoom.localParticipant.publishTrack(audioTrack);

        if (videoRef.current) {
          const el = videoTrack.attach();
          el.className = "w-full h-full object-cover rounded-md";
          videoRef.current.replaceWith(el);
        }

        setStatus('connected');
      } catch (err) {
        console.error('Guest connect error', err);
        setStatus('error');
      }
    })();
  }, [room, livekitUrl]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Guest Stream: {room}</h1>
      <div className="w-full max-w-md aspect-video bg-black rounded-md overflow-hidden shadow-lg relative">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover rounded-md"
        />
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Status: <span className="font-semibold">{status}</span>
      </p>
    </div>
  );
}
