import Image from 'next/image'

type GalleryImage = { src: string; alt: string; span?: 'wide' | 'tall' | 'square' }

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [main, ...rest] = images
  const thumbs = rest.slice(0, 4)

  if (!main) return null

  // Without thumbnails the grid rows have nothing to size against, so the main
  // figure must keep an aspect ratio on desktop too — otherwise it collapses to
  // a thin line. With thumbnails, it spans half the grid and follows their rows.
  const mainClassName = thumbs.length
    ? 'md:col-span-2 md:aspect-auto md:rounded-l-2xl md:rounded-r-none'
    : 'md:col-span-4 md:aspect-[16/9] md:rounded-2xl'

  return (
    <section className="mt-6 md:mt-8">
      <div className="grid grid-cols-4 grid-rows-2 gap-2 md:gap-3">
        <figure
          className={`relative col-span-4 row-span-2 aspect-[16/10] overflow-hidden rounded-xl ${mainClassName}`}
        >
          <Image
            src={main.src}
            alt={main.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </figure>
        {thumbs.map((img, i) => (
          <figure
            key={img.src}
            className={`bg-muted relative hidden aspect-[4/3] overflow-hidden md:block ${
              i === 1 ? 'md:rounded-tr-2xl' : ''
            } ${i === 3 ? 'md:rounded-br-2xl' : ''}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
            {i === 3 && (
              <button
                type="button"
                className="bg-background text-foreground border-border/60 hover:bg-background/90 absolute right-3 bottom-3 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors"
              >
                Ver todas ({images.length})
              </button>
            )}
          </figure>
        ))}
      </div>
    </section>
  )
}
