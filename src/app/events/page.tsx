import { buildMeta } from "@/lib/metadata";
import { events } from "@/data/events";

export const metadata = buildMeta({
  title: "Events",
  description: "Conferences, launches, and summits for the space industry community.",
  tag: "Events",
});
import { format, isPast } from "date-fns";

export default function EventsPage() {
  const upcoming = events.filter((e) => !isPast(new Date(e.date)));
  const past = events.filter((e) => isPast(new Date(e.date)));

  const renderEvent = (event: (typeof events)[0], dimmed = false) => (
    <a
      key={event.id}
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block border rounded-lg p-5 transition-colors group ${
        dimmed
          ? "border-zinc-900 hover:border-zinc-800 opacity-50"
          : "border-zinc-800 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="font-semibold text-white text-sm mb-1 group-hover:text-zinc-200">
            {event.name}
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed mb-3">{event.description}</p>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-xs">{event.location}</span>
            <span className="text-zinc-700">·</span>
            <div className="flex flex-wrap gap-1">
              {event.tags.map((tag) => (
                <span key={tag} className="text-xs text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-white text-xs font-mono">
            {format(new Date(event.date), "MMM d, yyyy")}
          </div>
          {event.endDate && (
            <div className="text-zinc-600 text-xs font-mono">
              → {format(new Date(event.endDate), "MMM d")}
            </div>
          )}
        </div>
      </div>
    </a>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">Events</h1>
        <p className="text-zinc-500 text-sm">Conferences, launches, and summits for the space industry community.</p>
      </div>

      {upcoming.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5 font-medium">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((e) => renderEvent(e, false))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-xs uppercase tracking-widest text-zinc-500 mb-5 font-medium">Past</h2>
          <div className="space-y-3">
            {past.map((e) => renderEvent(e, true))}
          </div>
        </div>
      )}
    </div>
  );
}
