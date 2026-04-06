"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Clock3,
  FileText,
  ImageIcon,
  LayoutGrid,
  MessageSquare,
  Paperclip,
  User,
} from "lucide-react";

type TaskItem = {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  dueDate?: string | null;
  actualHours?: number;
  attachments?: Array<{
    id: string;
    url: string;
    name: string;
    type: string;
    size: number;
    createdAt: string;
  }>;
};

type StageItem = {
  id: string;
  key: string;
  name: string;
  position: number;
  color?: string | null;
  tasks: TaskItem[];
};

type PendingMove = {
  taskId: string;
  fromStageId: string;
  toStageId: string;
  taskSnapshot: TaskItem;
};

const TASK_TYPE_LABEL: Record<string, string> = {
  task: "Tache",
  milestone: "Jalon",
  deliverable: "Livrable",
};

const STAGE_COLORS: Record<string, { bg: string; border: string; headerBg: string; headerText: string; dot: string; badgeBg: string; badgeText: string }> = {
  backlog: { bg: "var(--k-backlog-bg)", border: "var(--k-backlog-border)", headerBg: "var(--k-backlog-header-bg)", headerText: "var(--k-backlog-header-text)", dot: "var(--k-backlog-dot)", badgeBg: "var(--k-backlog-header-bg)", badgeText: "var(--k-backlog-header-text)" },
  todo: { bg: "var(--k-todo-bg)", border: "var(--k-todo-border)", headerBg: "var(--k-todo-header-bg)", headerText: "var(--k-todo-header-text)", dot: "var(--k-todo-dot)", badgeBg: "var(--k-todo-header-bg)", badgeText: "var(--k-todo-header-text)" },
  in_progress: { bg: "var(--k-in-progress-bg)", border: "var(--k-in-progress-border)", headerBg: "var(--k-in-progress-header-bg)", headerText: "var(--k-in-progress-header-text)", dot: "var(--k-in-progress-dot)", badgeBg: "var(--k-in-progress-header-bg)", badgeText: "var(--k-in-progress-header-text)" },
  review: { bg: "var(--k-review-bg)", border: "var(--k-review-border)", headerBg: "var(--k-review-header-bg)", headerText: "var(--k-review-header-text)", dot: "var(--k-review-dot)", badgeBg: "var(--k-review-header-bg)", badgeText: "var(--k-review-header-text)" },
  testing: { bg: "var(--k-testing-bg)", border: "var(--k-testing-border)", headerBg: "var(--k-testing-header-bg)", headerText: "var(--k-testing-header-text)", dot: "var(--k-testing-dot)", badgeBg: "var(--k-testing-header-bg)", badgeText: "var(--k-testing-header-text)" },
  done: { bg: "var(--k-done-bg)", border: "var(--k-done-border)", headerBg: "var(--k-done-header-bg)", headerText: "var(--k-done-header-text)", dot: "var(--k-done-dot)", badgeBg: "var(--k-done-header-bg)", badgeText: "var(--k-done-header-text)" },
};

export default function ProjectKanbanPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const projectId = String(params?.id ?? "");

  const [stages, setStages] = useState<StageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "task" | "milestone" | "deliverable">("all");
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [undoTimerId, setUndoTimerId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; showUndo: boolean } | null>(null);
  const [activeTask, setActiveTask] = useState<(TaskItem & { stageName: string }) | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dropzoneActive, setDropzoneActive] = useState(false);
  const [newTaskTitleByStage, setNewTaskTitleByStage] = useState<Record<string, string>>({});
  const [creatingTaskStageId, setCreatingTaskStageId] = useState("");
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [dragSourceStageId, setDragSourceStageId] = useState("");
  const [showGenerationHint, setShowGenerationHint] = useState(true);

  const createdFromFlow = searchParams.get("created") === "1";
  const createdWorkflow = searchParams.get("workflow") ?? "";
  const generatedTasks = Number(searchParams.get("generatedTasks") ?? "0");

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

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const taskCount = useMemo(
    () => stages.reduce((sum, stage) => sum + stage.tasks.length, 0),
    [stages]
  );

  const doneCount = useMemo(
    () =>
      stages.reduce(
        (sum, stage) =>
          sum +
          (stage.key === "done" || stage.key === "validated"
            ? stage.tasks.length
            : 0),
        0
      ),
    [stages]
  );

  const completionPercent = taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100);

  const filteredStages = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      tasks: stage.tasks.filter((task) => {
        const matchesType = typeFilter === "all" || task.type === typeFilter;
        const q = searchQuery;
        const matchesSearch =
          q.length === 0 ||
          task.title.toLowerCase().includes(q) ||
          (TASK_TYPE_LABEL[task.type] ?? "").toLowerCase().includes(q);
        return matchesType && matchesSearch;
      }),
    }));
  }, [searchQuery, stages, typeFilter]);

  const visibleTaskCount = useMemo(
    () => filteredStages.reduce((sum, stage) => sum + stage.tasks.length, 0),
    [filteredStages]
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

  async function createTask(stageId: string) {
    const title = (newTaskTitleByStage[stageId] ?? "").trim();
    if (!title || !projectId) return;

    setCreatingTaskStageId(stageId);
    setError("");

    try {
      const response = await fetch(`/api/projects/${projectId}/kanban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, title, type: "task" }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Creation de tache impossible.");
        return;
      }

      setNewTaskTitleByStage((prev) => ({ ...prev, [stageId]: "" }));
      await loadKanban();
      setToast({ message: "Tache creee", showUndo: false });
      window.setTimeout(() => setToast(null), 1200);
    } catch {
      setError("Creation de tache impossible.");
    } finally {
      setCreatingTaskStageId("");
    }
  }

  function taskById(taskId: string) {
    for (const stage of stages) {
      const found = stage.tasks.find((task) => task.id === taskId);
      if (found) return found;
    }
    return null;
  }

  function setTaskAttachments(taskId: string, attachments: TaskItem["attachments"]) {
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        tasks: stage.tasks.map((task) =>
          task.id === taskId ? { ...task, attachments: attachments ?? [] } : task
        ),
      }))
    );
    setActiveTask((prev) => (prev && prev.id === taskId ? { ...prev, attachments: attachments ?? [] } : prev));
  }

  function bytesToSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function dueInDaysLabel(dueDate?: string | null): string {
    if (!dueDate) return "-";
    const target = new Date(dueDate);
    if (Number.isNaN(target.getTime())) return "-";
    const diff = target.getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}j retard`;
    return `${days}j`;
  }

  async function handleUpload(file: File, taskId: string) {
    setUploading(true);
    setUploadProgress(20);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadPayload = (await uploadResponse.json()) as {
        url?: string;
        name?: string;
        type?: string;
        size?: number;
        error?: string;
      };

      if (!uploadResponse.ok || !uploadPayload.url || !uploadPayload.name || !uploadPayload.type || typeof uploadPayload.size !== "number") {
        throw new Error(uploadPayload.error ?? "Upload impossible");
      }

      setUploadProgress(65);

      const attachResponse = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          url: uploadPayload.url,
          name: uploadPayload.name,
          type: uploadPayload.type,
          size: uploadPayload.size,
        }),
      });

      const attachmentPayload = (await attachResponse.json()) as {
        id?: string;
        url?: string;
        name?: string;
        type?: string;
        size?: number;
        createdAt?: string;
        error?: string;
      };

      if (!attachResponse.ok || !attachmentPayload.id || !attachmentPayload.url || !attachmentPayload.name || !attachmentPayload.type || typeof attachmentPayload.size !== "number") {
        throw new Error(attachmentPayload.error ?? "Attachement impossible");
      }

      setUploadProgress(100);

      const currentTask = taskById(taskId);
      const nextAttachments = [
        ...(currentTask?.attachments ?? []),
        {
          id: attachmentPayload.id,
          url: attachmentPayload.url,
          name: attachmentPayload.name,
          type: attachmentPayload.type,
          size: attachmentPayload.size,
          createdAt: attachmentPayload.createdAt ?? new Date().toISOString(),
        },
      ];
      setTaskAttachments(taskId, nextAttachments);
      setToast({ message: "Fichier ajoute a la tache", showUndo: false });
      window.setTimeout(() => setToast(null), 1500);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload impossible.");
    } finally {
      window.setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 240);
    }
  }

  async function handleDropFileOnModal(fileList: FileList | null) {
    if (!fileList?.length || !activeTask) return;
    for (const file of Array.from(fileList)) {
      // Sequential upload keeps feedback simple and avoids race on local state merge.
      await handleUpload(file, activeTask.id);
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

  async function commitMove(move: PendingMove) {
    await moveTask(move.taskId, move.toStageId);
  }

  function moveTaskLocally(taskId: string, fromStageId: string, toStageId: string) {
    let movedTask: TaskItem | null = null;

    setStages((prev) => {
      const next = prev.map((stage) => ({ ...stage, tasks: [...stage.tasks] }));
      const source = next.find((stage) => stage.id === fromStageId);
      const target = next.find((stage) => stage.id === toStageId);
      if (!source || !target) return prev;

      const sourceIndex = source.tasks.findIndex((task) => task.id === taskId);
      if (sourceIndex < 0) return prev;

      const [task] = source.tasks.splice(sourceIndex, 1);
      movedTask = task;
      target.tasks.push(task);

      return next;
    });

    return movedTask;
  }

  async function handleDrop(toStageId: string) {
    if (!draggingTaskId || !dragSourceStageId || dragSourceStageId === toStageId) {
      handleDragEnd();
      return;
    }

    if (pendingMove) {
      if (undoTimerId) {
        window.clearTimeout(undoTimerId);
      }
      await commitMove(pendingMove);
      setPendingMove(null);
      setUndoTimerId(null);
    }

    const movedTask = moveTaskLocally(draggingTaskId, dragSourceStageId, toStageId);
    if (!movedTask) {
      handleDragEnd();
      return;
    }

    const nextPending: PendingMove = {
      taskId: draggingTaskId,
      fromStageId: dragSourceStageId,
      toStageId,
      taskSnapshot: movedTask,
    };

    setPendingMove(nextPending);
    setToast({ message: "Tache deplacee", showUndo: true });

    const timerId = window.setTimeout(async () => {
      try {
        await commitMove(nextPending);
        setToast({ message: "Deplacement sauvegarde", showUndo: false });
        window.setTimeout(() => setToast(null), 1400);
      } catch {
        setError("Deplacement impossible.");
      } finally {
        setPendingMove(null);
        setUndoTimerId(null);
        await loadKanban();
      }
    }, 5000);

    setUndoTimerId(timerId);

    handleDragEnd();
  }

  function handleUndoMove() {
    if (!pendingMove) return;
    if (undoTimerId) {
      window.clearTimeout(undoTimerId);
    }

    moveTaskLocally(pendingMove.taskId, pendingMove.toStageId, pendingMove.fromStageId);
    setPendingMove(null);
    setUndoTimerId(null);
    setToast({ message: "Deplacement annule", showUndo: false });
    window.setTimeout(() => setToast(null), 1400);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="animate-fade-in">
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-center gap-3">
            <LayoutGrid className="w-6 h-6" style={{ color: "var(--ui-primary)" }} />
            <h1 className="text-3xl font-black tracking-tight" style={{ color: "var(--ui-text)" }}>
              Tableau Kanban
            </h1>
          </div>
        </div>
        <p className="text-sm ml-9" style={{ color: "var(--ui-text-muted)" }}>
          {taskCount} {taskCount === 1 ? "tache" : "taches"} • {stages.length} etapes
        </p>
        <div className="mt-4 ml-9 rounded-xl border p-3" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--ui-text-secondary)" }}>
            <span>Progression globale</span>
            <span className="font-semibold" style={{ color: "var(--ui-text)" }}>{completionPercent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--d-input)" }}>
            <div className="h-full rounded-full bg-gradient-to-r transition-all duration-300" style={{ width: `${completionPercent}%`, backgroundImage: "linear-gradient(to right,var(--d-grad-primary-start),var(--d-grad-primary-end))" }} />
          </div>
        </div>
      </div>

      {createdFromFlow ? (
        <div className="rounded-2xl border p-4" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ui-primary)" }}>
            Projet cree
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ui-text)" }}>
            Projet cree avec workflow "{createdWorkflow || "workflow standard"}".
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--ui-text-muted)" }}>
            {generatedTasks > 0
              ? `${generatedTasks} taches ont ete generees automatiquement. Vous pouvez tout modifier.`
              : "Board initialise. Vous pouvez maintenant ajouter vos taches."}
          </p>
        </div>
      ) : null}

      {showGenerationHint && taskCount > 0 ? (
        <div className="flex items-start justify-between rounded-xl border px-3 py-2" style={{ borderColor: "var(--ui-border)", background: "var(--d-input)" }}>
          <p className="text-xs" style={{ color: "var(--ui-text-secondary)" }}>
            Ces taches sont generees automatiquement selon le workflow choisi, puis totalement modifiables.
          </p>
          <button
            type="button"
            onClick={() => setShowGenerationHint(false)}
            className="ml-3 text-xs font-semibold"
            style={{ color: "var(--ui-primary)" }}
          >
            Compris
          </button>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed right-6 top-20 z-40 rounded-xl border px-4 py-3 shadow-lg animate-fade-in" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ui-text)" }}>{toast.message}</p>
          {toast.showUndo ? (
            <button type="button" onClick={handleUndoMove} className="mt-1 text-xs font-semibold" style={{ color: "var(--ui-primary)" }}>
              Annuler (5s)
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-2xl border p-3 sm:p-4" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px] lg:grid-cols-[1fr_180px_180px]">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Rechercher une tache..."
            className="h-10 rounded-xl border px-3 text-sm outline-none transition focus:ring-4"
            style={{ borderColor: "var(--ui-border)", background: "var(--d-input)", color: "var(--ui-text)", boxShadow: "none" }}
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}
            className="h-10 rounded-xl border px-3 text-sm outline-none transition"
            style={{ borderColor: "var(--ui-border)", background: "var(--d-input)", color: "var(--ui-text-secondary)" }}
          >
            <option value="all">Tous les types</option>
            <option value="task">Taches</option>
            <option value="milestone">Jalons</option>
            <option value="deliverable">Livrables</option>
          </select>
          <div className="h-10 rounded-xl border px-3 text-xs font-semibold flex items-center justify-center" style={{ borderColor: "var(--ui-border)", background: "var(--ui-status-info-bg)", color: "var(--ui-status-info-text)" }}>
            {visibleTaskCount} resultat(s)
          </div>
        </div>
      </div>

      {/* Error State */}
      {error ? (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
          <div>
            <p className="font-semibold mb-0.5">Erreur de chargement</p>
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        </div>
      ) : null}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16 px-4">
          <div className="rounded-2xl border p-8 flex flex-col items-center gap-4 w-full max-w-sm shadow-sm" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
            <div className="w-10 h-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin"></div>
            <p className="text-sm font-medium" style={{ color: "var(--ui-text-secondary)" }}>Chargement du pipeline...</p>
          </div>
        </div>
      ) : filteredStages.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center" style={{ borderColor: "var(--ui-border)", background: "var(--ui-primary-soft)" }}>
          <p className="font-semibold mb-1" style={{ color: "var(--ui-text)" }}>Aucun pipeline detecte</p>
          <p className="text-sm" style={{ color: "var(--ui-text-secondary)" }}>Creez des etapes pour lancer votre tableau Kanban</p>
        </div>
      ) : (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-2">
          {filteredStages.map((stage, idx) => {
            const colors = STAGE_COLORS[stage.key] || STAGE_COLORS.backlog;
            return (
              <div
                key={stage.id}
                style={{
                  animationDelay: `${idx * 140}ms`,
                  borderColor: colors.border,
                  background: colors.bg,
                }}
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
                className="flex min-h-[580px] w-[320px] shrink-0 flex-col gap-3 rounded-2xl border-2 transition-all duration-300 overflow-hidden animate-reveal-up"
              >
                {/* Column Header */}
                <div className="px-4 py-3 -m-0.5 border-b-2" style={{ background: colors.headerBg, borderColor: colors.border }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors.dot }}></div>
                      <h3 className="font-bold text-sm" style={{ color: colors.headerText }}>
                        {stage.name}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold" style={{ background: colors.badgeBg, color: colors.badgeText }}>
                      {stage.tasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks Container */}
                <div className="px-3 pb-3 flex-1 overflow-y-auto max-h-[600px] space-y-2">
                  {stage.tasks.length === 0 ? (
                    <div className="text-xs text-center py-6 italic" style={{ color: "var(--ui-text-muted)" }}>Aucune tâche</div>
                  ) : (
                    stage.tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => handleDragStart(task.id, stage.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => setActiveTask({ ...task, stageName: stage.name })}
                        className={`p-3 rounded-xl border cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 ${
                          draggingTaskId === task.id ? "opacity-40 rotate-3 shadow-lg ring-2 ring-blue-400" : ""
                        }`}
                        style={{ background: "var(--ui-card)", borderColor: "var(--ui-border)" }}
                      >
                        <p className="font-semibold text-sm leading-snug mb-2" style={{ color: "var(--ui-text)" }}>
                          {task.title}
                        </p>
                        {task.attachments?.find((item) => item.type === "image") ? (
                          <img
                            src={task.attachments.find((item) => item.type === "image")?.url}
                            alt="Preview"
                            className="mb-2 h-20 w-full rounded-lg object-cover"
                          />
                        ) : null}
                        <div className="flex items-center gap-2 justify-between">
                          <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: "var(--ui-status-info-bg)", color: "var(--ui-status-info-text)" }}>
                            {TASK_TYPE_LABEL[task.type]}
                          </span>
                          {typeof task.actualHours === "number" && (
                            <span className="text-xs font-medium" style={{ color: "var(--ui-text-muted)" }}>
                              {task.actualHours}h
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs" style={{ color: "var(--ui-text-muted)" }}>
                          <span className="inline-flex items-center gap-1">
                            <Paperclip className="h-3.5 w-3.5" />
                            {task.attachments?.length ?? 0} fichiers
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            0
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--ui-text-muted)" }}>
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            Max
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3.5 w-3.5" />
                            {dueInDaysLabel(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="px-3 pb-3">
                  <div className="rounded-xl border p-2" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
                    <input
                      type="text"
                      value={newTaskTitleByStage[stage.id] ?? ""}
                      onChange={(event) =>
                        setNewTaskTitleByStage((prev) => ({ ...prev, [stage.id]: event.target.value }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void createTask(stage.id);
                        }
                      }}
                      placeholder="Ajouter une tache..."
                      className="h-9 w-full rounded-lg border px-2.5 text-xs outline-none"
                      style={{ borderColor: "var(--ui-border)", background: "var(--d-input)", color: "var(--ui-text)" }}
                    />
                    <button
                      type="button"
                      onClick={() => void createTask(stage.id)}
                      disabled={creatingTaskStageId === stage.id}
                      className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold text-white disabled:opacity-60"
                      style={{ background: "var(--ui-primary)" }}
                    >
                      {creatingTaskStageId === stage.id ? "Creation..." : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTask ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/35 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border p-5 shadow-xl" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--ui-primary)" }}>Detail tache</p>
                <h3 className="mt-1 text-lg font-semibold" style={{ color: "var(--ui-text)" }}>{activeTask.title}</h3>
              </div>
              <button type="button" onClick={() => setActiveTask(null)} className="rounded-lg p-1.5" style={{ color: "var(--ui-text-muted)", background: "var(--d-input)" }} aria-label="Fermer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl px-3 py-2" style={{ background: "var(--d-input)" }}>
                <p className="text-xs" style={{ color: "var(--ui-text-muted)" }}>Type</p>
                <p className="mt-0.5 font-semibold" style={{ color: "var(--ui-text)" }}>{TASK_TYPE_LABEL[activeTask.type]}</p>
              </div>
              <div className="rounded-xl px-3 py-2" style={{ background: "var(--d-input)" }}>
                <p className="text-xs" style={{ color: "var(--ui-text-muted)" }}>Colonne</p>
                <p className="mt-0.5 font-semibold" style={{ color: "var(--ui-text)" }}>{activeTask.stageName}</p>
              </div>
              <div className="rounded-xl px-3 py-2 col-span-2" style={{ background: "var(--d-input)" }}>
                <p className="text-xs" style={{ color: "var(--ui-text-muted)" }}>Temps passe</p>
                <p className="mt-0.5 font-semibold" style={{ color: "var(--ui-text)" }}>{typeof activeTask.actualHours === "number" ? `${activeTask.actualHours}h` : "Non renseigne"}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-3" style={{ borderColor: "var(--ui-border)", background: "var(--d-input)" }}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--ui-primary)" }}>Fichiers</p>
                <label className="cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white" style={{ background: "var(--ui-primary)" }}>
                  + Ajouter
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(event) => {
                      void handleDropFileOnModal(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropzoneActive(true);
                }}
                onDragLeave={() => setDropzoneActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropzoneActive(false);
                  void handleDropFileOnModal(event.dataTransfer.files);
                }}
                className="rounded-lg border border-dashed p-3 text-center text-xs transition"
                style={{
                  borderColor: dropzoneActive ? "var(--ui-primary)" : "var(--ui-border)",
                  color: "var(--ui-text-muted)",
                  background: dropzoneActive ? "var(--ui-primary-soft)" : "var(--ui-card)",
                }}
              >
                Glissez-deposez vos fichiers ici
              </div>

              {uploading ? (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--ui-text-secondary)" }}>
                    <span>Upload en cours...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ background: "var(--ui-border-subtle)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: "var(--ui-primary)" }} />
                  </div>
                </div>
              ) : null}

              <div className="mt-3 space-y-2">
                {(activeTask.attachments ?? []).length === 0 ? (
                  <p className="text-xs" style={{ color: "var(--ui-text-muted)" }}>Aucun fichier pour cette tache.</p>
                ) : (
                  (activeTask.attachments ?? []).map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between rounded-lg border px-2.5 py-2" style={{ borderColor: "var(--ui-border)", background: "var(--ui-card)" }}>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" style={{ color: "var(--ui-text)" }}>
                          <span className="inline-flex items-center gap-1">
                            {attachment.type === "image" ? (
                              <ImageIcon className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            {attachment.name}
                          </span>
                        </p>
                        <p className="text-xs" style={{ color: "var(--ui-text-muted)" }}>{bytesToSize(attachment.size)}</p>
                      </div>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded px-2 py-1 text-xs font-semibold"
                        style={{ background: "var(--ui-primary-soft)", color: "var(--ui-primary)" }}
                      >
                        {attachment.type === "image" ? "Preview" : "Download"}
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button type="button" onClick={() => setActiveTask(null)} className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ background: "var(--ui-primary)" }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
