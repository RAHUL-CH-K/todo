import { AlertCircle, CheckSquare, RotateCcw, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TodoForm } from './components/TodoForm';
import { TodoItem } from './components/TodoItem';
import { supabase } from './supabaseClient.js';
import type { FilterStatus, Priority, Todo } from './types/todo';
import { isTodoOverdue } from './utils/date';

const FILTER_OPTIONS: Array<{ id: FilterStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
];

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message || 'Failed to load todos from Supabase.');
    } else {
      setTodos((data ?? []) as Todo[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  function handleAdded(newTodo: Todo) {
    setTodos((prev) => [newTodo, ...prev]);
  }

  async function handleToggleComplete(todo: Todo) {
    setError(null);
    const nextCompleted = !todo.completed;

    const { data, error: updateError } = await supabase
      .from('todos')
      .update({ completed: nextCompleted })
      .eq('id', todo.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message || 'Could not update todo.');
      return;
    }

    if (data) {
      setTodos((prev) => prev.map((item) => (item.id === todo.id ? (data as Todo) : item)));
    }
  }

  async function handleUpdate(
    id: string,
    updates: {
      title: string;
      description: string | null;
      priority: Priority;
      due_date: string | null;
    }
  ) {
    const { data, error: updateError } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message || 'Could not save changes.');
    }

    if (data) {
      setTodos((prev) => prev.map((item) => (item.id === id ? (data as Todo) : item)));
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    const { error: deleteError } = await supabase.from('todos').delete().eq('id', id);

    if (deleteError) {
      setError(deleteError.message || 'Could not delete todo.');
      return;
    }

    setTodos((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleClearCompleted() {
    setClearing(true);
    setError(null);

    const { error: clearError } = await supabase
      .from('todos')
      .delete()
      .eq('completed', true);

    setClearing(false);

    if (clearError) {
      setError(clearError.message || 'Could not clear completed todos.');
      return;
    }

    setTodos((prev) => prev.filter((item) => !item.completed));
    setConfirmClear(false);
  }

  const counts = useMemo(() => {
    let active = 0;
    let completed = 0;
    let overdue = 0;
    for (const todo of todos) {
      if (todo.completed) {
        completed += 1;
      } else {
        active += 1;
        if (isTodoOverdue(todo.due_date, todo.completed)) {
          overdue += 1;
        }
      }
    }
    return { all: todos.length, active, completed, overdue };
  }, [todos]);

  const visibleTodos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return todos.filter((todo) => {
      if (filter === 'active' && todo.completed) return false;
      if (filter === 'completed' && !todo.completed) return false;
      if (query.length > 0) {
        const titleMatch = todo.title.toLowerCase().includes(query);
        const descMatch = (todo.description ?? '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });
  }, [todos, filter, search]);

  const hasFilters = filter !== 'all' || search.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap font-display">
            TaskLedger
          </span>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono tabular-nums">
            <span>{counts.active} active</span>
            <span aria-hidden="true">·</span>
            <span>{counts.completed} done</span>
            {counts.overdue > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-red-600 font-semibold">{counts.overdue} overdue</span>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <TodoForm onAdded={handleAdded} />

        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search todos..."
                aria-label="Search todos"
                className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              role="tablist"
              aria-label="Filter todos"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto"
            >
              {FILTER_OPTIONS.map((option) => {
                const isSelected = filter === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setFilter(option.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>{option.label}</span>
                    <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                      {counts[option.id]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {counts.completed > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 tabular-nums">
                {counts.completed} completed {counts.completed === 1 ? 'todo' : 'todos'}
              </span>

              {!confirmClear ? (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Clear completed</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-slate-700 font-medium">
                    Remove {counts.completed} completed?
                  </span>
                  <button
                    type="button"
                    disabled={clearing}
                    onClick={handleClearCompleted}
                    className="px-2.5 py-1 font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-60"
                  >
                    {clearing ? 'Clearing...' : 'Confirm'}
                  </button>
                  <button
                    type="button"
                    disabled={clearing}
                    onClick={() => setConfirmClear(false)}
                    className="px-2.5 py-1 font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center justify-between gap-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadTodos}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-800 bg-white border border-red-200 rounded-lg hover:bg-red-100/60 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        )}

        <section
          aria-label="Todos list"
          className="bg-white border border-slate-200 rounded-xl overflow-hidden"
        >
          {loading ? (
            <ul className="divide-y divide-slate-200" aria-label="Loading todos">
              {[0, 1, 2].map((idx) => (
                <li key={idx} className="p-4 flex items-start gap-3 animate-pulse">
                  <div className="w-5 h-5 mt-0.5 rounded-md bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </li>
              ))}
            </ul>
          ) : visibleTodos.length === 0 ? (
            <div className="px-6 py-12 text-center max-w-sm mx-auto">
              <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                <CheckSquare className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                {hasFilters ? 'No matching todos' : 'No todos yet'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {hasFilters
                  ? 'Try clearing your search or switching filters.'
                  : 'Create your first todo above to get started.'}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                  className="mt-4 px-3.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {visibleTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={handleToggleComplete}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
