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
        return 'bg-primary text-white hover:bg-primary-hover border-primary';
      case 'secondary':
        return 'bg-primary-dark-pink text-dark-purple hover:bg-primary-light border-primary-dark-pink';
      case 'success':
        return 'bg-success text-white hover:bg-success-hover border-success';
      case 'danger':
        return 'bg-primary-red text-white hover:opacity-90 border-primary-red';
      case 'outline':
        return 'bg-transparent border-dark-purple text-dark-purple hover:bg-primary-dark-pink';
      case 'ghost':
        return 'bg-transparent border-transparent text-dark-purple hover:bg-primary-light';
      case 'default':
      default:
        return 'bg-background-secondary border-default text-app-primary hover:bg-primary-light';
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
