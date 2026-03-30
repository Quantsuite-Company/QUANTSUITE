import { ReactElement, cloneElement } from 'react';
import { cn } from '@/lib/utils';

type IconVariant = 'default' | 'gradient' | 'solid' | 'glow';
type IconSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
type IconColor = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface IconWrapperProps {
  icon: ReactElement;
  variant?: IconVariant;
  size?: IconSize;
  color?: IconColor;
  className?: string;
}

const sizeMap: Record<IconSize, number> = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  xxl: 64,
};

const colorMap: Record<IconColor, string> = {
  primary: 'text-primary',
  success: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500',
  info: 'text-blue-500',
  muted: 'text-muted-foreground',
};

const variantStyles: Record<IconVariant, string> = {
  default: '',
  gradient: 'p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10',
  solid: 'p-3 rounded-xl bg-primary/10',
  glow: 'p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/20',
};

export function IconWrapper({ 
  icon, 
  variant = 'default', 
  size = 'md', 
  color = 'primary',
  className 
}: IconWrapperProps) {
  const iconSize = sizeMap[size];
  const iconColor = colorMap[color];
  
  const iconElement = cloneElement(icon, {
    size: iconSize,
    className: cn(iconColor, icon.props.className),
  });

  if (variant === 'default') {
    return iconElement;
  }

  return (
    <div className={cn(variantStyles[variant], 'inline-flex items-center justify-center transition-all duration-300', className)}>
      {iconElement}
    </div>
  );
}
