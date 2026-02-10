import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { apiClient } from "../../api/client";
import { toast } from "react-toastify";

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskForm, setTaskForm] = useState({
    id: null,
    title: "",
    description: "",
    status: "pending",
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);

  const loadTasks = async (params = {}) => {
    try {
      setTasksLoading(true);
      const { data } = await apiClient.get("/tasks", {
        params: {
          search: params.search ?? search,
          status: params.status ?? statusFilter,
        },
      });
      setTasks(data);
    } catch {
      toast.error("Failed to load tasks.");
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);
  useEffect(() => {
    const onMouseDown = (e) => {
      if (!e.target.closest("[data-task-menu]")) setOpenMenuId(null);
    };

    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const toggleMenu = (taskId) => {
    setOpenMenuId((prev) => (prev === taskId ? null : taskId));
  };

  const handleTaskChange = (e) => {
    setTaskForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetTaskForm = () => {
    setTaskForm({ id: null, title: "", description: "", status: "pending" });
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title) {
      toast.error("Title is required.");
      return;
    }

    try {
      if (taskForm.id) {
        const { data } = await apiClient.put(`/tasks/${taskForm.id}`, {
          title: taskForm.title,
          description: taskForm.description,
          status: taskForm.status,
        });
        setTasks((prev) => prev.map((t) => (t._id === data._id ? data : t)));
        toast.success("Task updated.");
      } else {
        const { data } = await apiClient.post("/tasks", {
          title: taskForm.title,
          description: taskForm.description,
          status: taskForm.status,
        });
        setTasks((prev) => [data, ...prev]);
        toast.success("Task created.");
      }
      resetTaskForm();
    } catch (err) {
      const message =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        "Failed to save task.";
      toast.error(message);
    }
  };

  const handleTaskEdit = (task) => {
    setTaskForm({
      id: task._id,
      title: task.title,
      description: task.description || "",
      status: task.status,
    });
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      toast.success("Task deleted.");
    } catch {
      toast.error("Failed to delete task.");
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    loadTasks({ search: value, status: statusFilter });
  };

  const handleStatusFilterChange = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    loadTasks({ search, status: value });
  };

  return (
    <Layout>
      <div className="space-y-4">
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Tasks</h2>
                <p className="text-xs text-slate-400">
                  Create, search, filter, and manage your tasks.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={handleSearchChange}
                  className="text-xs"
                />
                <select
                  value={statusFilter}
                  onChange={handleStatusFilterChange}
                  className="text-xs"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <form
              onSubmit={handleTaskSubmit}
              className="mb-4 grid gap-3 rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_minmax(0,1fr)_auto]"
            >
              <div className="sm:col-span-1">
                <label className="mb-1 block text-slate-300">Title</label>
                <input
                  name="title"
                  value={taskForm.title}
                  onChange={handleTaskChange}
                  placeholder="Task title"
                />
              </div>

              <div className="sm:col-span-1">
                <label className="mb-1 block text-slate-300">Description</label>
                <input
                  name="description"
                  value={taskForm.description}
                  onChange={handleTaskChange}
                  placeholder="Short description (optional)"
                />
              </div>

              <div>
                <label className="mb-1 block text-slate-300">Status</label>
                <select
                  name="status"
                  value={taskForm.status}
                  onChange={handleTaskChange}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex flex-col items-stretch justify-end gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-indigo-500 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-600"
                >
                  {taskForm.id ? "Update" : "Add"} task
                </button>

                {taskForm.id && (
                  <button
                    type="button"
                    onClick={resetTaskForm}
                    className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <div className="max-h-[420px] overflow-y-auto pr-2">
  {tasksLoading ? (
    <p className="text-xs text-slate-400">Loading tasks...</p>
  ) : tasks.length === 0 ? (
    <p className="text-xs text-slate-400">
      No tasks found. Create your first one above.
    </p>
  ) : (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
      {tasks.map((task) => (
        <div
          key={task._id}
          className="group relative rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-sm ring-1 ring-white/5 backdrop-blur transition
                     hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/90"
        >
          <div className="flex h-44 flex-col">
            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-slate-100 truncate">
                  {task.title}
                </h3>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                      task.status === "completed"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : task.status === "in-progress"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-slate-700/60 text-slate-200 border-slate-500/40"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>

              {/* Actions dropdown */}
              <div className="relative shrink-0" data-task-menu>
                <button
                  type="button"
                  onClick={() => toggleMenu(task._id)}
                  aria-label="Task actions"
                  aria-haspopup="menu"
                  aria-expanded={openMenuId === task._id}
                  className="rounded-md border border-slate-700 bg-slate-800/40 px-2 py-1 text-[12px] text-slate-100
                             hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                >
                  ⋮
                </button>

                {openMenuId === task._id && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-32 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 shadow-xl z-30"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleTaskEdit(task);
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-100 hover:bg-slate-800"
                    >
                      ✏️ <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleTaskDelete(task._id);
                        setOpenMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-200 hover:bg-red-500/20"
                    >
                      🗑️ <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="mt-3 flex-1">
              {task.description ? (
                <p className="text-xs text-slate-300 leading-snug max-h-14 overflow-hidden">
                  {task.description}
                </p>
              ) : (
                <p className="text-xs text-slate-500 italic">No description</p>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3">
              <div className="h-px w-full bg-slate-800/80 mb-2" />
              <p className="text-[10px] text-slate-500">
                Created{" "}
                {new Date(task.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Dashboard;
