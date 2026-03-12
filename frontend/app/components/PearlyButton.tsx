'use client'

import { ReactNode } from 'react';

interface PearlyButtonProps {
  label?: string;
  children?: ReactNode;
  skin?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function PearlyButton({
  label,
  children,
  skin = 'default',
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}: PearlyButtonProps) {

  const getSkinClasses = (skin: string) => {
    switch (skin) {
      case 'primary':
        return 'bg-dark-purple text-white enabled:hover:bg-purple-extra-dark border-dark-purple';
      case 'secondary':
        return 'bg-primary-dark-pink text-dark-purple enabled:hover:bg-primary-light border-primary-dark-pink';
      case 'success':
        return 'bg-success text-white border-success';
      case 'danger':
        return 'bg-primary-red text-white enabled:hover:bg-red-dark border-primary-red';
      case 'outline':
        return 'bg-transparent border-dark-purple text-dark-purple enabled:hover:bg-disabled';
      case 'ghost':
        return 'bg-transparent border-transparent text-dark-purple enabled:hover:bg-primary-light';
      case 'default':
      default:
        return 'bg-background-secondary border-default text-app-primary enabled:hover:bg-primary-light';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 my-4 border rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getSkinClasses(skin)} ${className}`}
    >
      {children || label}
    </button>
  )
}
