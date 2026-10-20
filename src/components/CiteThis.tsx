import { AccessDate } from "./AccessDate";

export function CiteThis({
  title,
  url,
  vintage,
}: {
  title: string;
  url: string;
  vintage: string;
}) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="text-faint text-[13px] mb-2">Cite this</h2>
      <p className="text-muted text-[14px] leading-relaxed">
        {title}. {url}. Data vintage: {vintage}. Accessed <AccessDate />.
      </p>
    </section>
  );
}
