"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";

type TaskItem = {
  id: string;
  title: string;
  type: string;
  status: string;
  actualHours?: number;
};

type StageItem = {
  id: string;
  key: string;
  name: string;
  position: number;
  color?: string | null;
  tasks: TaskItem[];
};

const TASK_TYPE_LABEL: Record<string, string> = {
  task: "Tache",
  milestone: "Jalon",
  deliverable: "Livrable",
};

const STAGE_COLORS: Record<string, { bg: string; border: string; headerBg: string; headerText: string; dot: string; badge: string }> = {
  backlog: { bg: "bg-slate-50", border: "border-slate-200", headerBg: "bg-slate-100", headerText: "text-slate-700", dot: "bg-slate-400", badge: "bg-slate-100 text-slate-700" },
  todo: { bg: "bg-blue-50", border: "border-blue-100", headerBg: "bg-blue-100", headerText: "text-blue-700", dot: "bg-blue-500", badge: "bg-blue-100 text-blue-700" },
  in_progress: { bg: "bg-amber-50", border: "border-amber-100", headerBg: "bg-amber-100", headerText: "text-amber-700", dot: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  review: { bg: "bg-purple-50", border: "border-purple-100", headerBg: "bg-purple-100", headerText: "text-purple-700", dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700" },
  testing: { bg: "bg-pink-50", border: "border-pink-100", headerBg: "bg-pink-100", headerText: "text-pink-700", dot: "bg-pink-500", badge: "bg-pink-100 text-pink-700" },
  done: { bg: "bg-emerald-50", border: "border-emerald-100", headerBg: "bg-emerald-100", headerText: "text-emerald-700", dot: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-700" },
};

export default function ProjectKanbanPage() {
  const params = useParams<{ id: string }>();
  const projectId = String(params?.id ?? "");

  const [stages, setStages] = useState<StageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [dragSourceStageId, setDragSourceStageId] = useState("");

  async function loadKanban() {
    if (!projectId) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/kanban`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as {
        stages?: StageItem[];
        projectTitle?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Impossible de charger le kanban.");
        setStages([]);
        return;
      }

      setStages(payload.stages ?? []);
    } catch {
      setError("Impossible de charger le kanban.");
      setStages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadKanban();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const taskCount = useMemo(
    () => stages.reduce((sum, stage) => sum + stage.tasks.length, 0),
    [stages]
  );

  async function moveTask(taskId: string, toStageId: string) {
    if (!projectId) return;
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/kanban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, toStageId }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Deplacement impossible.");
        return;
      }

      await loadKanban();
    } catch {
      setError("Deplacement impossible.");
    }
  }

  function handleDragStart(taskId: string, fromStageId: string) {
    setDraggingTaskId(taskId);
    setDragSourceStageId(fromStageId);
  }

  function handleDragEnd() {
    setDraggingTaskId("");
    setDragSourceStageId("");
  }

  async function handleDrop(toStageId: string) {
    if (!draggingTaskId || !dragSourceStageId || dragSourceStageId === toStageId) {
      handleDragEnd();
      return;
    }

    await moveTask(draggingTaskId, toStageId);
    handleDragEnd();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="animate-fade-in">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-6 h-6 text-blue-600" />
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Tableau Kanban
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 ml-9">
          {taskCount} {taskCount === 1 ? "tâche" : "tâches"} • {stages.length} étapes
        </p>
      </div>

      {/* Error State */}
      {error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-start gap-3">
          <span className="text-red-600 font-bold mt-0.5">⚠</span>
          <div>
            <p className="font-semibold mb-0.5">Erreur de chargement</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16 px-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-8 flex flex-col items-center gap-4 w-full max-w-sm shadow-sm">
            <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"></div>
            <p className="text-sm text-slate-600 font-medium">Chargement du pipeline...</p>
          </div>
        </div>
      ) : stages.length === 0 ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-8 text-center">
          <p className="font-semibold text-slate-900 mb-1">Aucun pipeline détecté</p>
          <p className="text-sm text-slate-600">Créez des étapes pour lancer votre tableau Kanban</p>
        </div>
      ) : (
        /* Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-5">
          {stages.map((stage, idx) => {
            const colors = STAGE_COLORS[stage.key] || STAGE_COLORS.backlog;
            return (
              <div
                key={stage.id}
                style={{ animationDelay: `${idx * 140}ms` }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("ring-2", "ring-blue-400", "ring-offset-2");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("ring-2", "ring-blue-400", "ring-offset-2");
                  void handleDrop(stage.id);
                }}
                className={`flex flex-col gap-3 rounded-2xl border-2 ${colors.border} ${colors.bg} transition-all duration-300 overflow-hidden animate-reveal-up`}
              >
                {/* Column Header */}
                <div className={`${colors.headerBg} px-4 py-3 -m-0.5 border-b-2 ${colors.border}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></div>
                      <h3 className={`font-bold text-sm ${colors.headerText}`}>
                        {stage.name}
                      </h3>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${colors.badge}`}>
                      {stage.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks Container */}
                <div className="px-3 pb-3 flex-1 overflow-y-auto max-h-[600px] space-y-2">
                  {stage.tasks.length === 0 ? (
                    <div className="text-xs text-slate-400 text-center py-6 italic">Aucune tâche</div>
                  ) : (
                    stage.tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id, stage.id)}
                        onDragEnd={handleDragEnd}
                        className={`p-3 bg-white rounded-xl border border-slate-200 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-200 transform hover:-translate-y-1 ${
                          draggingTaskId === task.id ? "opacity-40 rotate-3 shadow-lg ring-2 ring-blue-400" : ""
                        }`}
                      >
                        <p className="font-semibold text-sm text-slate-900 leading-snug mb-2">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-blue-50 text-blue-700">
                            {TASK_TYPE_LABEL[task.type]}
                          </span>
                          {task.actualHours && (
                            <span className="text-xs font-medium text-slate-500">
                              {task.actualHours}h
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes reveal-up {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-reveal-up {
          animation: reveal-up 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
}
