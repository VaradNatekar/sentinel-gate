import React from 'react';
import { AlertCircle, ShieldAlert, Check, X } from 'lucide-react';

interface PlatformDialogProps {
  isOpen: boolean;
  type: 'alert' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const PlatformDialog: React.FC<PlatformDialogProps> = ({
  isOpen, type, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={type === 'alert' ? onCancel : undefined}></div>
      <div className="relative w-full max-w-md bg-[#0f1626] border border-slate-700 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-4 border-b ${type === 'alert' ? 'border-amber-500/30 bg-amber-500/10' : 'border-rose-500/30 bg-rose-500/10'} flex items-center gap-3`}>
          {type === 'alert' ? (
            <AlertCircle className="w-5 h-5 text-amber-500" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          )}
          <h3 className={`font-bold ${type === 'alert' ? 'text-amber-400' : 'text-rose-400'}`}>
            {title}
          </h3>
        </div>
        
        <div className="p-6 text-slate-300 text-sm leading-relaxed">
          {message}
        </div>
        
        <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-end gap-3">
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={type === 'confirm' ? onConfirm : onCancel}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm ${
              type === 'alert' 
                ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_15px_rgba(225,29,72,0.3)]'
            }`}
          >
            {type === 'confirm' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {type === 'confirm' ? confirmText : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
