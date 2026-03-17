'use client'

import { ReactNode } from 'react';
import Link from 'next/link';

interface PearlyButtonProps {
  label?: string;
  children?: ReactNode;
  skin?: 'primary' | 'success' | 'danger' | 'outline' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
}

export default function PearlyButton({
  label,
  children,
  skin = 'primary',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  href,
}: PearlyButtonProps) {

  const getSkinClasses = (skin: string, isLink: boolean) => {
    switch (skin) {
      case 'primary':
        return isLink
          ? 'bg-dark-purple text-white hover:bg-purple-extra-dark border-dark-purple'
          : 'bg-dark-purple text-white enabled:hover:bg-purple-extra-dark border-dark-purple';
      case 'success':
        return isLink
          ? 'bg-success text-white border-success hover:bg-green-dark'
          : 'bg-success text-white border-success enabled:hover:bg-green-dark';
      case 'danger':
        return isLink
          ? 'bg-primary-red text-white hover:bg-red-dark border-primary-red'
          : 'bg-primary-red text-white enabled:hover:bg-red-dark border-primary-red';
      case 'outline':
        return isLink
          ? 'bg-transparent border-purple-light text-dark-purple hover:border-dark-purple'
          : 'bg-transparent border-purple-light text-dark-purple enabled:hover:border-dark-purple';
      case 'ghost':
        return isLink
          ? 'bg-transparent border-transparent text-dark-purple hover:bg-primary-light'
          : 'bg-transparent border-transparent text-dark-purple enabled:hover:bg-primary-light';
      default:
        return isLink
          ? 'bg-background-secondary border-default text-app-primary hover:bg-primary-light'
          : 'bg-dark-purple text-white enabled:hover:bg-purple-extra-dark border-dark-purple';
    }
  };

  const baseClasses = `flex items-center justify-center gap-2 px-4 py-2 my-4 border rounded-lg font-semibold transition-colors ${getSkinClasses(skin, !!href)} ${className}`;

  if (href) {
    return (
      <Link href={href} className={baseClasses}>
        {children || label}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {children || label}
    </button>
  )
}
