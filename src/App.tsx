/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Users, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Boxes as LayoutGrid, 
  Search, 
  Bell, 
  Settings,
  ChevronRight,
  MoreVertical,
  Plus,
  LayoutDashboard,
  Film,
  User as UserIcon,
  Layers,
  ArrowRightCircle,
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isPast, isToday } from 'date-fns';
import { cn } from './lib/utils';

// --- Types ---

type Priority = '高' | '中' | '低';
type TaskStatus = '待处理' | '进行中' | '已完成';

interface Task {
  id: string;
  name: string;
  assignee: {
    name: string;
    avatar: string;
  };
  status: TaskStatus;
  priority: Priority;
  deadline: string;
  description: string;
  phase: string;
}

// --- Mock Data ---

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    name: '主角高模雕刻',
    assignee: { name: '陈晓东', avatar: 'https://i.pravatar.cc/150?u=alex' },
    status: '进行中',
    priority: '高',
    deadline: '2026-05-07T18:00:00Z', // Overdue
    description: '完成主角面部肌肉结构和表情融合变形细节雕刻。',
    phase: '角色制作'
  },
  {
    id: 'task-2',
    name: '次要角色拓扑优化',
    assignee: { name: '张子明', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    status: '待处理',
    priority: '中',
    deadline: '2026-05-08T17:00:00Z', // Today
    description: '在保留剪影细节的同时，为动画优化网格结构。',
    phase: '角色制作'
  },
  {
    id: 'task-3',
    name: '反派角色-UV拆分',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '进行中',
    priority: '高',
    deadline: '2026-05-08T20:00:00Z', // Today
    description: '为8K纹理绘制创建无重叠的UV布局。',
    phase: '角色制作'
  },
  {
    id: 'task-4',
    name: '毛发理算仿真测试',
    assignee: { name: '王小云', avatar: 'https://i.pravatar.cc/150?u=emily' },
    status: '进行中',
    priority: '低',
    deadline: '2026-05-08T16:00:00Z', // Today
    description: '使用XGen测试步行循环中的动态毛发物理效果。',
    phase: '角色制作'
  },
  {
    id: 'task-5',
    name: '主角模型贴图烘培',
    assignee: { name: '张子明', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    status: '已完成',
    priority: '中',
    deadline: '2026-05-08T10:00:00Z',
    description: '烘培法线、AO和曲率贴图。',
    phase: '角色制作'
  }
];

// --- Components ---

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | '高' | '中' | '低';
  key?: React.Key;
}

const Badge = ({ children, variant = 'default' }: BadgeProps) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300',
    '高': 'bg-red-500/10 text-red-400 border border-red-500/20',
    '中': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    '低': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider", variants[variant])}>
      {children}
    </span>
  );
};

interface TaskCardProps {
  task: Task;
  index: number;
  key?: React.Key;
}

const TaskCard = ({ task, index }: TaskCardProps) => {
  const isOverdue = isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline)) && task.status !== '已完成';
  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group relative p-4 mb-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-200 shadow-lg",
            isOverdue ? "border-l-4 border-l-red-500" : "border-l-4 border-l-indigo-500",
            snapshot.isDragging && "shadow-2xl shadow-indigo-500/20 border-indigo-500/50 bg-slate-800 scale-[1.02] z-50",
            task.status === '已完成' && "opacity-50 grayscale-[0.5] border-l-emerald-500"
          )}
        >
          <div className="flex justify-between mb-2">
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono italic">
              {task.id.split('-')[1].toUpperCase()}
            </span>
            <span className={cn(
              "text-[10px] font-mono",
              isOverdue ? "text-red-400" : "text-slate-400"
            )}>
              {isToday(new Date(task.deadline)) ? "今日" : "昨日"} {format(new Date(task.deadline), 'HH:mm')}
            </span>
          </div>
          
          <h4 className="text-sm font-bold text-slate-100 mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
            {task.name}
          </h4>
          <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {task.description}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-slate-800 flex items-center justify-center overflow-hidden">
                <img src={task.assignee.avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{task.assignee.name}</span>
            </div>
            <Badge variant={task.priority as any}>{task.priority}</Badge>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [isReady, setIsReady] = useState(false);

  // Fix for React Beautiful Dnd strict mode
  useEffect(() => {
    setIsReady(true);
  }, []);

  const overdueTasks = tasks.filter(t => 
    isPast(new Date(t.deadline)) && 
    !isToday(new Date(t.deadline)) && 
    t.status !== '已完成'
  );
  
  const todayTasks = tasks.filter(t => 
    (isToday(new Date(t.deadline)) || !isPast(new Date(t.deadline))) && 
    t.status !== '已完成'
  );
  
  const completedTasks = tasks.filter(t => t.status === '已完成');

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Logic: Drag into "completed-zone"
    if (destination.droppableId === 'completed-zone') {
      setTasks(prev => prev.map(t => 
        t.id === draggableId ? { ...t, status: '已完成' as const } : t
      ));
      return;
    }

    // Traditional reordering logic could go here if needed, 
    // but the prompt emphasized the "Complete" workflow
  }, []);

  if (!isReady) return null;

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            <Film size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none text-slate-100 uppercase tracking-tight">角色制作环节</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">生产自检与资产交付工作台 (Production Workbench)</p>
          </div>
        </div>

        {/* Migrated Overview Info */}
        <div className="hidden lg:flex items-center gap-8 pl-8 ml-8 border-l border-slate-800">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">当前阶段</span>
            <span className="text-xs font-bold text-slate-200">角色制作环节</span>
          </div>
          <div className="flex flex-col min-w-[120px]">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">总进度</span>
                <span className="text-[10px] font-mono text-indigo-400">68%</span>
             </div>
             <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[68%] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]" />
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">延期</p>
                <p className="text-xs font-mono font-bold text-red-500">{overdueTasks.length}</p>
             </div>
             <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">已清</p>
                <p className="text-xs font-mono font-bold text-emerald-500">{completedTasks.length}</p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6 ml-auto">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">工作节点</p>
            <p className="text-xs font-medium text-indigo-400">ASSET-SVR-CHARACTER-PROD</p>
          </div>
          <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Overdue Bento Column */}
          <section className="col-span-4 bg-slate-900/30 rounded-2xl border border-dashed border-red-900/30 flex flex-col overflow-hidden group hover:bg-red-500/[0.02] transition-colors">
            <div className="p-4 border-b border-red-900/20 bg-red-950/20 flex justify-between items-center">
              <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                <History size={14} />
                逾期任务
              </h2>
              <span className="px-2 py-0.5 bg-red-900 text-red-200 text-[10px] rounded-full font-bold">{overdueTasks.length}</span>
            </div>
            
            <Droppable droppableId="overdue">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-all duration-300",
                    snapshot.isDraggingOver && "bg-red-500/[0.05]"
                  )}
                >
                  {overdueTasks.map((task, idx) => (
                    <TaskCard key={task.id} task={task} index={idx} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>

          {/* Today Bento Column */}
          <section className="col-span-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
              <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} />
                今日待办
              </h2>
              <span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-200 text-[10px] rounded-full font-bold">{todayTasks.length}</span>
            </div>
            
            <Droppable droppableId="today">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar transition-all duration-300",
                    snapshot.isDraggingOver && "bg-indigo-500/[0.02]"
                  )}
                >
                  {todayTasks.length > 0 ? (
                    todayTasks.map((task, idx) => (
                      <TaskCard key={task.id} task={task} index={idx} />
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                      <LayoutGrid size={48} strokeWidth={1} />
                      <p className="mt-2 text-xs font-bold uppercase">今日暂无更多任务</p>
                    </div>
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>

          {/* Done Bento Column / Drop Zone */}
          <section className="col-span-4 bg-slate-900/30 rounded-2xl border border-dashed border-emerald-900/20 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-emerald-900/10 bg-emerald-500/5 flex justify-between items-center">
              <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14} />
                今日已清
              </h2>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] rounded-full font-bold">{completedTasks.length}</span>
            </div>
            
            <Droppable droppableId="completed-zone">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "flex-1 p-3 space-y-3 relative overflow-hidden transition-all duration-300",
                    snapshot.isDraggingOver ? "bg-emerald-500/10 border-emerald-500/50 h-full" : "bg-transparent"
                  )}
                >
                  {/* Drop Overlay */}
                  <AnimatePresence>
                    {snapshot.isDraggingOver && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-500/10 backdrop-blur-[2px]"
                      >
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                        >
                          <ArrowRightCircle size={48} className="text-emerald-500" />
                        </motion.div>
                        <p className="text-emerald-400 font-bold mt-4 animate-pulse">归档任务</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3 overflow-y-auto h-full custom-scrollbar pr-1">
                    {completedTasks.map((task) => (
                      <div key={task.id} className="group bg-slate-950/80 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-3 transition-all hover:bg-slate-900">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                          <CheckCircle2 size={12} strokeWidth={3} className="text-slate-950" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[12px] font-bold text-slate-400 line-through truncate">{task.name}</h4>
                          <span className="text-[9px] text-emerald-600 font-mono mt-1 block uppercase font-bold tracking-tighter">审核于 {format(new Date(task.deadline), 'HH:mm')}</span>
                        </div>
                      </div>
                    ))}
                    
                    {completedTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="h-full flex flex-col items-center justify-center text-emerald-900/40 text-center px-6">
                        <ArrowRightCircle size={32} strokeWidth={1} className="mb-2" />
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-2 leading-relaxed">
                          拖拽任务至此以完成生产产出
                        </p>
                      </div>
                    )}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </section>
        </DragDropContext>
      </main>

      {/* Footer Bar */}
      <footer className="h-10 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span>系统状态: 正常运行</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <LayoutDashboard size={10} />
            <span>节点: ASSET-SVR-CHARACTER-PROD</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono">
             <Calendar size={10} />
             <span>2026.05.08</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded text-indigo-400 font-mono">
             <Clock size={10} />
             <span>{format(new Date(), 'HH:mm:ss')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Helper Components ---

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
      active 
        ? "bg-indigo-600/10 text-indigo-400 border border-indigo-600/20" 
        : "text-slate-500 hover:text-slate-300 hover:bg-neutral-900"
    )}>
      <span className={cn("transition-colors", active ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400")}>
        {icon}
      </span>
      {label}
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto w-1 h-4 bg-indigo-500 rounded-full"
        />
      )}
    </button>
  );
}
