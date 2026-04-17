import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Calendar, Flag } from 'lucide-react';
import { DndContext, DragEndEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useAuthStore } from '../stores/authStore';
import { useTaskStore } from '../stores/taskStore';
import type { Task as TaskType } from '../types';

const quadrants = [
  { id: 1, title: 'Do First', desc: 'Urgent & Important', color: 'red' },
  { id: 2, title: 'Schedule', desc: 'Important & Not Urgent', color: 'gold' },
  { id: 3, title: 'Delegate', desc: 'Urgent & Not Important', color: 'lavender' },
  { id: 4, title: 'Eliminate', desc: 'Not Urgent & Not Important', color: 'gray' },
];

function TaskCard({ task, onDelete }: { task: TaskType; onDelete: (id: string) => void }) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div className="bg-surface rounded-lg p-3 border border-border hover:border-bts-purple/50 cursor-move mb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h4 className="font-medium text-text text-sm">{task.title}</h4>
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
          <button
            onClick={() => onDelete(task.id)}
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

  const getTasksByQuadrant = (quadrant: number) => tasks.filter((t) => t.quadrant === quadrant);

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
        <div className="grid grid-cols-2 gap-4">
          {quadrants.map((q) => (
            <div key={q.id} className="bg-surface rounded-lg border border-border overflow-hidden">
              <div
                className={`p-3 bg-${
                  q.color === 'red' ? 'red-500/20' :
                  q.color === 'gold' ? 'gold-500/20' :
                  q.color === 'lavender' ? 'lavender-500/20' :
                  'gray-500/20'
                } border-b border-border`}
              >
                <h3 className="font-semibold text-text">{q.title}</h3>
                <p className="text-xs text-text-muted">{q.desc}</p>
              </div>
              <div className="p-3 min-h-[200px]" data-overrides={true} id={q.id.toString()}>
                <SortableContext
                  items={getTasksByQuadrant(q.id).map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence>
                    {getTasksByQuadrant(q.id).map((task) => (
                      <TaskCard key={task.id} task={task} onDelete={handleDelete} />
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
    </div>
  );
}
