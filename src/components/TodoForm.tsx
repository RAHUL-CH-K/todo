import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient.js';
import type { Priority, Todo } from '../types/todo';

interface TodoFormProps {
  onAdded: (todo: Todo) => void;
}

export function TodoForm({ onAdded }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Please enter a title for your task.');
      return;
    }

    setError(null);
    setSubmitting(true);

    const { data, error: insertError } = await supabase
      .from('todos')
      .insert([
        {
          title: trimmedTitle,
          description: description.trim() || null,
          priority,
          due_date: dueDate || null,
          completed: false,
        },
      ])
      .select()
      .single();

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message || 'Could not add todo.');
      return;
    }

    if (data) {
      onAdded(data as Todo);
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Add a Todo</h2>
      </div>

      {error && (
        <div
          role="alert"
          className="px-3.5 py-2.5 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg"
        >
          {error}
        </div>
      )}

      <div>
        <label htmlFor="todo-title" className="block text-xs font-medium text-slate-700 mb-1.5">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(null);
          }}
          placeholder="What needs to be done?"
          className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
        />
      </div>

      <div>
        <label htmlFor="todo-description" className="block text-xs font-medium text-slate-700 mb-1.5">
          Description <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="todo-description"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add notes or details..."
          className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-y"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label htmlFor="todo-priority" className="block text-xs font-medium text-slate-700 mb-1.5">
            Priority
          </label>
          <select
            id="todo-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full px-3 py-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="todo-due-date" className="block text-xs font-medium text-slate-700 mb-1.5">
            Due date
          </label>
          <input
            id="todo-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>{submitting ? 'Adding...' : 'Add Todo'}</span>
        </button>
      </div>
    </form>
  );
}
