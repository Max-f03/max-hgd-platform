const cursors = [
  {
    name: "Sophie",
    color: "#3B82F6",
    top: "12%",
    left: "5%",
    animName: "float-cursor-1",
    duration: "9s",
    delay: "0s",
  },
  {
    name: "Thomas",
    color: "#3B82F6",
    top: "14%",
    right: "5%",
    animName: "float-cursor-2",
    duration: "11s",
    delay: "-4s",
  },
  {
    name: "Max",
    color: "#F43F5E",
    top: "48%",
    left: "3%",
    animName: "float-cursor-5",
    duration: "12s",
    delay: "-7s",
  },
  {
    name: "Emma",
    color: "#2563EB",
    bottom: "18%",
    left: "6%",
    animName: "float-cursor-3",
    duration: "10s",
    delay: "-2s",
  },
  {
    name: "Lucas",
    color: "#F59E0B",
    bottom: "14%",
    right: "5%",
    animName: "float-cursor-4",
    duration: "8s",
    delay: "-6s",
  },
];

function CursorIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="34" viewBox="0 0 13 19" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 2L2 15L5 11.5L7.5 17.5L9.5 16.8L7 10.8L12 10.8Z"
        fill={color}
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HeroCursors() {
  return (
    <>
      {cursors.map((cursor) => {
        const { name, color, animName, duration, delay, ...position } = cursor;
        return (
          <div
            key={name}
            className="absolute pointer-events-none select-none hidden sm:flex flex-col"
            style={{
              ...position,
              animation: `${animName} ${duration} ease-in-out infinite ${delay}`,
              opacity: 0.9,
            }}
          >
            <CursorIcon color={color} />
            <span
              className="text-white text-sm font-medium px-2.5 py-1 whitespace-nowrap mt-0.5 ml-3"
              style={{ background: color, borderRadius: "6px" }}
            >
              {name}
            </span>
          </div>
        );
      })}
    </>
  );
}
