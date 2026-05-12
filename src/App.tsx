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
  History,
  Target,
  Columns,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isPast, isToday, addDays, differenceInCalendarDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from './lib/utils';
import { PipelineConfig } from './components/PipelineConfig';

// --- Types ---

type Priority = '高' | '中' | '低';
type TaskStatus = '待处理' | '进行中' | '已完成' | '审批中';
type ViewMode = 'Kanban' | 'Gantt' | 'Swimlane';
type SwimlaneGrouping = 'Phase' | 'Assignee';

type MainTaskStatus = '进行中' | '已完成';

interface MainTask {
  id: string;
  name: string;
  status: MainTaskStatus;
}

const INITIAL_MAIN_TASKS: MainTask[] = [
  { id: 'mt-1', name: '主角交互特效', status: '进行中' },
  { id: 'mt-2', name: '全场景材质映射', status: '进行中' },
];

interface Task {
  id: string;
  mainTaskId?: string;
  isMainTaskStub?: boolean;
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
  startDate: string;
}

// --- Mock Data ---

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    mainTaskId: 'mt-1',
    name: '主角雕刻 - 面部表情细节 (Day 1)',
    assignee: { name: '陈晓东', avatar: 'https://i.pravatar.cc/150?u=alex' },
    status: '进行中',
    priority: '高',
    startDate: '2026-05-06T09:00:00Z',
    deadline: '2026-05-07T18:00:00Z',
    description: '子任务：完成嘴角与眼角皱纹的高模细节。需支持后续表情融合。',
    phase: '模型雕刻'
  },
  {
    id: 'task-6',
    mainTaskId: 'mt-2',
    name: '反派拓扑 - 关节区域重布线',
    assignee: { name: '张子明', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    status: '进行中',
    priority: '高',
    startDate: '2026-05-06T10:00:00Z',
    deadline: '2026-05-07T14:00:00Z',
    description: '子任务：修复膝关节处极点布线，确保形变伸缩比。',
    phase: '拓扑优化'
  },
  {
    id: 'task-7',
    name: '资产自检 - 命名审计',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '待处理',
    priority: '低',
    startDate: '2026-05-07T08:00:00Z',
    deadline: '2026-05-07T10:00:00Z',
    description: '子任务：核对所有UDIM象限命名规范。',
    phase: '资产发布'
  },
  {
    id: 'task-2',
    name: '次要角色拓扑 - 肢体优化',
    assignee: { name: '张子明', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    status: '待处理',
    priority: '中',
    startDate: '2026-05-07T14:00:00Z',
    deadline: '2026-05-08T17:00:00Z',
    description: '子任务：优化网格结构以减少动画渲染开销。',
    phase: '拓扑优化'
  },
  {
    id: 'task-3',
    name: '反派UV - UDIM象限展开',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '进行中',
    priority: '高',
    startDate: '2026-05-08T09:00:00Z',
    deadline: '2026-05-08T20:00:00Z',
    description: '子任务：展开前2个UV象限，满足8K绘制精度。',
    phase: 'UV展开'
  },
  {
    id: 'task-4',
    name: '毛发理算 - 物理动力学调优',
    assignee: { name: '王小云', avatar: 'https://i.pravatar.cc/150?u=emily' },
    status: '进行中',
    priority: '低',
    startDate: '2026-05-08T08:00:00Z',
    deadline: '2026-05-08T16:00:00Z',
    description: '子任务：优化步行模式下的长发遮蔽与碰撞。',
    phase: '毛发制作'
  },
  {
    id: 'task-8',
    name: '道具B贴图 - 基础纹理层',
    assignee: { name: '陈晓东', avatar: 'https://i.pravatar.cc/150?u=alex' },
    status: '待处理',
    priority: '高',
    startDate: '2026-05-08T13:00:00Z',
    deadline: '2026-05-08T22:00:00Z',
    description: '子任务：建立Substance智能材质球基础属性。',
    phase: '材质绘制'
  },
  {
    id: 'task-5',
    name: '主角贴图 - 法线烘培校对',
    assignee: { name: '张子明', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    status: '已完成',
    priority: '中',
    startDate: '2026-05-08T08:00:00Z',
    deadline: '2026-05-08T10:00:00Z',
    description: '子任务：烘培法线贴图并核对黑边与硬边。',
    phase: '材质绘制'
  },
  {
    id: 'task-9',
    name: '资产打包 - 版本提交 0.2',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '已完成',
    priority: '低',
    startDate: '2026-05-07T16:00:00Z',
    deadline: '2026-05-08T09:00:00Z',
    description: '子任务：打包角色资产并上传至Shotgrid预览节点。',
    phase: '资产发布'
  },
  {
    id: 'task-main-stub-1',
    name: '新资产开发任务',
    isMainTaskStub: true,
    assignee: { name: '规划组', avatar: 'https://i.pravatar.cc/150?u=planning' },
    status: '待处理',
    priority: '中',
    startDate: '2026-05-15T09:00:00Z',
    deadline: '2026-05-30T18:00:00Z',
    description: '这是一个新的主任务，尚未拆解。',
    phase: '待拆解'
  }
];

// --- Components ---

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | '高' | '中' | '低';
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
  mainTask?: MainTask;
}

const TaskItem = ({ task, isOverdue, mainTask }: { task: Task, isOverdue: boolean, mainTask?: MainTask }) => (
  <>
    <div className="flex justify-between mb-2">
      {task.isMainTaskStub ? (
        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold italic bg-red-500/10 text-red-500">
          <AlertTriangle size={10} /> 未拆解
        </span>
      ) : mainTask ? (
        <span className="text-[10px] px-2 py-0.5 rounded font-bold italic bg-indigo-500/10 text-indigo-400">
          {mainTask.name}
        </span>
      ) : null}
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
  </>
);

const TaskCard: React.FC<TaskCardProps> = ({ task, index, mainTask }) => {
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
          <TaskItem task={task} isOverdue={isOverdue} mainTask={mainTask} />
        </div>
      )}
    </Draggable>
  );
};

const MainTaskCard: React.FC<{ 
  task: Task, 
  index: number, 
  allTasks: Task[], 
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>,
  openSplitTaskModal: (task: Task) => void 
}> = ({ task, index, allTasks, setTasks, openSplitTaskModal }) => {
  const subtasks = allTasks.filter(t => t.mainTaskId === task.id);
  const isSplit = subtasks.length > 0;
  const allCompleted = isSplit && subtasks.every(t => t.status === '已完成');

  const handleCompleteMainTask = () => {
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: '已完成' as const } : t
    ));
  };

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group p-4 rounded-xl border transition-all cursor-pointer",
            isSplit ? "bg-slate-800/40 border-slate-700/50" : "bg-red-950/20 border-red-900/30",
            snapshot.isDragging && "shadow-2xl shadow-indigo-500/20 border-indigo-500/50 bg-slate-800 scale-[1.02]"
          )}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className={cn("text-sm font-bold line-clamp-1 uppercase tracking-tight", isSplit ? "text-slate-100" : "text-red-100")}>{task.name}</h4>
            {isSplit && <span className="text-[10px] text-slate-400">{subtasks.filter(t => t.status === '已完成').length}/{subtasks.length} 子任务完成</span>}
          </div>
          <p className={cn("text-[11px] line-clamp-2 mb-4", isSplit ? "text-slate-400" : "text-red-500/70")}>{task.description}</p>
          
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-slate-500 font-medium">截止: {format(new Date(task.deadline), 'MM-dd')}</div>
            
            {!isSplit && (
                <button 
                  onClick={(e) => { e.stopPropagation(); openSplitTaskModal(task); }}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  快速拆解
                </button>
            )}

            {isSplit && allCompleted && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCompleteMainTask(); }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold transition-colors"
                >
                  完成主任务
                </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};

const SwimlaneView = ({ tasks, grouping }: { tasks: Task[], grouping: SwimlaneGrouping }) => {
  const groups = tasks.reduce((acc, task) => {
    const key = grouping === 'Phase' ? task.phase : task.assignee.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  return (
    <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
      {Object.entries(groups).map(([key, groupTasks]) => (
        <section key={key} className="w-80 flex-shrink-0 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              {key}
            </h2>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded-full font-bold">{groupTasks.length}</span>
          </div>
          
          <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
            {groupTasks.map(task => (
              <div key={task.id} className="group relative p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-all">
                <TaskItem task={task} isOverdue={isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline)) && task.status !== '已完成'} />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

const GanttView = ({ tasks }: { tasks: Task[] }) => {
  const startDate = new Date('2026-05-04T00:00:00Z');
  const daysInView = 7;
  const dates = Array.from({ length: daysInView }, (_, i) => addDays(startDate, i));
  
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm bg-opacity-80">
      <div className="flex border-b border-slate-800 bg-slate-950/40">
        <div className="w-64 p-4 border-r border-slate-800 font-bold text-[10px] uppercase tracking-widest text-slate-500 bg-slate-950/20">
          每日生产安排 / 子任务
        </div>
        {dates.map((date, i) => (
          <div key={i} className={cn(
            "flex-1 p-3 text-center border-r border-slate-800 last:border-0",
            isToday(date) && "bg-indigo-500/10"
          )}>
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{format(date, 'EEEE', { locale: zhCN })}</p>
            <p className={cn("text-xs font-mono font-bold mt-1", isToday(date) ? "text-indigo-400" : "text-slate-300")}>{format(date, 'MM月dd日')}</p>
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/30">
        {tasks.length > 0 ? tasks.map(task => {
          const start = new Date(task.startDate);
          const end = new Date(task.deadline);
          
          const diffDays = differenceInCalendarDays(start, startDate);
          const durationDays = differenceInCalendarDays(end, start) + 1;
          
          const displayStart = Math.max(0, diffDays);
          const displayEnd = Math.min(daysInView, diffDays + durationDays);
          const displayDuration = Math.max(0.5, displayEnd - displayStart);
          
          const leftPercent = (displayStart / daysInView) * 100;
          const widthPercent = (displayDuration / daysInView) * 100;

          const isOut = (diffDays + durationDays <= 0) || (diffDays >= daysInView);

          if (isOut) return null;

          return (
            <div key={task.id} className="flex border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors group">
              <div className="w-64 p-4 border-r border-slate-800 flex items-center gap-3 shrink-0 bg-slate-900/20">
                <img src={task.assignee.avatar} className="w-7 h-7 rounded-full border-2 border-slate-800 shadow-md" alt="" />
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-200 truncate leading-tight tracking-tight">{task.name}</p>
                  <p className="text-[9px] text-slate-500 font-bold tracking-tight mt-1 uppercase opacity-70">{task.assignee.name} · {task.phase}</p>
                </div>
              </div>
              <div className="flex-1 relative h-16 flex items-center">
                <div className="absolute inset-0 flex pointer-events-none">
                   {dates.map((_, i) => <div key={i} className="flex-1 border-r border-slate-800/10 last:border-0" />)}
                </div>

                {dates.map((date, i) => isToday(date) && (
                   <div key={i} className="absolute inset-y-0 bg-indigo-500/[0.03] pointer-events-none" style={{ left: `${(i / daysInView) * 100}%`, width: `${100 / daysInView}%` }} />
                ))}
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.01 }}
                  className={cn(
                    "relative h-9 rounded-xl shadow-xl flex items-center px-4 z-10 border overflow-hidden",
                    task.status === '已完成' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                    isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline)) ? "bg-red-500/20 border-red-500/30 text-red-300" :
                    task.priority === '高' ? "bg-indigo-600 border-indigo-400/50 text-white shadow-indigo-600/20 shadow-lg" :
                    "bg-slate-800 border-slate-700 text-slate-300"
                  )}
                  style={{ 
                    left: `${leftPercent}%`, 
                    width: `${Math.min(100 - leftPercent, widthPercent)}%`,
                    minWidth: '60px'
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold uppercase tracking-widest truncate">{task.status}</span>
                  {task.status === '已完成' && <CheckCircle2 size={12} className="ml-auto shrink-0" />}
                </motion.div>
              </div>
            </div>
          );
        }) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600">
             <Target size={40} className="mb-2 opacity-20" />
             <p className="text-xs font-bold uppercase tracking-widest">在该筛选条件下无任务安排</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [mainTasks, setMainTasks] = useState<MainTask[]>(INITIAL_MAIN_TASKS);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stubModalTask, setStubModalTask] = useState<Task | null>(null);
  const [splitConfig, setSplitConfig] = useState({
    numSubtasks: 1,
    subtasks: [{ name: '', description: '', assignee: '', date: format(new Date(), 'yyyy-MM-dd') }]
  });
  
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'All'>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string | 'All'>('All');
  const [phaseFilter, setPhaseFilter] = useState<string | 'All'>('All');
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('Kanban');
  const [swimlaneGrouping, setSwimlaneGrouping] = useState<SwimlaneGrouping>('Phase');
  const [showConfig, setShowConfig] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isPendingSplitExpanded, setIsPendingSplitExpanded] = useState(false);

  const openSplitTaskModal = (task: Task) => {
    let subtasks = [{ name: `${task.name}-子任务1`, description: task.description, assignee: task.assignee.name, date: format(new Date(), 'yyyy-MM-dd') }];
    let numSubtasks = 1;

    if (task.name.includes('资产模型') || task.description.includes('资产模型')) {
        subtasks = [
            { name: "AI生成多图", description: "根据概念设计生成多视角参考图", assignee: task.assignee.name, date: format(new Date(), 'yyyy-MM-dd') },
            { name: "AI生成全身高模", description: "使用多视角图生成高精度3D模型", assignee: task.assignee.name, date: format(new Date(), 'yyyy-MM-dd') },
            { name: "修复纹理", description: "修复模型表面的UV和纹理细节", assignee: task.assignee.name, date: format(new Date(), 'yyyy-MM-dd') }
        ];
        numSubtasks = 3;
    }

    setSplitConfig({
        numSubtasks,
        subtasks
    });
    setStubModalTask(task);
  }

  const pendingSplitTasks = tasks.filter(t => !t.mainTaskId);

  const handleCreateSubtask = () => {
    if (!stubModalTask) return;
    
    const newSubtasks: Task[] = splitConfig.subtasks.map((st, idx) => ({
        id: `task-${Date.now()}-${Math.random()}`,
        mainTaskId: stubModalTask.id,
        name: st.name,
        description: st.description,
        assignee: { name: st.assignee, avatar: 'https://i.pravatar.cc/150?u=new' },
        status: idx === 0 ? '进行中' : '待处理',
        priority: '中',
        startDate: st.date,
        deadline: `${st.date}T18:00:00Z`,
        phase: '制作中'
    }));
    
    setTasks(prev => [
      ...prev.filter(t => t.id !== stubModalTask.id), // Remove the stub
      ...newSubtasks
    ]);
    setStubModalTask(null);
  };

  // Fix for React Beautiful Dnd strict mode
  useEffect(() => {
    setIsReady(true);
  }, []);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'All' || t.assignee.name === assigneeFilter;
    const matchesPhase = phaseFilter === 'All' || t.phase === phaseFilter;
    const matchesCompleted = showCompleted || t.status !== '已完成';
    return matchesSearch && matchesPriority && matchesAssignee && matchesPhase && matchesCompleted;
  });

  const assignees = Array.from(new Set(INITIAL_TASKS.map(t => t.assignee.name)));
  const phases = Array.from(new Set(INITIAL_TASKS.map(t => t.phase)));

  const overdueTasks = filteredTasks.filter(t => 
    isPast(new Date(t.deadline)) && 
    !isToday(new Date(t.deadline)) && 
    t.status !== '已完成' &&
    t.status !== '审批中'
  );
  
  const todoTasks = filteredTasks.filter(t => t.status === '待处理');
  const inProgressTasks = filteredTasks.filter(t => t.status === '进行中');
  const inApprovalTasks = filteredTasks.filter(t => t.status === '审批中');
  const completedTasks = filteredTasks.filter(t => t.status === '已完成');

  const sortedTodoTasks = [...todoTasks].sort((a, b) => (a.mainTaskId || '').localeCompare(b.mainTaskId || ''));
  const sortedInProgressTasks = [...inProgressTasks].sort((a, b) => (a.mainTaskId || '').localeCompare(b.mainTaskId || ''));
  const sortedInApprovalTasks = [...inApprovalTasks].sort((a, b) => (a.mainTaskId || '').localeCompare(b.mainTaskId || ''));

  const overallProgress = (tasks.filter(t => t.status === '已完成').length / tasks.length) * 100;

  const groupTasksByMainTask = (ts: Task[]) => {
    const groups: Record<string, { mainTask: MainTask | undefined, tasks: Task[] }> = {};
    
    ts.forEach(task => {
      const mtId = task.mainTaskId || 'uncategorized';
      if (!groups[mtId]) {
        groups[mtId] = {
          mainTask: mainTasks.find(mt => mt.id === mtId),
          tasks: []
        };
      }
      groups[mtId].tasks.push(task);
    });
    
    return groups;
  };

  const onDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    
    // Find task from current state
    const draggedTask = tasks.find(t => t.id === draggableId);

    // Logic: Drag to status zones
    if (destination.droppableId === 'completed-zone') {
      setTasks(prev => prev.map(t => 
        t.id === draggableId ? { ...t, status: '已完成' as const } : t
      ));
    } else if (destination.droppableId === 'in-progress-zone') {
      if (draggedTask?.isMainTaskStub) {
        openSplitTaskModal(draggedTask);
        return;
      }
      setTasks(prev => prev.map(t => 
        t.id === draggableId ? { ...t, status: '进行中' as const } : t
      ));
    } else if (destination.droppableId === 'approval-zone') {
      setTasks(prev => prev.map(t => 
        t.id === draggableId ? { ...t, status: '审批中' as const } : t
      ));
    } else if (destination.droppableId === 'today') {
        setTasks(prev => prev.map(t => 
        t.id === draggableId ? { ...t, status: '待处理' as const } : t
      ));
    }
  }, [tasks]);

  if (!isReady) return null;

  return (
    <div className="w-full h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      {stubModalTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
             <h2 className="text-xl font-bold text-white mb-4">拆解主任务: {stubModalTask.name}</h2>
             
             <div className="mb-4">
               <label className="text-xs text-slate-400">拆解为几个子任务 (1-10)</label>
               <input 
                 type="number" 
                 min="1" 
                 max="10" 
                 className="w-full bg-slate-950 border border-slate-700 p-3 rounded-xl text-white" 
                 value={splitConfig.numSubtasks} 
                 onChange={e => {
                     const val = parseInt(e.target.value);
                     const numSubtasks = Math.min(10, Math.max(1, val || 1));
                     const newSubtasks = [...splitConfig.subtasks];
                     while(newSubtasks.length < numSubtasks) {
                         newSubtasks.push({ name: `${stubModalTask.name}-子任务${newSubtasks.length + 1}`, description: stubModalTask.description, assignee: stubModalTask.assignee.name, date: format(new Date(), 'yyyy-MM-dd') });
                     }
                     if (newSubtasks.length > numSubtasks) {
                         newSubtasks.splice(numSubtasks);
                     }
                     setSplitConfig({ numSubtasks, subtasks: newSubtasks });
                 }} 
               />
             </div>
             
             <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {splitConfig.subtasks.map((st, i) => (
                    <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                        <input type="text" placeholder="子任务名称" className="w-full bg-slate-900 border border-slate-700 p-2 rounded mb-2 text-sm text-white" value={st.name} onChange={e => {                
                            const newSubtasks = [...splitConfig.subtasks];
                            newSubtasks[i].name = e.target.value;                
                            setSplitConfig({ ...splitConfig, subtasks: newSubtasks });
                        }} />
                        <input type="text" placeholder="描述" className="w-full bg-slate-900 border border-slate-700 p-2 rounded mb-2 text-sm text-white" value={st.description} onChange={e => {
                            const newSubtasks = [...splitConfig.subtasks];
                            newSubtasks[i].description = e.target.value;                
                            setSplitConfig({ ...splitConfig, subtasks: newSubtasks });
                        }} />
                        <div className="flex gap-2">
                             <input type="text" placeholder="责任人" className="w-1/2 bg-slate-900 border border-slate-700 p-2 rounded text-sm text-white" value={st.assignee} onChange={e => {
                                const newSubtasks = [...splitConfig.subtasks];
                                newSubtasks[i].assignee = e.target.value;                
                                setSplitConfig({ ...splitConfig, subtasks: newSubtasks });
                             }} />
                             <input type="date" className="w-1/2 bg-slate-900 border border-slate-700 p-2 rounded text-sm text-white" value={st.date} onChange={e => {
                                const newSubtasks = [...splitConfig.subtasks];
                                newSubtasks[i].date = e.target.value;                
                                setSplitConfig({ ...splitConfig, subtasks: newSubtasks });
                             }} />
                        </div>
                    </div>
                ))}
             </div>

             <div className="flex gap-4 mt-4">
               <button className="flex-1 px-4 py-2 bg-slate-700 rounded-xl" onClick={() => setStubModalTask(null)}>取消</button>
               <button className="flex-1 px-4 py-2 bg-indigo-600 rounded-xl" onClick={handleCreateSubtask}>拆解并创建</button>
             </div>
          </div>
        </div>
      )}
      {showConfig && <PipelineConfig onClose={() => setShowConfig(false)} />}
      {/* Header */}
      <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            <Film size={20} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold leading-none text-slate-100 uppercase tracking-tight">角色制作环节</h1>
              <button 
                onClick={() => setShowConfig(true)}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700 flex items-center gap-1 transition-all"
              >
                <Settings size={10} />
                环节步骤设置
              </button>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">生产自检与资产交付工作台 (Production Workbench)</p>
          </div>
        </div>

        {/* Migrated Overview Info */}
        <div className="hidden lg:flex items-center gap-8 pl-8 ml-8 border-l border-slate-800">
           <div className="flex bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
              {(['Kanban', 'Gantt', 'Swimlane'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-widest",
                    viewMode === mode ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-500 hover:text-slate-400"
                  )}
                >
                  {mode === 'Kanban' ? <LayoutGrid size={12} /> : mode === 'Gantt' ? <Calendar size={12} /> : <Columns size={12} />}
                  {mode === 'Kanban' ? '看板管理' : mode === 'Gantt' ? '环节甘特图' : '泳道视图'}
                </button>
              ))}
           </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">当日任务进度</span>
            <span className="text-xs font-bold text-slate-200">角色制作进度跟踪</span>
          </div>
          <div className="flex flex-col min-w-[120px]">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">总进度</span>
                <span className="text-[10px] font-mono text-indigo-400">{Math.round(overallProgress)}%</span>
             </div>
             <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)] transition-all duration-500" 
                  style={{ width: `${overallProgress}%` }}
                />
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">延期</p>
                <p className="text-xs font-mono font-bold text-red-500">{tasks.filter(t => isPast(new Date(t.deadline)) && !isToday(new Date(t.deadline)) && t.status !== '已完成').length}</p>
             </div>
             <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">已清</p>
                <p className="text-xs font-mono font-bold text-emerald-500">{tasks.filter(t => t.status === '已完成').length}</p>
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
        {/* Minimal Filter Bar */}
        <div className="flex items-center justify-between shrink-0 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索子任务或资产序号..." 
                className="bg-slate-950 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs w-64 focus:outline-none focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button
               onClick={() => setFilterMenuOpen(!filterMenuOpen)}
               className={cn(
                 "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                 filterMenuOpen ? "bg-indigo-600 text-white" : "bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
               )}
            >
               筛选
            </button>

            {filterMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl z-50">
                 <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">完成状态</label>
                      <button 
                        onClick={() => setShowCompleted(!showCompleted)}
                        className={cn("w-full px-3 py-2 rounded-xl text-xs", showCompleted ? "bg-indigo-900 text-indigo-200" : "bg-slate-950 text-slate-400")}
                      >
                        {showCompleted ? "隐藏已完成" : "显示已完成"}
                      </button>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">筛选步骤</label>
                      <select 
                        value={phaseFilter}
                        onChange={(e) => setPhaseFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300"
                      >
                        <option value="All">全部步骤</option>
                        {phases.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">筛选人员</label>
                      <select 
                        value={assigneeFilter}
                        onChange={(e) => setAssigneeFilter(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300"
                      >
                        <option value="All">全部人员</option>
                        {assignees.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">筛选优先级</label>
                      <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
                        {(['All', '高', '中', '低'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            className={cn(
                              "flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                              priorityFilter === p ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-400"
                            )}
                          >
                            {p === 'All' ? '全部' : p}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>

        {viewMode === 'Kanban' && (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex-1 grid grid-cols-7 gap-6 overflow-hidden">
            {/* Pending Split Column */}
            <section className={cn(
                "bg-slate-900/50 rounded-2xl border border-red-900/30 flex flex-col overflow-hidden transition-all duration-300",
                isPendingSplitExpanded ? "col-span-1" : "min-w-[40px] w-[40px] items-center cursor-pointer"
            )} onClick={() => !isPendingSplitExpanded && setIsPendingSplitExpanded(true)}>
                <div className={cn("p-4 border-b border-red-900/20 bg-red-950/20 flex flex-col items-center gap-4", isPendingSplitExpanded ? "flex-row justify-between" : "justify-center")} onClick={isPendingSplitExpanded ? () => setIsPendingSplitExpanded(false) : undefined}>
                    <h2 className={cn("text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2", isPendingSplitExpanded ? "flex-row" : "flex-col [writing-mode:vertical-rl]")}>
                        <AlertTriangle size={14} />
                        {isPendingSplitExpanded && "主任务"}
                    </h2>
                    {isPendingSplitExpanded && <span className="px-2 py-0.5 bg-red-900 text-red-200 text-[10px] rounded-full font-bold">{pendingSplitTasks.length}</span>}
                    {!isPendingSplitExpanded && pendingSplitTasks.length > 0 && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                </div>
                {isPendingSplitExpanded && (
                  <Droppable droppableId="pending-split">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-all duration-300",
                          snapshot.isDraggingOver && "bg-red-500/[0.05]"
                        )}
                      >
                        {pendingSplitTasks.map((task, idx) => (
                          <MainTaskCard key={task.id} task={task} index={idx} allTasks={tasks} setTasks={setTasks} openSplitTaskModal={openSplitTaskModal} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
            </section>
            
              {/* Overdue Bento Column */}
              <section className="bg-slate-900/30 rounded-2xl border border-dashed border-red-900/30 flex flex-col overflow-hidden group hover:bg-red-500/[0.02] transition-colors">
                <div className="p-4 border-b border-red-900/20 bg-red-950/20 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} />
                    逾期遗留项
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
                        <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>

              {/* Todo Bento Column */}
              <section className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} />
                    待办任务
                  </h2>
                  <span className="px-2 py-0.5 bg-indigo-900/50 text-indigo-200 text-[10px] rounded-full font-bold">{todoTasks.length}</span>
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
                      {sortedTodoTasks.length > 0 ? (
                        sortedTodoTasks.map((task, idx) => {
                          const isNewGroup = idx === 0 || task.mainTaskId !== sortedTodoTasks[idx-1].mainTaskId;
                          return (
                            <React.Fragment key={task.id}>
                              {isNewGroup && (
                                <div className="col-span-1 mt-4 text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                  {mainTasks.find(mt => mt.id === task.mainTaskId)?.name || '未分组'}
                                </div>
                              )}
                              <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} />
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                          <LayoutGrid size={48} strokeWidth={1} />
                          <p className="mt-2 text-xs font-bold uppercase">暂无待办任务</p>
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>

              {/* In Progress Column */}
              <section className="col-span-2 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} />
                    今日制作
                  </h2>
                  <span className="px-2 py-0.5 bg-amber-900/50 text-amber-200 text-[10px] rounded-full font-bold">{inProgressTasks.length}</span>
                </div>
                
                <Droppable droppableId="in-progress-zone">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-4 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar transition-all duration-300",
                        snapshot.isDraggingOver && "bg-amber-500/[0.02]"
                      )}
                    >
                      {sortedInProgressTasks.map((task, idx) => {
                          const isNewGroup = idx === 0 || task.mainTaskId !== sortedInProgressTasks[idx-1].mainTaskId;
                          return (
                            <React.Fragment key={task.id}>
                              {isNewGroup && (
                                <div className="col-span-2 mt-4 text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                  {mainTasks.find(mt => mt.id === task.mainTaskId)?.name || '未分组'}
                                </div>
                              )}
                              <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} />
                            </React.Fragment>
                          );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>

              {/* Approval Column */}
              <section className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl relative">
                <div className="p-4 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
                  <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock size={14} />
                    审批中
                  </h2>
                  <span className="px-2 py-0.5 bg-blue-900/50 text-blue-200 text-[10px] rounded-full font-bold">{inApprovalTasks.length}</span>
                </div>
                
                <Droppable droppableId="approval-zone">
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar transition-all duration-300",
                        snapshot.isDraggingOver && "bg-blue-500/[0.02]"
                      )}
                    >
                      {sortedInApprovalTasks.map((task, idx) => {
                          const isNewGroup = idx === 0 || task.mainTaskId !== sortedInApprovalTasks[idx-1].mainTaskId;
                          return (
                            <React.Fragment key={task.id}>
                              {isNewGroup && (
                                <div className="col-span-1 mt-4 text-[10px] font-bold text-slate-500 uppercase flex items-center gap-2">
                                  {mainTasks.find(mt => mt.id === task.mainTaskId)?.name || '未分组'}
                                </div>
                              )}
                              <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} />
                            </React.Fragment>
                          );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </section>

              {/* Done Bento Column / Drop Zone */}
              <section className="bg-slate-900/30 rounded-2xl border border-dashed border-emerald-900/20 flex flex-col overflow-hidden">
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
            </div>
          </DragDropContext>
        )}
        {viewMode === 'Gantt' && <GanttView tasks={filteredTasks} />}
        {viewMode === 'Swimlane' && <SwimlaneView tasks={filteredTasks} grouping={swimlaneGrouping} />}
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
