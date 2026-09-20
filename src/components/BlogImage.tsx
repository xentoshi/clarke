import Image from "next/image";

interface BlogImageProps {
  src: string;
  alt: string;
  caption: string;
  source: string;
  sourceUrl?: string;
  width?: number;
  height?: number;
}

export function BlogImage({
  src,
  alt,
  caption,
  source,
  sourceUrl,
  width = 1200,
  height = 675,
}: BlogImageProps) {
  return (
    <figure className="my-10 -mx-4 sm:mx-0">
      <div className="relative w-full overflow-hidden bg-canvas" style={{ aspectRatio: `${width}/${height}` }}>
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 672px"
        />
      </div>
      <figcaption className="mt-3 flex items-start justify-between gap-4 px-4 sm:px-0">
        <p className="text-muted text-xs leading-relaxed">{caption}</p>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-faint text-[10px] shrink-0 hover:text-muted transition-colors"
          >
            {source} ↗
          </a>
        ) : (
          <span className="text-faint text-[10px] shrink-0">{source}</span>
        )}
      </figcaption>
    </figure>
  );
}
