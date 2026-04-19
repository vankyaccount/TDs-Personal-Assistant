import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Flag, Check, Circle, GripVertical } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import type { Task as TaskType } from '../types';

const quadrants = [
  { id: 1, title: 'Do First', desc: 'Urgent & Important', headerClass: 'bg-red-500/30 border-red-500/40', titleClass: 'text-red-300' },
  { id: 2, title: 'Schedule', desc: 'Important & Not Urgent', headerClass: 'bg-gold/20 border-gold/40', titleClass: 'text-gold' },
  { id: 3, title: 'Delegate', desc: 'Urgent & Not Important', headerClass: 'bg-bts-purple/30 border-bts-purple/50', titleClass: 'text-lavender' },
  { id: 4, title: 'Eliminate', desc: 'Not Urgent & Not Important', headerClass: 'bg-gray-500/20 border-gray-500/30', titleClass: 'text-gray-400' },
];

function TaskCard({ task, onDelete, onToggleStatus }: { task: TaskType; onDelete: (id: string) => void; onToggleStatus: (id: string, status: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        transition,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined;

  const isCompleted = task.status === 'completed';

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`bg-surface rounded-lg p-3 border border-border hover:border-bts-purple/50 mb-2 ${isCompleted ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            {/* Drag handle — only this receives drag listeners */}
            <div {...listeners} className="mt-0.5 cursor-grab active:cursor-grabbing text-text-muted hover:text-lavender flex-shrink-0">
              <GripVertical size={14} />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStatus(task.id, isCompleted ? 'pending' : 'completed'); }}
              className={`mt-0.5 p-0.5 rounded-full transition-colors flex-shrink-0 ${
                isCompleted ? 'text-green-400 hover:text-green-300' : 'text-text-muted hover:text-bts-purple'
              }`}
            >
              {isCompleted ? <Check size={16} className="fill-current" /> : <Circle size={16} />}
            </button>
            <div className="flex-1">
              <h4 className={`font-medium text-sm ${isCompleted ? 'line-through text-text-muted' : 'text-text'}`}>{task.title}</h4>
              {task.description && <p className="text-xs text-text-muted mt-1">{task.description}</p>}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded ${
                  task.priority === 'high' ? 'bg-red-500/20 text-red-200' :
                  task.priority === 'medium' ? 'bg-gold/20 text-gold' :
                  'bg-lavender/20 text-lavender'
                }`}>
                  <Flag size={10} className="inline mr-1" />
                  {task.priority}
                </span>
                {task.dueDate && (
                  <span className="text-xs text-text-muted flex items-center">
                    <Calendar size={10} className="mr-1" />
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1 hover:bg-red-500/20 rounded transition-colors text-text-muted hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [activeId, setActiveId] = useState<string | null>(null);

  const token = useAuthStore((s) => s.token);
  const tasks = useTaskStore((s) => s.tasks);
  const setTasks = useTaskStore((s) => s.setTasks);
  const addTask = useTaskStore((s) => s.addTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setTasks(await res.json());
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, quadrant: 1 }),
      });
      if (res.ok) {
        addTask(await res.json());
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
        setShowForm(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      deleteTask(id);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        updateTask(id, { status: updated.status });
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const task = tasks.find((t) => t.id === active.id);
      if (task) {
        const newQuadrant = parseInt(over.id as string);
        try {
          await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ quadrant: newQuadrant }),
          });
          updateTask(task.id, { quadrant: newQuadrant as 1 | 2 | 3 | 4 });
        } catch (err) {
          console.error('Failed to update task quadrant:', err);
        }
      }
    }
  };

  const getTasksByQuadrant = (quadrant: number) => tasks.filter((t) => t.quadrant === quadrant && t.status !== 'completed');
  const getCompletedTasks = () => tasks.filter((t) => t.status === 'completed');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gradient">Eisenhower Matrix</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Task
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="card bg-surface border-border"
          >
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-field"
                required
              />
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="input-field"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="text"
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input-field col-span-2"
              />
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input-field"
              />
              <button type="submit" className="btn-primary">
                Create Task
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quadrants.map((q) => (
            <div key={q.id} className="bg-surface rounded-lg border border-border overflow-hidden">
              <div className={`p-3 border-b ${q.headerClass}`}>
                <h3 className={`font-semibold ${q.titleClass}`}>{q.title}</h3>
                <p className="text-xs text-text-muted">{q.desc}</p>
              </div>
              <div className="p-3 min-h-[200px]" data-overrides={true} id={q.id.toString()}>
                <SortableContext
                  items={getTasksByQuadrant(q.id).map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence>
                    {getTasksByQuadrant(q.id).map((task) => (
                      <TaskCard key={task.id} task={task} onDelete={handleDelete} onToggleStatus={handleToggleStatus} />
                    ))}
                  </AnimatePresence>
                </SortableContext>
              </div>
            </div>
          ))}
        </div>
        <DragOverlay>
          {activeId ? <div className="bg-bts-purple rounded-lg p-3 text-white">Dragging...</div> : null}
        </DragOverlay>
      </DndContext>

      {/* Completed Tasks Section */}
      {getCompletedTasks().length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-lg border border-border overflow-hidden"
        >
          <div className="p-3 bg-green-500/10 border-b border-border">
            <h3 className="font-semibold text-text">Completed Tasks</h3>
            <p className="text-xs text-text-muted">{getCompletedTasks().length} task{getCompletedTasks().length !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {getCompletedTasks().map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="bg-surface-hover rounded-lg p-3 border border-border hover:border-green-400/50 flex items-center justify-between gap-2"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-sm line-through text-text-muted">{task.title}</h4>
                    <p className="text-xs text-text-muted mt-1">
                      {quadrants.find(q => q.id === task.quadrant)?.title || 'Unknown'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(task.id, 'pending')}
                    className="px-3 py-1.5 rounded text-xs font-medium bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors"
                  >
                    Restore
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
}
