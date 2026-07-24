import { useEffect, useRef, useState } from 'react'
import { doc, updateDoc, getFirestore, onSnapshot, addDoc, collection, serverTimestamp } from 'firebase/firestore'

const db = getFirestore()

const PulseRings = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="absolute rounded-full border border-violet-400/30"
        style={{
          width: 128,
          height: 128,
          animation: `ringPulse 2.4s ease-out ${i * 0.8}s infinite`,
        }}
      />
    ))}
    <style>{`
      @keyframes ringPulse {
        0%   { transform: scale(1);   opacity: 0.6; }
        100% { transform: scale(2.8); opacity: 0;   }
      }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0);    }
      }
      @keyframes noAnswerPop {
        0%   { opacity: 0; transform: scale(0.85); }
        60%  { opacity: 1; transform: scale(1.04); }
        100% { opacity: 1; transform: scale(1);    }
      }
      @keyframes dotBounce {
        0%, 80%, 100% { transform: translateY(0);    opacity: 0.4; }
        40%           { transform: translateY(-6px); opacity: 1;   }
      }
    `}</style>
  </div>
)

const CallingDots = () => (
  <span className="inline-flex items-end gap-[3px] ml-1 mb-[1px]">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="block w-[4px] h-[4px] rounded-full bg-violet-300"
        style={{ animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
      />
    ))}
  </span>
)

const EndCallIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.67 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08a.996.996 0 0 1-.29-.7c0-.28.11-.53.29-.71C3.34 8.77 7.46 7 12 7s8.66 1.77 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.1-.7-.28a11.27 11.27 0 0 0-2.67-1.85.996.996 0 0 1-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
  </svg>
)

const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
)

const VoiceIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
  </svg>
)

const TIMEOUT_SECONDS = 30

const MyCall = ({
  calleeName,
  calleePhoto,
  callType,
  chatRoomId,
  onCancel,
  user,
  setIncomingCall
}) => {
  const [phase, setPhase]     = useState('calling')
  const [elapsed, setElapsed] = useState(0)

  const timeoutRef  = useRef(null)
  const intervalRef = useRef(null)
  const wasAccepted = useRef(false)

  const otherUID = chatRoomId.replace(user , '')

  // Watch for callee accepting
  useEffect(() => {
    if (!chatRoomId) return
    const unsub = onSnapshot(doc(db, 'Calls', chatRoomId), (snap) => {
      if (!snap.exists()) return
      if (snap.data().status === 'accepted') {
        wasAccepted.current = true
        clearTimeout(timeoutRef.current)
        clearInterval(intervalRef.current)
      }
    })
    return () => unsub()
  }, [chatRoomId])

  // Countdown + auto-timeout — the ONLY place 'missed' is ever written
  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)

    timeoutRef.current = setTimeout(async () => {
      if (wasAccepted.current) return
      clearInterval(intervalRef.current)
      try {
        await updateDoc(doc(db, 'Calls', chatRoomId), { status: 'missed' })
        await addDoc(collection(db ,'CallHistory'),{
    chatRoomId,
    callerID: user,
    callType,
    participants: [otherUID],
    readBy:[user],
    status: "Missed Call",
    timestamp:serverTimestamp(),
        })

await addDoc(collection(db ,'CallHistory'),{
    chatRoomId,
    callerID: user,
    callType,
    participants:[user],
    status: "No Answer",
    timestamp:serverTimestamp(),
        })

      } catch (err) {
        console.error('MyCall: failed to write missed', err)
      }
      setPhase('noAnswer')
      setTimeout(() => onCancel?.(), 2500)
    }, TIMEOUT_SECONDS * 1000)

    return () => {
      clearTimeout(timeoutRef.current)
      clearInterval(intervalRef.current)
      // No writes on unmount — unmount is not a call event
    }
  }, [chatRoomId, onCancel])

  // Caller cancelled before answer
  const handleCancel = async () => {
    clearTimeout(timeoutRef.current)
    clearInterval(intervalRef.current)
    try {
      await updateDoc(doc(db, 'Calls', chatRoomId), { status: 'cancelled' })
    } catch (err) {
      console.error('MyCall: failed to write cancelled', err)
    }
    onCancel?.()
  }

  const RADIUS           = 68
  const CIRCUMFERENCE    = 2 * Math.PI * RADIUS
  const strokeDashoffset = CIRCUMFERENCE * Math.min(elapsed / TIMEOUT_SECONDS, 1)
  const avatarLetter     = (calleeName || '?').charAt(0).toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#0f0a1e] overflow-hidden"
      style={{ animation: 'fadeSlideUp 0.35s ease forwards' }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-[-10%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #4f46e5, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10 pt-16 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-500/30">
          {callType === 'video' ? <VideoIcon /> : <VoiceIcon />}
          <span className="text-violet-300 text-xs font-medium tracking-widest uppercase">
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
          <svg
            width="200" height="200" viewBox="0 0 200 200"
            className="absolute inset-0"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle cx="100" cy="100" r={RADIUS} fill="none" stroke="rgba(139,92,246,0.12)" strokeWidth="2" />
            <circle
              cx="100" cy="100" r={RADIUS} fill="none"
              stroke={phase === 'noAnswer' ? '#ef4444' : 'rgba(167,139,250,0.7)'}
              strokeWidth="2" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
            />
          </svg>

          {phase === 'calling' && <PulseRings />}

          <div className="relative z-10 w-32 h-32 rounded-full overflow-hidden shadow-[0_0_60px_rgba(124,58,237,0.4)]">
            {calleePhoto ? (
              <img
                src={calleePhoto} alt={calleeName}
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-white text-4xl font-bold">
                {avatarLetter}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <h2 className="text-white text-2xl font-semibold tracking-tight">{calleeName || 'Unknown'}</h2>
          {phase === 'calling' && (
            <p className="text-violet-300/80 text-sm flex items-center">
              Calling <CallingDots />
            </p>
          )}
          {phase === 'noAnswer' && (
            <div
              className="flex flex-col items-center gap-1"
              style={{ animation: 'noAnswerPop 0.4s ease forwards' }}
            >
              <p className="text-red-400 text-sm font-medium tracking-wide">No Answer</p>
              <p className="text-white/30 text-xs">Closing in a moment…</p>
            </div>
          )}
        </div>

        {phase === 'calling' && (
          <p className="text-white/25 text-xs font-mono tabular-nums">
            {TIMEOUT_SECONDS - elapsed}s
          </p>
        )}
      </div>

      <div className="relative z-10 pb-16 flex flex-col items-center gap-3">
        {phase === 'calling' && (
          <>
            <button
              onClick={handleCancel}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-transform active:scale-90"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                boxShadow: '0 8px 32px rgba(220,38,38,0.45)',
              }}
            >
              <EndCallIcon />
            </button>
            <p className="text-white/30 text-xs tracking-widest uppercase">Cancel</p>
          </>
        )}
        {phase === 'noAnswer' && (
          <div className="w-2 h-2 rounded-full bg-red-400/60 animate-ping" />
        )}
      </div>
    </div>
  )
}

export default MyCall