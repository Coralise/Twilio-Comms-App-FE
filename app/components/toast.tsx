/* From Uiverse.io by seyed-mohsen-mousavi */ 
import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';

interface ToastProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  description: string;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, description, onClose }) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-zinc-900',
          iconColor: 'text-green-500',
          icon: <FaCheckCircle className="w-6 h-6" />,
        };
      case 'error':
        return {
          bgColor: 'bg-zinc-900',
          iconColor: 'text-red-500',
          icon: <FaTimesCircle className="w-6 h-6" />,
        };
      case 'warning':
        return {
          bgColor: 'bg-zinc-900',
          iconColor: 'text-yellow-500',
          icon: <FaExclamationCircle className="w-6 h-6" />,
        };
      default:
        return {
          bgColor: 'bg-zinc-500',
          iconColor: 'text-zinc-500',
          icon: null,
        };
    }
  };

  const { bgColor, iconColor, icon } = getTypeStyles();

  return (
    <div className={`flex flex-col gap-2 w-[20rem] text-md z-50 pointer-events-none`}>
      <div className={`flex items-center justify-between w-full rounded-lg ${bgColor} p-2`}>
        <div className="flex gap-2 items-center">
          <div className={`${iconColor} bg-white/5 backdrop-blur-xl p-1 h-fit rounded-lg`}>
            {icon}
          </div>
          <div>
            <p className="text-white">{message}</p>
            <p className="text-zinc-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
