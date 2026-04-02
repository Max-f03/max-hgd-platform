const activities = [
  {
    id: 1,
    description: "Projet Mobile App publie",
    date: "il y a 2h",
    color: "bg-primary-500",
  },
  {
    id: 2,
    description: "Nouveau client : Agence Crea",
    date: "il y a 5h",
    color: "bg-green-500",
  },
  {
    id: 3,
    description: "Message recu de Thomas D.",
    date: "hier",
    color: "bg-accent-500",
  },
  {
    id: 4,
    description: "Projet Dashboard Analytics modifie",
    date: "hier",
    color: "bg-amber-500",
  },
  {
    id: 5,
    description: "Nouveau projet cree : Site Corporate",
    date: "il y a 3 jours",
    color: "bg-primary-400",
  },
  {
    id: 6,
    description: "Client Lucas Martin marque Actif",
    date: "il y a 3 jours",
    color: "bg-green-400",
  },
];

export default function ActivityFeed() {
  return (
    <div className="flex flex-col gap-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="mt-1 shrink-0">
            <span
              className={[
                "block w-2 h-2 rounded-full",
                activity.color,
              ].join(" ")}
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm text-neutral-700 leading-snug">
              {activity.description}
            </span>
            <span className="text-xs text-neutral-400">{activity.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
