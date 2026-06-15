import Image from 'next/image'

export function JibondhraraLogo() {
  return (
    <div className="w-20 h-20 flex-shrink-0">
      <Image
        src="/logo.png"
        alt="Jibondhara Society Logo"
        width={80}
        height={80}
        priority
        className="w-full h-full object-contain"
      />
    </div>
  )
}
