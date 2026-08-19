export default function BreathingLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#FAFBFC',
    }}>
      <style>{`
        @keyframes cm-breath {
          0%, 100% { transform: scale(0.92); filter: drop-shadow(0 8px 24px rgba(91,168,156,0.18)); }
          50%       { transform: scale(1.04); filter: drop-shadow(0 14px 36px rgba(91,168,156,0.45)); }
        }
        @keyframes cm-halo {
          0%   { transform: scale(0.7); opacity: 0.55; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <div style={{ position: 'relative', width: 200, height: 200 }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1.6px solid #5BA89C',
          animation: 'cm-halo 2.4s ease-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '1.6px solid #5BA89C',
          animation: 'cm-halo 2.4s ease-out infinite',
          animationDelay: '-1.2s',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 96,
          height: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.ico"
            alt="ConectaMente"
            width={96}
            height={96}
            style={{
              width: 96,
              height: 96,
              objectFit: 'contain',
              animation: 'cm-breath 2.4s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </div>
  )
}
