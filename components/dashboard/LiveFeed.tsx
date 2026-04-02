const feed = [
  {
    id: "1",
    initials: "MH",
    bg: "#DBEAFE", color: "#1D4ED8",
    action: "Projet publie",
    detail: "Mobile Booking App",
    time: "Aujourd'hui 10:30",
  },
  {
    id: "2",
    initials: "AG",
    bg: "#DBEAFE", color: "#1D4ED8",
    action: "Nouveau client",
    detail: "Agence Crea",
    time: "Hier 15:45",
  },
  {
    id: "3",
    initials: "TD",
    bg: "#FEF3C7", color: "#B45309",
    action: "Message recu",
    detail: "E-commerce Platform",
    time: "12 Mars 09:15",
  },
  {
    id: "4",
    initials: "MH",
    bg: "#DBEAFE", color: "#1E40AF",
    action: "Projet modifie",
    detail: "Dashboard Analytics",
    time: "10 Mars 17:00",
  },
  {
    id: "5",
    initials: "SM",
    bg: "#FCE7F3", color: "#BE185D",
    action: "Livraison validee",
    detail: "Site Corporate",
    time: "8 Mars 11:20",
  },
];

export default function LiveFeed() {
  return (
    <div className="flex flex-col gap-4">
      {feed.map((item) => (
        <div key={item.id} className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
            style={{ background: item.bg, color: item.color }}
          >
            {item.initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#374151" }}>{item.action}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: "#6B7280" }}>{item.detail}</p>
            <p className="text-[10px] mt-1" style={{ color: "#9CA3AF" }}>{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
