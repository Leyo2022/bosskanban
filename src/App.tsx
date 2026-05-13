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
type ViewMode = 'Kanban' | 'Gantt' | 'Swimlane' | 'List';
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
  // 主任务1: 未拆解
  {
    id: 'mt-1',
    name: '主角交互特效',
    isMainTaskStub: true,
    assignee: { name: '陈晓东', avatar: 'https://i.pravatar.cc/150?u=alex' },
    status: '待处理',
    priority: '高',
    startDate: '2026-05-12T09:00:00Z',
    deadline: '2026-05-15T18:00:00Z',
    description: '核心交互机制研究与落地。',
    phase: '模型雕刻'
  },
  // 主任务2: 已拆解
  {
    id: 'mt-2',
    name: '全场景材质映射',
    isMainTaskStub: false,
    assignee: { name: '张子明', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    status: '进行中',
    priority: '高',
    startDate: '2026-05-06T10:00:00Z',
    deadline: '2026-05-10T14:00:00Z',
    description: '全场景材质烘培与渲染设置。',
    phase: '模型雕刻'
  },
  {
    id: 'task-2-1',
    mainTaskId: 'mt-2',
    name: '环境光遮蔽烘焙',
    assignee: { name: '张子明', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    status: '进行中',
    priority: '高',
    startDate: '2026-05-06T10:00:00Z',
    deadline: '2026-05-07T14:00:00Z',
    description: '子任务：计算环境光遮蔽贴图。',
    phase: '材质绘制'
  },
  {
    id: 'task-2-2',
    mainTaskId: 'mt-2',
    name: '材质球映射',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '待处理',
    priority: '中',
    startDate: '2026-05-07T08:00:00Z',
    deadline: '2026-05-08T18:00:00Z',
    description: '子任务：将材质球应用至模型。',
    phase: '材质绘制'
  },
  // 新增: 主任务3: 未拆解
  {
    id: 'mt-3',
    name: '武器特效开发',
    isMainTaskStub: true,
    assignee: { name: '王小云', avatar: 'https://i.pravatar.cc/150?u=emily' },
    status: '待处理',
    priority: '中',
    startDate: '2026-05-13T09:00:00Z',
    deadline: '2026-05-20T18:00:00Z',
    description: '基础打击特效开发。',
    phase: '特效制作'
  },
  // 新增: 主任务4: 已拆解
  {
    id: 'mt-4',
    name: '反派拓扑优化',
    isMainTaskStub: false,
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '待处理',
    priority: '高',
    startDate: '2026-05-13T09:00:00Z',
    deadline: '2026-05-20T18:00:00Z',
    description: '优化反派角色网格结构。',
    phase: '拓扑优化'
  },
  {
    id: 'task-4-1',
    mainTaskId: 'mt-4',
    name: '关节区域重布线',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '待处理',
    priority: '高',
    startDate: '2026-05-13T09:00:00Z',
    deadline: '2026-05-15T18:00:00Z',
    description: '优化关节形变。',
    phase: '拓扑优化'
  },
  {
    id: 'task-4-2',
    mainTaskId: 'mt-4',
    name: '面部拓扑修正',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '待处理',
    priority: '中',
    startDate: '2026-05-13T09:00:00Z',
    deadline: '2026-05-16T18:00:00Z',
    description: '修正面部表情布线。',
    phase: '拓扑优化'
  },
  // 新增: 主任务5: 已拆解 (多子任务示例)
  {
    id: 'mt-5',
    name: '环境增强特效',
    isMainTaskStub: false,
    assignee: { name: '王小云', avatar: 'https://i.pravatar.cc/150?u=emily' },
    status: '进行中',
    priority: '中',
    startDate: '2026-05-13T09:00:00Z',
    deadline: '2026-05-25T18:00:00Z',
    description: '环境氛围增强特效集成。',
    phase: '特效制作'
  },
  {
    id: 'task-5-1',
    mainTaskId: 'mt-5',
    name: '粒子效果优化',
    assignee: { name: '王小云', avatar: 'https://i.pravatar.cc/150?u=emily' },
    status: '进行中',
    priority: '高',
    startDate: '2026-05-13T09:00:00Z',
    deadline: '2026-05-18T18:00:00Z',
    description: '提升复杂粒子计算效率。',
    phase: '特效制作'
  },
  {
    id: 'task-5-2',
    mainTaskId: 'mt-5',
    name: '光影交互集成',
    assignee: { name: '陈晓东', avatar: 'https://i.pravatar.cc/150?u=alex' },
    status: '待处理',
    priority: '中',
    startDate: '2026-05-14T09:00:00Z',
    deadline: '2026-05-20T18:00:00Z',
    description: '灯光与特效联动系统。',
    phase: '后端逻辑'
  },
  {
    id: 'task-5-3',
    mainTaskId: 'mt-5',
    name: '碰撞边界测试',
    assignee: { name: '李瑞', avatar: 'https://i.pravatar.cc/150?u=mike' },
    status: '待处理',
    priority: '低',
    startDate: '2026-05-15T09:00:00Z',
    deadline: '2026-05-22T18:00:00Z',
    description: '测试特效与场景碰撞边界。',
    phase: '特效测试'
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
  tasks: Task[];
  isTodoColumn?: boolean;
}

const TaskItem = ({ task, isOverdue, subtasks }: { task: Task, isOverdue: boolean, subtasks?: Task[] }) => {
  const hasSubtasks = subtasks && subtasks.length > 0;

  return (
    <>
      <div className="flex justify-between mb-3">
        {task.isMainTaskStub ? (
          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold italic bg-red-500/10 text-red-500">
            <AlertTriangle size={10} /> 未拆解
          </span>
        ) : hasSubtasks ? (
          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-indigo-500/10 text-indigo-400">
            已拆解 (主任务)
          </span>
        ) : !task.mainTaskId ? (
          <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-400">
            主任务
          </span>
        ) : null}
        <span className={cn("text-[10px] font-mono", isOverdue ? "text-red-400" : "text-slate-400")}>
          {isToday(new Date(task.deadline)) ? "今日" : "昨日"} {format(new Date(task.deadline), 'HH:mm')}
        </span>
      </div>
      
      <h4 className="text-sm font-bold text-slate-100 mb-2 line-clamp-1 uppercase tracking-tight flex items-center gap-2">
          {task.name} <Badge variant={task.priority as any}>{task.priority}</Badge>
      </h4>
      
      <p className="text-[11px] text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          {task.description}
      </p>
      
      <div className="flex items-center gap-2 mb-4">
           <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border border-slate-800 flex items-center justify-center overflow-hidden">
              <img src={task.assignee.avatar} alt="" className="w-full h-full object-cover" />
           </div>
           <span className="text-[10px] text-slate-400 font-medium">{task.assignee.name}</span>
      </div>

      {hasSubtasks && (
          <div className="border-t border-slate-700/50 pt-3 mt-2 space-y-2">
              {subtasks.map(st => (
                  <div key={st.id} className="group flex items-center text-[11px] gap-3 bg-slate-950/50 p-2 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-indigo-400" />
                      <span className="flex-1 truncate text-slate-300 group-hover:text-white font-medium">{st.name}</span>
                      <span className="text-slate-500 font-mono text-[10px]">{format(new Date(st.deadline), 'MM-dd')}</span>
                      <img src={st.assignee.avatar} className="w-4 h-4 rounded-full border border-slate-700" alt="" />
                  </div>
              ))}
              <button className="text-[10px] text-indigo-400 font-bold flex items-center gap-1 mt-2 hover:text-indigo-300 transition-colors">
                  <Plus size={10} /> 添加子任务
              </button>
          </div>
      )}
    </>
  );
};

const TaskCard: React.FC<TaskCardProps> = ({ task, index, mainTask, tasks, isTodoColumn }) => {
  const isOverdue = isPast(new Date(task.deadline)) && !isToday(new Date(task.deadline)) && task.status !== '已完成';
  
  // Robustly identify main tasks based on subtasks or stub status, only if in Todo column
  const subtasks = isTodoColumn ? tasks.filter(t => t.mainTaskId === task.id) : [];
  const isMainTask = isTodoColumn && (subtasks.length > 0 || task.isMainTaskStub);

  
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "group relative p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all duration-200 shadow-lg",
            isOverdue ? "border-l-4 border-l-red-500" : "border-l-4 border-l-indigo-500",
            snapshot.isDragging && "shadow-2xl shadow-indigo-500/20 border-indigo-500/50 bg-slate-800 scale-[1.02] z-50",
            task.status === '已完成' && "opacity-50 grayscale-[0.5] border-l-emerald-500"
          )}
        >
          <TaskItem task={task} isOverdue={isOverdue} subtasks={isTodoColumn && isMainTask ? subtasks : undefined} />
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

const ListView = ({ tasks }: { tasks: Task[] }) => {
  const mainTasks = tasks.filter(t => !t.mainTaskId);
  
  return (
    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 overflow-x-auto overflow-y-auto custom-scrollbar">
      <table className="w-full text-xs text-left whitespace-nowrap">
        <thead className="text-slate-500 uppercase tracking-widest font-bold border-b border-slate-800">
          <tr>
            <th className="pb-4 pr-4">任务标识 (ID)</th>
            <th className="pb-4 pr-4">任务名称</th>
            <th className="pb-4 pr-4">任务类型</th>
            <th className="pb-4 pr-4">资产类型</th>
            <th className="pb-4 pr-4">关联实体</th>
            <th className="pb-4 pr-4">任务状态</th>
            <th className="pb-4 pr-4">过程状态</th>
            <th className="pb-4 pr-4">优先级</th>
            <th className="pb-4 pr-4">责任人</th>
            <th className="pb-4 pr-4">参与人</th>
            <th className="pb-4 pr-4">审核人</th>
            <th className="pb-4 pr-4">任务开始时间</th>
            <th className="pb-4 pr-4">计划完成时间</th>
            <th className="pb-4 pr-4">超时时间</th>
            <th className="pb-4 pr-4">预估工时</th>
            <th className="pb-4 pr-4">实际工时</th>
            <th className="pb-4 pr-4">项目名称</th>
            <th className="pb-4 pr-4">项目状态</th>
            <th className="pb-4 pr-4">项目导演</th>
            <th className="pb-4 pr-4">项目负责人</th>
            <th className="pb-4 pr-4">创建人</th>
          </tr>
        </thead>
        <tbody className="text-slate-300">
          {mainTasks.map(task => (
            <tr key={task.id} className="border-b border-slate-800 hover:bg-slate-800/20">
              <td className="py-4 pr-4 font-mono text-slate-500">{task.id}</td>
              <td className="py-4 pr-4 font-bold text-slate-100">{task.name}</td>
              <td className="py-4 pr-4">生产任务</td>
              <td className="py-4 pr-4">-</td>
              <td className="py-4 pr-4">-</td>
              <td className="py-4 pr-4"><Badge variant="default">{task.status}</Badge></td>
              <td className="py-4 pr-4">{task.phase}</td>
              <td className="py-4 pr-4"><Badge variant={task.priority as any}>{task.priority}</Badge></td>
              <td className="py-4 pr-4 flex items-center gap-2">
                 <img src={task.assignee.avatar} className="w-5 h-5 rounded-full border border-slate-700" alt="" />
                 {task.assignee.name}
              </td>
              <td className="py-4 pr-4">-</td>
              <td className="py-4 pr-4">-</td>
              <td className="py-4 pr-4 font-mono">{format(new Date(task.startDate), 'MM-dd')}</td>
              <td className="py-4 pr-4 font-mono">{format(new Date(task.deadline), 'MM-dd')}</td>
              <td className="py-4 pr-4 font-mono">-</td>
              <td className="py-4 pr-4 font-mono">-</td>
              <td className="py-4 pr-4 font-mono">-</td>
              <td className="py-4 pr-4">角色特效工程</td>
              <td className="py-4 pr-4">进行中</td>
              <td className="py-4 pr-4">张导演</td>
              <td className="py-4 pr-4">李项目</td>
              <td className="py-4 pr-4">系统</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [mainTasks, setMainTasks] = useState<MainTask[]>(INITIAL_MAIN_TASKS);
  const [isReady, setIsReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stubModalTask, setStubModalTask] = useState<Task | null>(null);
  const [taskSelectionModal, setTaskSelectionModal] = useState<{ result: DropResult, subtasks: Task[] } | null>(null);
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
  const [isOverdueExpanded, setIsOverdueExpanded] = useState(false);

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
      
      // Check for main task (has subtasks)
      const subtasks = tasks.filter(t => t.mainTaskId === draggedTask?.id);
      if (subtasks.length > 0) {
        setTaskSelectionModal({ result, subtasks });
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
      {taskSelectionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
             <h2 className="text-lg font-bold text-white mb-4">选择任务到今日制作</h2>
             <p className="text-xs text-slate-400 mb-4">任务已拆解，请选择要移动的子任务，或创建新子任务：</p>
             <div className="space-y-2 mb-6">
                {taskSelectionModal.subtasks.map(st => (
                  <button 
                     key={st.id}
                     className="w-full text-left p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-sm text-slate-300"
                     onClick={() => {
                        setTasks(prev => prev.map(t => t.id === st.id ? { ...t, status: '进行中' as const } : t));
                        setTaskSelectionModal(null);
                     }}
                  >
                    {st.name}
                  </button>
                ))}
             </div>
             
             <div className="flex flex-col gap-2">
                <button className="w-full px-4 py-2 bg-indigo-600 rounded-xl text-xs font-bold text-white hover:bg-indigo-500">创建新子任务</button>
                <button className="w-full px-4 py-2 bg-slate-700 rounded-xl text-xs font-bold text-white" onClick={() => setTaskSelectionModal(null)}>取消</button>
             </div>
          </div>
        </div>
      )}
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
              {(['Kanban', 'Gantt', 'Swimlane', 'List'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-widest",
                    viewMode === mode ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "text-slate-500 hover:text-slate-400"
                  )}
                >
                  {mode === 'Kanban' ? <LayoutGrid size={12} /> : mode === 'Gantt' ? <Calendar size={12} /> : mode === 'Swimlane' ? <Columns size={12} /> : <Layers size={12} />}
                  {mode === 'Kanban' ? '看板管理' : mode === 'Gantt' ? '环节甘特图' : mode === 'Swimlane' ? '泳道视图' : '列表视图'}
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
          <div className="flex items-center gap-4 border-l border-slate-800 pl-6">
             <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">延期</p>
                <p className="text-xs font-mono font-bold text-red-500">{tasks.filter(t => isPast(new Date(t.deadline)) && !isToday(new Date(t.deadline)) && t.status !== '已完成').length}</p>
             </div>
             <div className="text-center">
                <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">已清</p>
                <p className="text-xs font-mono font-bold text-emerald-500">{tasks.filter(t => t.status === '已完成').length}</p>
             </div>
          </div>
          <div className="flex items-center gap-6 border-l border-slate-800 pl-6">
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

        <div className="flex items-center gap-6 ml-auto">
          <div className="text-right hidden sm:block">
          </div>
          <div className="w-10 h-10 rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center overflow-hidden shadow-inner">
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 flex flex-col gap-6 overflow-hidden">
        {viewMode === 'Kanban' && (
          <DragDropContext onDragEnd={onDragEnd}>
            
            {/* Collapsible Overdue Area */}
            <section className={cn("rounded-2xl border border-dashed border-red-900/30 flex flex-col overflow-hidden transition-all duration-300", isOverdueExpanded ? "max-h-[300px]" : "max-h-[50px]")}>
                <div 
                    className="p-4 border-b border-red-900/20 bg-red-950/20 flex justify-between items-center cursor-pointer hover:bg-red-950/30"
                    onClick={() => setIsOverdueExpanded(!isOverdueExpanded)}
                >
                  <h2 className="text-xs font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <History size={14} />
                    逾期遗留项
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-red-900 text-red-200 text-[10px] rounded-full font-bold">{overdueTasks.length}</span>
                    <ChevronRight size={14} className={cn("text-red-500 transition-transform", isOverdueExpanded ? "rotate-90" : "")} />
                  </div>
                </div>
              
                {isOverdueExpanded && (
                  <Droppable droppableId="overdue">
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          "flex-1 p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto custom-scrollbar transition-all duration-300",
                          snapshot.isDraggingOver && "bg-red-500/[0.05]"
                        )}
                      >
                        {overdueTasks.map((task, idx) => (
                          <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} tasks={tasks} />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}
            </section>

            <div className="flex-1 grid grid-cols-5 gap-6 overflow-hidden">
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
                          // Only render main tasks (that are not subtasks)
                          if (task.mainTaskId) return null;
                          
                          return (
                            <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} tasks={tasks} isTodoColumn={true} />
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
                        "flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar transition-all duration-300",
                        snapshot.isDraggingOver && "bg-amber-500/[0.02]"
                      )}
                    >
                      {sortedInProgressTasks.map((task, idx) => {
                          const hasSubtasks = tasks.some(t => t.mainTaskId === task.id);

                          // Only render main tasks (that are not subtasks)
                          if (task.mainTaskId) return null;
                          
                          return (
                            <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} tasks={tasks} />
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
                          // Only render main tasks (that are not subtasks)
                          if (task.mainTaskId) return null;
                          
                          return (
                            <TaskCard key={task.id} task={task} index={idx} mainTask={mainTasks.find(mt => mt.id === task.mainTaskId)} tasks={tasks} />
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
        {viewMode === 'List' && <ListView tasks={filteredTasks} />}
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
