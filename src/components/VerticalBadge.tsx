import { Vertical, verticalLabels } from "@/data/companies";

const colors: Record<Vertical, string> = {
  launch: "bg-orange-950 text-orange-300 border-orange-800",
  lunar: "bg-indigo-950 text-indigo-300 border-indigo-800",
  habitation: "bg-blue-950 text-blue-300 border-blue-800",
  propulsion: "bg-violet-950 text-violet-300 border-violet-800",
  power: "bg-amber-950 text-amber-300 border-amber-800",
  isru: "bg-lime-950 text-lime-300 border-lime-800",
  manufacturing: "bg-cyan-950 text-cyan-300 border-cyan-800",
  food: "bg-green-950 text-green-300 border-green-800",
  robotics: "bg-sky-950 text-sky-300 border-sky-800",
  comms: "bg-teal-950 text-teal-300 border-teal-800",
  observation: "bg-purple-950 text-purple-300 border-purple-800",
  suits: "bg-rose-950 text-rose-300 border-rose-800",
  mining: "bg-yellow-950 text-yellow-300 border-yellow-800",
};

export default function VerticalBadge({ vertical }: { vertical: Vertical }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[vertical]}`}>
      {verticalLabels[vertical]}
    </span>
  );
}
