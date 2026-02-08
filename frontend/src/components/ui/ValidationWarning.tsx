/**
 * ValidationWarning Component - displays validation warning messages
 */

'use client';

import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

export type WarningType = 'info' | 'warning' | 'error';

interface ValidationWarningProps {
  message: string;
  type?: WarningType;
  title?: string;
}

const iconByType = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const bgByType = {
  info: 'bg-blue-50',
  warning: 'bg-yellow-50',
  error: 'bg-red-50',
};

const textByType = {
  info: 'text-blue-800',
  warning: 'text-yellow-800',
  error: 'text-red-800',
};

const iconColorByType = {
  info: 'text-blue-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
};

export default function ValidationWarning({
  message,
  type = 'warning',
  title,
}: ValidationWarningProps) {
  const Icon = iconByType[type];

  return (
    <div className={`${bgByType[type]} p-3 rounded-lg flex items-start gap-3`}>
      <Icon className={`w-5 h-5 ${iconColorByType[type]} flex-shrink-0 mt-0.5`} />
      <div className={`flex-1 text-sm ${textByType[type]}`}>
        {title && <p className="font-semibold">{title}</p>}
        <p className={title ? 'mt-1' : ''}>{message}</p>
      </div>
    </div>
  );
}
