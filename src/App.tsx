import { useDeferredValue, useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type Priority = 'Low' | 'Medium' | 'High'
type StatusFilter = 'all' | 'active' | 'completed'
type PriorityFilter = 'all' | Priority
type SortOption = 'smart' | 'due' | 'recent' | 'priority'
type DueTone = 'complete' | 'overdue' | 'today' | 'upcoming'

type Task = {
  id: string
  title: string
  details: string
  category: string
  dueDate: string
  priority: Priority
  completed: boolean
  createdAt: string
}

type TaskForm = {
  title: string
  details: string
  category: string
  dueDate: string
  priority: Priority
}

type StatCardProps = {
  label: string
  value: string | number
  copy: string
}

type FilterPillProps = {
  label: string
  isActive: boolean
  onClick: () => void
}

type TaskCardProps = {
  task: Task
  onToggle: (taskId: string) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

const STORAGE_KEY = 'momentum-board.tasks.v1'
const TITLE_LIMIT = 80
const DETAILS_LIMIT = 240
const CATEGORY_LIMIT = 28
const DUE_SOON_WINDOW = 3

const emptyForm: TaskForm = {
  title: '',
  details: '',
  category: 'Operations',
  dueDate: '',
  priority: 'Medium',
}

const starterTasks: Task[] = [
  {
    id: 'task-q2-launch',
    title: 'Approve the Q2 launch readiness checklist',
    details:
      'Review design QA, final release notes, and rollout timing before the product update ships.',
    category: 'Launch',
    dueDate: '2026-04-05',
    priority: 'High',
    completed: false,
    createdAt: '2026-04-01T08:30:00.000Z',
  },
  {
    id: 'task-onboarding',
    title: 'Tighten the onboarding email sequence',
    details:
      'Shorten the first three messages and add a stronger CTA for the setup milestone.',
    category: 'Growth',
    dueDate: '2026-04-09',
    priority: 'Medium',
    completed: false,
    createdAt: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'task-incidents',
    title: 'Document follow-up actions from the reliability retro',
    details:
      'Capture owners, deadlines, and the monitoring changes agreed in the incident review.',
    category: 'Operations',
    dueDate: '',
    priority: 'Low',
    completed: false,
    createdAt: '2026-04-02T12:45:00.000Z',
  },
  {
    id: 'task-vendor',
    title: 'Confirm legal approval for the analytics vendor renewal',
    details:
      'Finalize procurement sign-off and send the renewal note to finance before Friday.',
    category: 'Finance',
    dueDate: '2026-04-02',
    priority: 'High',
    completed: true,
    createdAt: '2026-03-31T16:20:00.000Z',
  },
]

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All tasks' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

const priorityOptions: Array<{ value: PriorityFilter; label: string }> = [
  { value: 'all', label: 'Any priority' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

const sortOptions: Array<{ value: SortOption; label: string }> = [
  { value: 'smart', label: 'Smart order' },
  { value: 'due', label: 'Nearest due date' },
  { value: 'priority', label: 'Priority first' },
  { value: 'recent', label: 'Most recent' },
]

const priorityRank: Record<Priority, number> = {
  High: 0,
  Medium: 1,
  Low: 2,
}

const priorityBadgeCopy: Record<Priority, string> = {
  High: 'High priority',
  Medium: 'Medium priority',
  Low: 'Low priority',
}

function isPriority(value: unknown): value is Priority {
  return value === 'Low' || value === 'Medium' || value === 'High'
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.details === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.dueDate === 'string' &&
    typeof candidate.completed === 'boolean' &&
    typeof candidate.createdAt === 'string' &&
    isPriority(candidate.priority)
  )
}

function readStoredTasks(): Task[] {
  if (typeof window === 'undefined') {
    return starterTasks
  }

  try {
    const storedTasks = window.localStorage.getItem(STORAGE_KEY)

    if (!storedTasks) {
      return starterTasks
    }

    const parsed = JSON.parse(storedTasks) as unknown

    if (Array.isArray(parsed) && parsed.every(isTask)) {
      return parsed
    }
  } catch {
    return starterTasks
  }

  return starterTasks
}

function parseDate(date: string) {
  return new Date(`${date}T00:00:00`)
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(parseDate(date))
}

function formatCreatedAt(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

function formatSavedTime(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function getToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function getDifferenceInDays(date: string) {
  return Math.round((parseDate(date).getTime() - getToday().getTime()) / 86_400_000)
}

function getDueState(task: Task): { label: string; tone: DueTone } {
  if (task.completed) {
    return {
      label: 'Completed',
      tone: 'complete',
    }
  }

  if (!task.dueDate) {
    return {
      label: 'Flexible',
      tone: 'upcoming',
    }
  }

  const differenceInDays = getDifferenceInDays(task.dueDate)

  if (differenceInDays < 0) {
    return {
      label: 'Overdue',
      tone: 'overdue',
    }
  }

  if (differenceInDays === 0) {
    return {
      label: 'Due today',
      tone: 'today',
    }
  }

  if (differenceInDays === 1) {
    return {
      label: 'Due tomorrow',
      tone: 'upcoming',
    }
  }

  return {
    label: `${differenceInDays} days left`,
    tone: 'upcoming',
  }
}

function compareDueDates(leftTask: Task, rightTask: Task) {
  if (leftTask.dueDate && rightTask.dueDate) {
    return leftTask.dueDate.localeCompare(rightTask.dueDate)
  }

  if (leftTask.dueDate) {
    return -1
  }

  if (rightTask.dueDate) {
    return 1
  }

  return 0
}

function sortTasks(tasks: Task[], sortOption: SortOption) {
  return [...tasks].sort((leftTask, rightTask) => {
    if (leftTask.completed !== rightTask.completed) {
      return Number(leftTask.completed) - Number(rightTask.completed)
    }

    const priorityDifference =
      priorityRank[leftTask.priority] - priorityRank[rightTask.priority]
    const dueDateDifference = compareDueDates(leftTask, rightTask)
    const recencyDifference =
      rightTask.createdAt.localeCompare(leftTask.createdAt)

    switch (sortOption) {
      case 'due':
        return dueDateDifference || priorityDifference || recencyDifference
      case 'recent':
        return recencyDifference || priorityDifference || dueDateDifference
      case 'priority':
        return priorityDifference || dueDateDifference || recencyDifference
      case 'smart':
      default:
        return priorityDifference || dueDateDifference || recencyDifference
    }
  })
}

function countTasksByCategory(tasks: Task[]) {
  const counts = tasks.reduce<Record<string, number>>((accumulator, task) => {
    const nextCategory = task.category.trim() || 'General'
    accumulator[nextCategory] = (accumulator[nextCategory] ?? 0) + 1
    return accumulator
  }, {})

  return Object.entries(counts)
    .sort(
      ([leftCategory, leftCount], [rightCategory, rightCount]) =>
        rightCount - leftCount || leftCategory.localeCompare(rightCategory),
    )
    .map(([category, count]) => ({ category, count }))
}

function pluralize(word: string, count: number) {
  return count === 1 ? word : `${word}s`
}

function StatCard({ label, value, copy }: StatCardProps) {
  return (
    <article className="stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-copy">{copy}</p>
    </article>
  )
}

function FilterPill({ label, isActive, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      className={`pill-button${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      {label}
    </button>
  )
}

function TaskCard({ task, onToggle, onEdit, onDelete }: TaskCardProps) {
  const dueState = getDueState(task)

  return (
    <article
      className={`task-card task-card--${task.priority.toLowerCase()}${
        task.completed ? ' task-card--complete' : ''
      }`}
    >
      <div className="task-card__top">
        <button
          type="button"
          className={`task-toggle${task.completed ? ' is-complete' : ''}`}
          onClick={() => onToggle(task.id)}
          aria-label={
            task.completed
              ? `Mark ${task.title} as incomplete`
              : `Mark ${task.title} as complete`
          }
        >
          {task.completed ? 'Done' : 'Open'}
        </button>

        <div className="task-card__content">
          <div className="task-card__eyebrow">
            <span className="tag">{task.category}</span>
            <span className={`due-chip due-chip--${dueState.tone}`}>
              {dueState.label}
            </span>
          </div>

          <div className="task-card__headline">
            <h3>{task.title}</h3>
            <span
              className={`priority-pill priority-pill--${task.priority.toLowerCase()}`}
            >
              {priorityBadgeCopy[task.priority]}
            </span>
          </div>

          <p className="task-card__description">
            {task.details || 'No extra notes added yet.'}
          </p>
        </div>
      </div>

      <div className="task-card__footer">
        <div className="task-card__meta">
          <span className="task-date">
            {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
          </span>
          <span className="task-date">Created {formatCreatedAt(task.createdAt)}</span>
        </div>

        <div className="task-card__actions">
          <button
            type="button"
            className="text-button"
            onClick={() => onEdit(task)}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-button text-button--danger"
            onClick={() => onDelete(task)}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [tasks, setTasks] = useState<Task[]>(() => readStoredTasks())
  const [form, setForm] = useState<TaskForm>(emptyForm)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('smart')
  const [searchTerm, setSearchTerm] = useState('')
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false)
  const [isStorageAvailable, setIsStorageAvailable] = useState(true)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)

  const deferredSearch = useDeferredValue(searchTerm.trim().toLowerCase())
  const composerRef = useRef<HTMLElement | null>(null)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const titleHintId = useId()
  const detailsHintId = useId()
  const boardStatusId = useId()

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== window.localStorage || event.key !== STORAGE_KEY) {
        return
      }

      setTasks(readStoredTasks())
      setIsStorageAvailable(true)
      setLastSavedAt(new Date().toISOString())
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    if (!editingTaskId) {
      return
    }

    composerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    titleInputRef.current?.focus()
  }, [editingTaskId])

  const sortedTasks = sortTasks(tasks, sortOption)
  const visibleTasks = sortedTasks.filter((task) => {
    if (statusFilter === 'active' && task.completed) {
      return false
    }

    if (statusFilter === 'completed' && !task.completed) {
      return false
    }

    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false
    }

    if (!deferredSearch) {
      return true
    }

    const searchableText =
      `${task.title} ${task.details} ${task.category}`.toLowerCase()

    return searchableText.includes(deferredSearch)
  })

  const activeTasks = tasks.filter((task) => !task.completed)
  const activeCount = activeTasks.length
  const completedCount = tasks.length - activeCount
  const overdueCount = tasks.filter((task) => {
    if (task.completed || !task.dueDate) {
      return false
    }

    return getDueState(task).tone === 'overdue'
  }).length
  const dueSoonCount = tasks.filter((task) => {
    if (task.completed || !task.dueDate) {
      return false
    }

    const differenceInDays = getDifferenceInDays(task.dueDate)
    return differenceInDays >= 0 && differenceInDays <= DUE_SOON_WINDOW
  }).length
  const highPriorityCount = activeTasks.filter(
    (task) => task.priority === 'High',
  ).length
  const completionRate =
    tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)
  const focusTasks = sortTasks(activeTasks, 'smart').slice(0, 3)
  const nextMilestone =
    sortTasks(activeTasks.filter((task) => Boolean(task.dueDate)), 'due')[0] ??
    sortTasks(activeTasks, 'smart')[0]
  const topCategories = countTasksByCategory(activeTasks).slice(0, 3)
  const maxCategoryCount = topCategories[0]?.count ?? 1
  const editingTask =
    editingTaskId === null
      ? null
      : tasks.find((task) => task.id === editingTaskId) ?? null
  const showTitleError = hasAttemptedSubmit && form.title.trim().length === 0
  const hasActiveView =
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    sortOption !== 'smart' ||
    Boolean(deferredSearch)
  const activeViewCount =
    Number(statusFilter !== 'all') +
    Number(priorityFilter !== 'all') +
    Number(sortOption !== 'smart') +
    Number(Boolean(deferredSearch))

  const boardSummary =
    tasks.length === 0
      ? 'The board is empty. Add a task or load the demo data.'
      : visibleTasks.length === tasks.length
        ? `Showing all ${tasks.length} ${pluralize('task', tasks.length)}.`
        : `Showing ${visibleTasks.length} of ${tasks.length} ${pluralize(
            'task',
            tasks.length,
          )}.`

  const boardAnnouncement =
    visibleTasks.length === 0
      ? 'No tasks match the current board settings.'
      : `${visibleTasks.length} ${pluralize('task', visibleTasks.length)} visible in the board.`

  const todayLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  const saveLabel = isStorageAvailable
    ? lastSavedAt
      ? `Saved locally at ${formatSavedTime(lastSavedAt)}`
      : 'Local-first persistence'
    : 'Local storage unavailable'

  function updateFormField<Key extends keyof TaskForm>(
    field: Key,
    value: TaskForm[Key],
  ) {
    setForm((previousForm) => ({
      ...previousForm,
      [field]: value,
    }))
  }

  function scrollComposerIntoView() {
    composerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    titleInputRef.current?.focus()
  }

  function persistTasks(nextTasks: Task[]) {
    setTasks(nextTasks)

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks))
      setIsStorageAvailable(true)
      setLastSavedAt(new Date().toISOString())
    } catch {
      setIsStorageAvailable(false)
    }
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingTaskId(null)
    setHasAttemptedSubmit(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const title = form.title.trim()

    if (!title) {
      setHasAttemptedSubmit(true)
      titleInputRef.current?.focus()
      return
    }

    const nextTaskDetails = {
      title,
      details: form.details.trim(),
      category: form.category.trim() || 'General',
      dueDate: form.dueDate,
      priority: form.priority,
    }

    if (editingTaskId) {
      persistTasks(
        tasks.map((task) =>
          task.id === editingTaskId ? { ...task, ...nextTaskDetails } : task,
        ),
      )
      resetForm()
      return
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
      ...nextTaskDetails,
    }

    persistTasks([newTask, ...tasks])
    setForm((previousForm) => ({
      ...emptyForm,
      category: previousForm.category.trim() || emptyForm.category,
      priority: previousForm.priority,
    }))
    setHasAttemptedSubmit(false)
  }

  function handleToggleTask(taskId: string) {
    persistTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    )
  }

  function handleDeleteTask(task: Task) {
    if (
      !window.confirm(`Delete "${task.title}"? This action cannot be undone.`)
    ) {
      return
    }

    if (editingTaskId === task.id) {
      resetForm()
    }

    persistTasks(tasks.filter((previousTask) => previousTask.id !== task.id))
  }

  function handleEditTask(task: Task) {
    setEditingTaskId(task.id)
    setHasAttemptedSubmit(false)
    setForm({
      title: task.title,
      details: task.details,
      category: task.category,
      dueDate: task.dueDate,
      priority: task.priority,
    })
  }

  function handleClearCompleted() {
    if (completedCount === 0) {
      return
    }

    if (
      !window.confirm(
        `Remove ${completedCount} completed ${pluralize(
          'task',
          completedCount,
        )} from the board?`,
      )
    ) {
      return
    }

    const editingTaskWillBeRemoved =
      editingTaskId !== null &&
      tasks.some((task) => task.id === editingTaskId && task.completed)

    if (editingTaskWillBeRemoved) {
      resetForm()
    }

    persistTasks(tasks.filter((task) => !task.completed))
  }

  function handleMarkAllDone() {
    if (activeCount === 0) {
      return
    }

    persistTasks(tasks.map((task) => ({ ...task, completed: true })))
  }

  function handleResetView() {
    setSearchTerm('')
    setStatusFilter('all')
    setPriorityFilter('all')
    setSortOption('smart')
  }

  function handleLoadStarterTasks() {
    persistTasks(starterTasks)
    handleResetView()
    resetForm()
  }

  function handleStartNewTask() {
    resetForm()
    scrollComposerIntoView()
  }

  return (
    <div className="app-shell">
      <aside className="overview-panel">
        <div className="brand-row">
          <div className="brand-mark">
            <span className="brand-mark__dot" aria-hidden="true"></span>
            Momentum Board
          </div>
          <span
            className={`status-chip${isStorageAvailable ? '' : ' is-warning'}`}
          >
            {saveLabel}
          </span>
        </div>

        <p className="section-label">Delivery command center</p>
        <h1 className="overview-title">
          Professional task management without the clutter.
        </h1>
        <p className="overview-copy">
          Keep priorities visible, deadlines actionable, and progress easy to
          review in a calm, local-first workflow.
        </p>

        <div className="overview-meta">
          <span className="mini-chip">Responsive UI</span>
          <span className="mini-chip">Accessible controls</span>
          <span className="mini-chip">Cross-tab sync</span>
        </div>

        <div className="stat-grid">
          <StatCard
            label="Open work"
            value={activeCount}
            copy="Tasks currently in motion."
          />
          <StatCard
            label="Due soon"
            value={dueSoonCount}
            copy="Targets landing in the next few days."
          />
          <StatCard
            label="High priority"
            value={highPriorityCount}
            copy="Items demanding faster attention."
          />
          <StatCard
            label="Completed"
            value={`${completionRate}%`}
            copy="Board completion at a glance."
          />
        </div>

        <section className="health-panel">
          <div className="health-panel__top">
            <div>
              <p className="focus-panel__label">Execution health</p>
              <strong className="health-panel__value">
                {completionRate}% complete
              </strong>
            </div>
            <span className="header-date">{todayLabel}</span>
          </div>
          <div
            className="progress-bar"
            role="progressbar"
            aria-label="Completion progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={completionRate}
          >
            <span style={{ width: `${completionRate}%` }}></span>
          </div>
          <p className="health-panel__copy">
            {overdueCount === 0
              ? 'Delivery is on track. Nothing is overdue right now.'
              : `${overdueCount} overdue ${pluralize(
                  'task',
                  overdueCount,
                )} need attention.`}
          </p>
        </section>

        <section className="focus-panel">
          <div className="focus-panel__head">
            <div>
              <p className="focus-panel__label">Focus lane</p>
              <h2>Next up</h2>
            </div>
            <p className="focus-panel__note">
              {nextMilestone?.dueDate
                ? `Closest target ${formatDate(nextMilestone.dueDate)}`
                : 'No hard deadline locked in'}
            </p>
          </div>

          {focusTasks.length > 0 ? (
            <ul className="focus-list">
              {focusTasks.map((task) => {
                const dueState = getDueState(task)

                return (
                  <li key={task.id} className="focus-item">
                    <strong>{task.title}</strong>
                    <span>{task.category}</span>
                    <span>{dueState.label}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="focus-empty">
              Everything is complete. Add a new task to restart the board.
            </p>
          )}
        </section>

        <section className="signal-panel">
          <div className="signal-panel__head">
            <div>
              <p className="focus-panel__label">Category load</p>
              <h2>Where work is stacking up</h2>
            </div>
            <p className="signal-panel__caption">
              {topCategories.length > 0
                ? `${topCategories.length} active areas`
                : 'No active work'}
            </p>
          </div>

          {topCategories.length > 0 ? (
            <ul className="signal-list">
              {topCategories.map((entry) => (
                <li key={entry.category} className="signal-item">
                  <div className="signal-item__row">
                    <strong>{entry.category}</strong>
                    <span>{entry.count}</span>
                  </div>
                  <div className="signal-item__meter" aria-hidden="true">
                    <span
                      style={{
                        width: `${(entry.count / maxCategoryCount) * 100}%`,
                      }}
                    ></span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="focus-empty">
              Categories will appear here as soon as work is added.
            </p>
          )}
        </section>
      </aside>

      <main className="workspace">
        <section className="surface-card" ref={composerRef}>
          <div className="section-head">
            <div>
              <p className="section-label">
                {editingTaskId ? 'Editing mode' : 'Task composer'}
              </p>
              <h2 className="section-title">
                {editingTaskId
                  ? 'Refine the selected task'
                  : 'Add focused work in seconds'}
              </h2>
            </div>
            <p className="section-copy">
              Capture a clear outcome, set urgency, and keep each task ready for
              action.
            </p>
          </div>

          <form className="composer-form" onSubmit={handleSubmit} noValidate>
            <div className="composer-grid">
              <label className="field field--wide">
                <div className="field__meta">
                  <span>Task title</span>
                  <span className="field__count">
                    {form.title.length}/{TITLE_LIMIT}
                  </span>
                </div>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={form.title}
                  onChange={(event) => {
                    updateFormField('title', event.target.value)
                    if (hasAttemptedSubmit && event.target.value.trim()) {
                      setHasAttemptedSubmit(false)
                    }
                  }}
                  placeholder="Finalize customer onboarding checklist"
                  maxLength={TITLE_LIMIT}
                  required
                  aria-invalid={showTitleError}
                  aria-describedby={titleHintId}
                />
                <small
                  id={titleHintId}
                  className={`field__hint${showTitleError ? ' is-error' : ''}`}
                >
                  {showTitleError
                    ? 'A task title is required before you can save.'
                    : 'Start with a verb so the next action is obvious.'}
                </small>
              </label>

              <label className="field field--wide">
                <div className="field__meta">
                  <span>Notes</span>
                  <span className="field__count">
                    {form.details.length}/{DETAILS_LIMIT}
                  </span>
                </div>
                <textarea
                  value={form.details}
                  onChange={(event) =>
                    updateFormField('details', event.target.value)
                  }
                  placeholder="Capture context, the desired outcome, or handoff details."
                  maxLength={DETAILS_LIMIT}
                  aria-describedby={detailsHintId}
                />
                <small id={detailsHintId} className="field__hint">
                  Keep supporting notes short enough to scan during standups or reviews.
                </small>
              </label>

              <label className="field">
                <div className="field__meta">
                  <span>Category</span>
                  <span className="field__count">
                    {form.category.length}/{CATEGORY_LIMIT}
                  </span>
                </div>
                <input
                  type="text"
                  value={form.category}
                  onChange={(event) =>
                    updateFormField('category', event.target.value)
                  }
                  placeholder="Operations"
                  maxLength={CATEGORY_LIMIT}
                />
              </label>

              <label className="field">
                <span>Due date</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    updateFormField('dueDate', event.target.value)
                  }
                />
              </label>

              <label className="field field--compact">
                <span>Priority</span>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    updateFormField('priority', event.target.value as Priority)
                  }
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
            </div>

            <div className="composer-actions">
              <div className="helper-stack">
                <p className="helper-text">
                  Short, outcome-based tasks make the board easier to review and
                  easier to trust.
                </p>
                <p className="editing-pill">
                  {editingTask
                    ? `Editing: ${editingTask.title}`
                    : 'New tasks appear instantly in the board below.'}
                </p>
              </div>

              <div className="button-row">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={form.title.trim().length === 0}
                >
                  {editingTaskId ? 'Update task' : 'Add task'}
                </button>
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={resetForm}
                >
                  {editingTaskId ? 'Cancel edit' : 'Reset form'}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="surface-card">
          <div className="section-head">
            <div>
              <p className="section-label">Board controls</p>
              <h2 className="section-title">Find the right task fast</h2>
            </div>
            <p className="section-copy">
              Search by title, notes, or category, then switch the board to the
              exact operational view you need.
            </p>
          </div>

          <div className="control-bar">
            <label className="search-field">
              <span>Search</span>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks, notes, or categories"
                aria-describedby={boardStatusId}
              />
            </label>

            <div className="filter-stack">
              <div className="filter-set">
                <span>Status</span>
                <div className="pill-group">
                  {statusOptions.map((option) => (
                    <FilterPill
                      key={option.value}
                      label={option.label}
                      isActive={statusFilter === option.value}
                      onClick={() => setStatusFilter(option.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="filter-set">
                <span>Priority</span>
                <div className="pill-group">
                  {priorityOptions.map((option) => (
                    <FilterPill
                      key={option.value}
                      label={option.label}
                      isActive={priorityFilter === option.value}
                      onClick={() => setPriorityFilter(option.value)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <label className="field field--compact">
              <span>Sort by</span>
              <select
                value={sortOption}
                onChange={(event) =>
                  setSortOption(event.target.value as SortOption)
                }
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="quick-actions">
              <button
                type="button"
                className="button button--secondary"
                onClick={handleMarkAllDone}
                disabled={activeCount === 0}
              >
                Mark all done
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={handleClearCompleted}
                disabled={completedCount === 0}
              >
                Clear completed
              </button>
              <button
                type="button"
                className="button button--ghost"
                onClick={handleResetView}
                disabled={!hasActiveView}
              >
                Reset view
              </button>
            </div>
          </div>

          <div className="summary-row">
            <span className="summary-pill">{boardSummary}</span>
            {activeViewCount > 0 ? (
              <span className="summary-pill summary-pill--muted">
                {activeViewCount} active view change
                {activeViewCount === 1 ? '' : 's'}
              </span>
            ) : null}
            {tasks.length === 0 ? (
              <button
                type="button"
                className="text-button"
                onClick={handleLoadStarterTasks}
              >
                Load demo tasks
              </button>
            ) : null}
          </div>
        </section>

        <section className="surface-card">
          <div className="task-board__header">
            <div>
              <p className="section-label">Task board</p>
              <h2 className="section-title">Current workload</h2>
            </div>
            <div className="board-badges">
              <span className="mini-chip mini-chip--soft">
                {activeCount} open
              </span>
              <span className="mini-chip mini-chip--soft">
                {dueSoonCount} due soon
              </span>
              <span className="mini-chip mini-chip--soft">
                {highPriorityCount} high priority
              </span>
            </div>
          </div>

          <p id={boardStatusId} className="sr-only" aria-live="polite">
            {boardAnnouncement}
          </p>

          {visibleTasks.length > 0 ? (
            <div className="task-list">
              {visibleTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggleTask}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-state__eyebrow">
                {tasks.length === 0 ? 'Nothing here yet' : 'No matching tasks'}
              </p>
              <h3>
                {tasks.length === 0
                  ? 'Start with a clean, prioritized board.'
                  : 'Try a broader search or reset the board view.'}
              </h3>
              <p>
                {tasks.length === 0
                  ? 'Create your first task or load the demo data to explore the polished workflow.'
                  : 'The current combination of search, filters, and sort order is hiding every task.'}
              </p>
              <div className="button-row">
                {tasks.length === 0 ? (
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={handleLoadStarterTasks}
                  >
                    Load demo tasks
                  </button>
                ) : null}
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={hasActiveView ? handleResetView : handleStartNewTask}
                >
                  {hasActiveView ? 'Reset view' : 'Create a task'}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
