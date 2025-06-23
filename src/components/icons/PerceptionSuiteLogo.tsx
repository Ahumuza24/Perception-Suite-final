import Image from 'next/image';
import { FC } from 'react';
import { cn } from '@/lib/utils';

interface PerceptionSuiteLogoProps {
  width?: number;
  height?: number;
  className?: string;
  variant?: 'default' | 'small' | 'large';
}

export const PerceptionSuiteLogo: FC<PerceptionSuiteLogoProps> = ({
  width,
  height,
  className = '',
  variant = 'default',
}) => {
  // Define size variants
  const sizes = {
    small: { width: 120, height: 42 },
    default: { width: 200, height: 70 },
    large: { width: 300, height: 105 },
  };

  // Use provided dimensions or fall back to variant-based dimensions
  const finalWidth = width || sizes[variant].width;
  const finalHeight = height || sizes[variant].height;

  return (
    <Image
      src="/PerceptionSuiteLogo.png"
      alt="Perception Suite Logo"
      width={finalWidth}
      height={finalHeight}
      className={cn('object-contain', className)}
      priority
    />
  );
};