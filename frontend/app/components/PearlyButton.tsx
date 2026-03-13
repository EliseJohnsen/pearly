'use client'

import { ReactNode } from 'react';
import Link from 'next/link';

interface PearlyButtonProps {
  label?: string;
  children?: ReactNode;
  skin?: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
}

export default function PearlyButton({
  label,
  children,
  skin = 'default',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  href,
}: PearlyButtonProps) {

  const getSkinClasses = (skin: string, isLink: boolean) => {
    const h = isLink ? 'hover:' : 'enabled:hover:';
    switch (skin) {
      case 'primary':
        return `bg-dark-purple text-white ${h}bg-purple-extra-dark border-dark-purple`;
      case 'secondary':
        return `bg-primary-dark-pink text-dark-purple ${h}bg-primary-light border-primary-dark-pink`;
      case 'success':
        return 'bg-success text-white border-success';
      case 'danger':
        return `bg-primary-red text-white ${h}bg-red-dark border-primary-red`;
      case 'outline':
        return `bg-transparent border-dark-purple text-dark-purple ${h}bg-disabled`;
      case 'ghost':
        return `bg-transparent border-transparent text-dark-purple ${h}bg-primary-light`;
      case 'default':
      default:
        return `bg-background-secondary border-default text-app-primary ${h}bg-primary-light`;
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
