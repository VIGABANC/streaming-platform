import Image from 'next/image'

interface PosterProps {
  src: string
  alt: string
  className?: string
  priority?: boolean
  sizes?: string
}

export function Poster({ src, alt, className, priority, sizes }: PosterProps) {
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes ?? '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'}
        className="object-cover"
        priority={priority}
      />
    </div>
  )
}
