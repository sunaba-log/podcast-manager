/**
 * ValidationWarning Component - displays validation warning messages
 * Supports multiple warnings with different severity levels
 */

'use client';

import { AlertCircle, AlertTriangle, Info, XIcon } from 'lucide-react';
import { useState } from 'react';

export type WarningType = 'info' | 'warning' | 'error';

interface ValidationWarningProps {
  message?: string;
  messages?: string[];
  warnings?: string[];
  type?: WarningType;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const iconByType = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
};

const bgByType = {
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-yellow-50 border-yellow-200',
  error: 'bg-red-50 border-red-200',
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
  messages,
  warnings,
  type = 'warning',
  title,
  dismissible = false,
  onDismiss,
}: ValidationWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  // Support multiple warning arrays
  const allWarnings = warnings || messages || (message ? [message] : []);

  if (allWarnings.length === 0 || dismissed) {
    return null;
  }

  const Icon = iconByType[type];

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Single warning - original layout
  if (allWarnings.length === 1) {
    return (
      <div className={`border rounded-lg p-4 flex items-start gap-3 ${bgByType[type]}`}>
        <Icon className={`w-5 h-5 ${iconColorByType[type]} flex-shrink-0 mt-0.5`} />
        <div className={`flex-1 text-sm ${textByType[type]}`}>
          {title && <p className="font-semibold">{title}</p>}
          <p className={title ? 'mt-1' : ''}>{allWarnings[0]}</p>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 ${iconColorByType[type]} hover:opacity-70`}
          >
            <span className="sr-only">Dismiss</span>
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    );
  }

  // Multiple warnings - list layout
  return (
    <div className={`border rounded-lg p-4 space-y-3 ${bgByType[type]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColorByType[type]} flex-shrink-0 mt-0.5`} />
        <div className={`flex-1 text-sm ${textByType[type]}`}>
          {title && <p className="font-semibold">{title}</p>}
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 ${iconColorByType[type]} hover:opacity-70`}
          >
            <span className="sr-only">Dismiss</span>
            <XIcon className="w-5 h-5" />
          </button>
        )}
      </div>
      <ul className="space-y-2 ml-8">
        {allWarnings.map((warning, index) => (
          <li key={index} className={`text-sm ${textByType[type]}`}>
            • {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}
