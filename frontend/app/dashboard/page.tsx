'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '', description: '', priority: 'MEDIUM',
    deadlineDate: '', category: '', recurring: 'NONE', status: 'PENDING',
  });
  const [newTask, setNewTask] = useState({
    title: '', description: '', priority: 'MEDIUM',
    deadlineDate: '', category: '', recurring: 'NONE',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) { router.push('/login'); return; }
    setUser(JSON.parse(userData || '{}'));
    fetchTasks(token);
    fetchStats(token);
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) await Notification.requestPermission();
  };

  const sendPushNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  };

  const checkAndNotify = (taskList: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    taskList.forEach(task => {
      if (task.status === 'COMPLETED') return;
      const deadline = new Date(task.deadlineDate);
      deadline.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
      if (task.status === 'OVERDUE') sendPushNotification('🔴 Task Overdue!', `"${task.title}" is overdue!`);
      else if (daysLeft === 0) sendPushNotification('⚡ Due Today!', `"${task.title}" is due today!`);
      else if (daysLeft === 1) sendPushNotification('📅 Due Tomorrow!', `"${task.title}" is due tomorrow!`);
    });
  };

  const fetchTasks = async (token: string) => {
    try {
      const res = await fetch('https://taskflow-production-aed1.up.railway.app/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTasks(data);
      checkAndNotify(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchStats = async (token: string) => {
    try {
      const res = await fetch('https://taskflow-production-aed1.up.railway.app/api/tasks/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) { console.error(err); }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('https://taskflow-production-aed1.up.railway.app/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setShowModal(false);
        setNewTask({ title: '', description: '', priority: 'MEDIUM', deadlineDate: '', category: '', recurring: 'NONE' });
        fetchTasks(token!);
        fetchStats(token!);
      }
    } catch (err) { console.error(err); }
  };

  const completeTask = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`https://taskflow-production-aed1.up.railway.app/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    fetchTasks(token!);
    fetchStats(token!);
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      deadlineDate: task.deadlineDate.split('T')[0],
      category: task.category || '',
      recurring: task.recurring,
      status: task.status,
    });
    setShowEditModal(true);
  };

  const updateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://taskflow-production-aed1.up.railway.app/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditingTask(null);
        fetchTasks(token!);
        fetchStats(token!);
      }
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`https://taskflow-production-aed1.up.railway.app/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTasks(token!);
    fetchStats(token!);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getPriorityColor = (p: string) => ({
    URGENT: 'bg-red-500/20 text-red-400 border-red-500/30',
    HIGH: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    MEDIUM: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
  }[p] || 'bg-blue-500/20 text-blue-400 border-blue-500/30');

  const getStatusColor = (s: string) => ({
    OVERDUE: 'bg-red-500/20 text-red-400 border-red-500/30',
    PENDING: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    COMPLETED: 'bg-green-500/20 text-green-400 border-green-500/30',
  }[s] || 'bg-gray-500/20 text-gray-400 border-gray-500/30');

  const getDaysLeft = (deadline: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(deadline);
    const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return `${-diff}d overdue`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return '1d left';
    return `${diff}d left`;
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => t.status === 'OVERDUE');
  const todayTasks = tasks.filter(t => {
    const d = new Date(t.deadlineDate); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime() && t.status !== 'COMPLETED';
  });
  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
  const kanbanCols = [
    { key: 'PENDING', label: 'Pending', color: 'text-gray-400', tasks: tasks.filter(t => t.status === 'PENDING') },
    { key: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-400', tasks: tasks.filter(t => t.status === 'IN_PROGRESS') },
    { key: 'OVERDUE', label: 'Overdue', color: 'text-red-400', tasks: tasks.filter(t => t.status === 'OVERDUE') },
    { key: 'COMPLETED', label: 'Completed', color: 'text-green-400', tasks: tasks.filter(t => t.status === 'COMPLETED') },
  ];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const categories = ['ALL', ...Array.from(new Set(tasks.map(t => t.category).filter(Boolean)))];
  const filteredTasks = (taskList: any[]) => taskList.filter(task => {
    const matchSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(search.toLowerCase()));
    const matchPriority = filterPriority === 'ALL' || task.priority === filterPriority;
    const matchCategory = filterCategory === 'ALL' || task.category === filterCategory;
    return matchSearch && matchPriority && matchCategory;
  });

  const navItems = [
    { key: 'dashboard', icon: '⬛', label: 'Dashboard' },
    { key: 'tasks', icon: '✓', label: 'All Tasks', badge: stats.pending },
    { key: 'overdue', icon: '🔴', label: 'Overdue', badge: stats.overdue },
    { key: 'today', icon: '⚡', label: 'Today', badge: todayTasks.length },
    { key: 'kanban', icon: '▦', label: 'Kanban' },
    { key: 'calendar', icon: '📅', label: 'Calendar' },
    { key: 'completed', icon: '✅', label: 'Completed' },
  ];

  const TaskCard = ({ task }: { task: any }) => (
    <div className={`bg-[#1c1c28] border rounded-xl p-4 flex items-start gap-3 transition hover:border-purple-500/30 ${
      task.status === 'OVERDUE' ? 'border-red-500/30' : 'border-white/10'
    }`}>
      <button onClick={() => completeTask(task.id)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-1 transition ${
          task.status === 'COMPLETED' ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-purple-500'
        }`}>
        {task.status === 'COMPLETED' && <span className="text-white text-xs">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-sm ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : 'text-white'}`}>
          {task.title}
        </div>
        {task.description && <div className="text-gray-500 text-xs mt-1 truncate">{task.description}</div>}
        <div className="flex flex-wrap gap-1 mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${getStatusColor(task.status)}`}>{task.status.replace('_', ' ')}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${task.status === 'OVERDUE' ? 'border-red-500/30 text-red-400' : 'border-white/10 text-gray-500'}`}>
            {getDaysLeft(task.deadlineDate)}
          </span>
          {task.reminderCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400">
              🔔 {task.reminderCount}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => openEditModal(task)} className="text-gray-600 hover:text-purple-400 transition text-sm p-1">✎</button>
        <button onClick={() => deleteTask(task.id)} className="text-gray-600 hover:text-red-400 transition text-sm p-1">✕</button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-purple-400 text-xl">Loading...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">

      {/* SIDEBAR */}
      <aside className={`w-56 min-h-screen bg-[#111118] border-r border-white/10 flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Task<span className="text-purple-400">Flow</span></h1>
            <p className="text-gray-500 text-xs mt-1">Productivity OS</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">✕</button>
        </div>
        <nav className="p-3 flex-1">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-3 mb-2">Menu</p>
          {navItems.map(item => (
            <button key={item.key} onClick={() => { setActiveView(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition mb-1 ${
                activeView === item.key ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
              <span>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${item.key === 'overdue' ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'}`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <button onClick={logout} className="text-xs text-gray-500 hover:text-red-400 transition">Logout</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Overlay Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* MAIN */}
      <main className="ml-0 md:ml-56 flex-1 p-4 md:p-6 pb-20 md:pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden bg-[#111118] border border-white/10 rounded-lg p-2 text-gray-400 hover:text-white">
              ☰
            </button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold capitalize">
                {activeView === 'dashboard' ? `Good morning, ${user?.name?.split(' ')[0]} 👋` : activeView}
              </h2>
              <p className="text-gray-500 text-sm mt-1 hidden md:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-lg font-semibold transition text-sm">
            + New Task
          </button>
        </div>

        {/* Search & Filter */}
        {activeView !== 'dashboard' && activeView !== 'kanban' && activeView !== 'calendar' && (
          <div className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="🔍 Search tasks..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-32 bg-[#111118] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm" />
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm">
              <option value="ALL">All Priorities</option>
              <option value="URGENT">🔴 Urgent</option>
              <option value="HIGH">🟡 High</option>
              <option value="MEDIUM">🔵 Medium</option>
              <option value="LOW">🟢 Low</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="bg-[#111118] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 text-sm">
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
              ))}
            </select>
            {(search || filterPriority !== 'ALL' || filterCategory !== 'ALL') && (
              <button onClick={() => { setSearch(''); setFilterPriority('ALL'); setFilterCategory('ALL'); }}
                className="bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg px-3 py-2 text-sm">
                ✕ Clear
              </button>
            )}
          </div>
        )}

        {/* DASHBOARD */}
        {activeView === 'dashboard' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total', value: stats.total || 0, color: 'text-purple-400' },
                { label: 'Pending', value: stats.pending || 0, color: 'text-amber-400' },
                { label: 'Overdue', value: stats.overdue || 0, color: 'text-red-400' },
                { label: 'Done', value: stats.completed || 0, color: 'text-green-400' },
              ].map(s => (
                <div key={s.label} className="bg-[#111118] border border-white/10 rounded-xl p-4">
                  <div className="text-gray-500 text-xs mb-1">{s.label.toUpperCase()}</div>
                  <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="bg-[#111118] border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Overall Progress</span>
                <span className="text-purple-400 font-bold">{stats.completionRate || 0}%</span>
              </div>
              <div className="h-2 bg-[#1c1c28] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionRate || 0}%` }} />
              </div>
            </div>
            {overdueTasks.length > 0 && (
              <div className="mb-4">
                <h3 className="text-red-400 font-semibold mb-3">🔴 Overdue</h3>
                <div className="space-y-2">{overdueTasks.map(t => <TaskCard key={t.id} task={t} />)}</div>
              </div>
            )}
            {todayTasks.length > 0 && (
              <div className="mb-4">
                <h3 className="text-amber-400 font-semibold mb-3">⚡ Due Today</h3>
                <div className="space-y-2">{todayTasks.map(t => <TaskCard key={t.id} task={t} />)}</div>
              </div>
            )}
            <div>
              <h3 className="text-gray-400 font-semibold mb-3">📅 Upcoming</h3>
              <div className="space-y-2">
                {pendingTasks.filter(t => {
                  const d = new Date(t.deadlineDate); d.setHours(0, 0, 0, 0);
                  return d.getTime() > today.getTime();
                }).slice(0, 5).map(t => <TaskCard key={t.id} task={t} />)}
              </div>
            </div>
          </div>
        )}

        {/* ALL TASKS */}
        {activeView === 'tasks' && (
          <div className="space-y-2">
            {filteredTasks(tasks.filter(t => t.status !== 'COMPLETED')).length === 0
              ? <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-4">📋</div><div>No tasks found!</div></div>
              : filteredTasks(tasks.filter(t => t.status !== 'COMPLETED')).map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {/* OVERDUE */}
        {activeView === 'overdue' && (
          <div className="space-y-2">
            {filteredTasks(overdueTasks).length === 0
              ? <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-4">🎉</div><div>No overdue tasks!</div></div>
              : filteredTasks(overdueTasks).map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {/* TODAY */}
        {activeView === 'today' && (
          <div className="space-y-2">
            {filteredTasks(todayTasks).length === 0
              ? <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-4">✅</div><div>No tasks due today!</div></div>
              : filteredTasks(todayTasks).map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {/* COMPLETED */}
        {activeView === 'completed' && (
          <div className="space-y-2">
            {filteredTasks(completedTasks).length === 0
              ? <div className="text-center py-20 text-gray-500"><div className="text-5xl mb-4">📋</div><div>No completed tasks yet!</div></div>
              : filteredTasks(completedTasks).map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {/* KANBAN */}
        {activeView === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {kanbanCols.map(col => (
              <div key={col.key} className="bg-[#111118] border border-white/10 rounded-xl p-4">
                <div className={`font-semibold text-sm mb-4 flex items-center justify-between ${col.color}`}>
                  {col.label}
                  <span className="bg-white/10 text-gray-400 text-xs px-2 py-0.5 rounded-full">{col.tasks.length}</span>
                </div>
                <div className="space-y-2">
                  {col.tasks.map(task => (
                    <div key={task.id} onClick={() => openEditModal(task)}
                      className="bg-[#1c1c28] border border-white/10 rounded-lg p-3 cursor-pointer hover:border-purple-500/30 transition">
                      <div className="text-sm font-medium text-white mb-2">{task.title}</div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                        <span className="text-xs text-gray-500">{getDaysLeft(task.deadlineDate)}</span>
                      </div>
                    </div>
                  ))}
                  {col.tasks.length === 0 && <div className="text-gray-600 text-xs text-center py-4">No tasks</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CALENDAR */}
        {activeView === 'calendar' && (
          <div className="bg-[#111118] border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-bold mb-4">{monthName}</h3>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="text-center text-xs text-gray-500 font-medium py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = tasks.filter(t => t.deadlineDate.startsWith(dateStr));
                const isToday = day === now.getDate();
                return (
                  <div key={day} className={`min-h-12 p-1 rounded-lg border ${isToday ? 'border-purple-500 bg-purple-500/10' : 'border-white/5 bg-[#1c1c28]'}`}>
                    <div className={`text-xs font-bold mb-1 ${isToday ? 'text-purple-400' : 'text-gray-400'}`}>{day}</div>
                    {dayTasks.slice(0, 1).map(t => (
                      <div key={t.id} onClick={() => openEditModal(t)}
                        className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${
                          t.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                          t.status === 'OVERDUE' ? 'bg-red-500/20 text-red-400' : 'bg-purple-500/20 text-purple-400'
                        }`}>
                        {t.title}
                      </div>
                    ))}
                    {dayTasks.length > 1 && <div className="text-xs text-gray-600">+{dayTasks.length - 1}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAV - Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#111118] border-t border-white/10 flex md:hidden z-40">
        {[
          { key: 'dashboard', icon: '⬛', label: 'Home' },
          { key: 'tasks', icon: '✓', label: 'Tasks' },
          { key: 'overdue', icon: '🔴', label: 'Overdue' },
          { key: 'kanban', icon: '▦', label: 'Kanban' },
          { key: 'calendar', icon: '📅', label: 'Cal' },
        ].map(item => (
          <button key={item.key} onClick={() => setActiveView(item.key)}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs transition ${activeView === item.key ? 'text-purple-400' : 'text-gray-500'}`}>
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* ADD MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">New Task</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Title *</label>
                <input type="text" placeholder="Task title" value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Description</label>
                <textarea placeholder="Add notes..." value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Deadline *</label>
                  <input type="date" value={newTask.deadlineDate}
                    onChange={e => setNewTask({ ...newTask, deadlineDate: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Category</label>
                  <input type="text" placeholder="Work, Study..." value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Recurring</label>
                  <select value={newTask.recurring} onChange={e => setNewTask({ ...newTask, recurring: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="NONE">None</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition">
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-[#111118] border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Task</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={updateTask} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Title *</label>
                <input type="text" value={editForm.title}
                  onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" required />
              </div>
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Description</label>
                <textarea value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 h-20 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Priority</label>
                  <select value={editForm.priority} onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Deadline *</label>
                  <input type="date" value={editForm.deadlineDate}
                    onChange={e => setEditForm({ ...editForm, deadlineDate: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm mb-1 block">Category</label>
                  <input type="text" value={editForm.category}
                    onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full bg-[#1c1c28] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500" />
                </div>
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-semibold transition">
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}