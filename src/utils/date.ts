export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isTodoOverdue(dueDate: string | null, completed: boolean): boolean {
  if (!dueDate || completed) {
    return false;
  }
  return dueDate < getTodayIsoDate();
}

export function formatDueDate(dueDate: string | null): string | null {
  if (!dueDate) {
    return null;
  }

  const parts = dueDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return dueDate;
  }

  const [year, month, day] = parts;
  const dateObj = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
}
