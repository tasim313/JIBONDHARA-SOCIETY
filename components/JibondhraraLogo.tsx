import Image from 'next/image'

export function JibondhraraLogo() {
  return (
    <div style={{ flexShrink: 0, width: '90px', height: '90px', borderRadius: '20px', overflow: 'hidden' }}>
      <Image
        src="/logo.png"
        alt="Jibondhara Society Logo"
        width={90}
        height={90}
        priority
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  )
}
