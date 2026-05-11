import React, { useState } from 'react';
import ReactFlow, { Background, Controls, NodeProps, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { X, Save, Settings, Trash2, ChevronDown, Plus, Minus, Layers, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

// Styled Node Component
const CustomNode = ({ data }: NodeProps) => (
  <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl w-40 flex flex-col items-center text-center">
    <Handle type="target" position={Position.Left} className="!bg-indigo-500" />
    <div className="bg-slate-800 p-2 rounded-lg mb-2">
        <Layers size={18} className="text-indigo-400" />
    </div>
    <h4 className="font-bold text-slate-100 text-xs">{data.label}</h4>
    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
        <Clock size={10} /> {data.hours}
    </div>
    <Handle type="source" position={Position.Right} className="!bg-indigo-500" />
  </div>
);

const nodeTypes = { custom: CustomNode };

export const PipelineConfig = ({ onClose }: { onClose: () => void }) => {
  const [nodes, setNodes] = useState([
    { id: '1', type: 'custom', data: { label: '概念设计', hours: '12-20H' }, position: { x: 100, y: 150 } },
    { id: '2', type: 'custom', data: { label: '高模制作', hours: '40-120H' }, position: { x: 400, y: 50 } },
    { id: '3', type: 'custom', data: { label: '其他制作', hours: '12-20H' }, position: { x: 400, y: 250 } },
  ]);
  const [edges, setEdges] = useState([
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#6366f1' } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { stroke: '#6366f1' } },
  ]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900">
        <div className="flex items-center gap-4">
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-white" /></button>
          
          <div className="h-6 w-px bg-slate-800" />
          
          <div className="flex flex-col">
            <span className="font-bold text-slate-100 text-sm">角色管线_主角 - 管线流程配置</span>
            <span className="text-[10px] text-slate-500">角色 · 步骤内嵌工作流：模型三级审核工作流</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1">
                <Minus size={14} className="text-slate-400" />
                <span className="text-xs text-slate-100 font-mono">100%</span>
                <Plus size={14} className="text-slate-400" />
            </div>
            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded text-sm hover:bg-indigo-500 font-bold">
            <Save size={14} /> 保存管线
            </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 bg-slate-950 relative">
          <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
          </ReactFlow>
        </div>

        {/* Right Panel */}
        <aside className="w-80 border-l border-slate-800 bg-slate-900 p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-100 uppercase tracking-widest text-xs">步骤属性</h3>
                <X size={16} className="text-slate-400 hover:text-white cursor-pointer" />
            </div>
            
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
                <div className="bg-slate-900 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <Layers size={24} className="text-indigo-400" />
                </div>
                <h4 className="font-bold text-slate-100">高模制作</h4>
                <p className="text-xs text-slate-400 mt-1">ID: pvs2</p>
            </div>
            
            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">步骤类型</label>
                <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center cursor-pointer hover:border-slate-600 transition-colors">
                    <span className="text-sm text-slate-300">高模制作</span>
                    <ChevronDown size={14} className="text-slate-500" />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">负责角色</label>
                <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center cursor-pointer hover:border-slate-600 transition-colors">
                    <span className="text-sm text-slate-300">已选 3 个角色</span>
                    <ChevronDown size={14} className="text-slate-500" />
                </div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <button className="w-full text-red-400 text-xs font-bold bg-red-950/20 border border-red-900/50 py-2.5 rounded-lg hover:bg-red-950/40">
                    从管线中移除
                </button>
                <button className="w-full text-red-500 text-xs font-bold border border-red-900/50 py-2.5 rounded-lg hover:bg-red-900/10 flex items-center justify-center gap-2">
                    <Trash2 size={14} /> 删除步骤
                </button>
            </div>
        </aside>
      </div>
    </div>
  );
};
