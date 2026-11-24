import { Calendar, Check, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Priority, Todo } from '../types/todo';
import { formatDueDate, isTodoOverdue } from '../utils/date';

interface TodoItemProps {
  todo: Todo;
  onToggleComplete: (todo: Todo) => Promise<void>;
  onUpdate: (
    id: string,
    updates: {
      title: string;
      description: string | null;
      priority: Priority;
      due_date: string | null;
    }
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITY_BADGE: Record<Priority, { label: string; className: string }> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  high: {
    label: 'High',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

export function TodoItem({ todo, onToggleComplete, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description ?? '');
  const [editPriority, setEditPriority] = useState<Priority>(todo.priority);
  const [editDueDate, setEditDueDate] = useState(todo.due_date ?? '');
  const [editError, setEditError] = useState<string | null>(null);

  const overdue = isTodoOverdue(todo.due_date, todo.completed);
  const formattedDate = formatDueDate(todo.due_date);
  const badge = PRIORITY_BADGE[todo.priority] ?? PRIORITY_BADGE.medium;

  function startEdit() {
    setEditTitle(todo.title);
    setEditDescription(todo.description ?? '');
    setEditPriority(todo.priority);
    setEditDueDate(todo.due_date ?? '');
    setEditError(null);
    setConfirmingDelete(false);
    setIsEditing(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditError('Title cannot be empty.');
      return;
    }

    setBusy(true);
    setEditError(null);
    try {
      await onUpdate(todo.id, {
        title: trimmedTitle,
        description: editDescription.trim() || null,
        priority: editPriority,
        due_date: editDueDate || null,
      });
      setIsEditing(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update todo.');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle() {
    setBusy(true);
    try {
      await onToggleComplete(todo);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(todo.id);
    } finally {
      setBusy(false);
    }
  }

  if (isEditing) {
    return (
      <li className="p-4 bg-slate-50">
        <form onSubmit={handleSave} className="space-y-3">
          {editError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {editError}
            </p>
          )}

          <input
            type="text"
            autoFocus
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Todo title"
            className="w-full px-3 py-2 text-sm font-medium bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />

          <textarea
            rows={2}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
                aria-label="Edit priority"
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-800"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                aria-label="Edit due date"
                className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60"
              >
                {busy ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`p-4 transition-colors ${
        overdue ? 'bg-red-50/60 hover:bg-red-50/90' : 'hover:bg-slate-50/70'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={handleToggle}
          role="checkbox"
          aria-checked={todo.completed}
          aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`}
          className="inline-flex items-center justify-center w-10 h-10 -ml-2 -my-1.5 shrink-0 rounded-lg focus-visible:outline-2 focus-visible:outline-blue-600"
        >
          <span
            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
              todo.completed
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'bg-white border-slate-300 hover:border-slate-500 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
          </span>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={`text-[15px] font-medium break-words ${
                    todo.completed ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {todo.title}
                </p>

                <span
                  className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full border ${
                    todo.completed
                      ? 'bg-slate-100 text-slate-500 border-slate-200'
                      : badge.className
                  }`}
                >
                  {badge.label}
                </span>

                {overdue && (
                  <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full bg-red-600 text-white">
                    Overdue
                  </span>
                )}
              </div>

              {todo.description && (
                <p
                  className={`mt-1 text-sm break-words ${
                    todo.completed ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {todo.description}
                </p>
              )}

              {formattedDate && (
                <p
                  className={`mt-1.5 inline-flex items-center gap-1 text-xs font-mono tabular-nums ${
                    overdue ? 'text-red-700 font-medium' : 'text-slate-500'
                  }`}
                >
                  <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
                  <span>Due {formattedDate}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!confirmingDelete ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={startEdit}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md whitespace-nowrap"
                  >
                    <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmingDelete(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-100/70 rounded-md whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-slate-700">Delete?</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDelete}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-60"
                  >
                    {busy ? 'Deleting...' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmingDelete(false)}
                    className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}
