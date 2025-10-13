
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    variant?: 'default' | 'icon';
    className?: string;
}

export function Logo({ variant = 'default', className }: LogoProps) {
  if (variant === 'icon') {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <Image src="/logo-icon.png" alt="opendesk icon" width={32} height={32} />
        </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image src="/logo-full.png" alt="opendesk logo" width={120} height={32} />
    </div>
  );
}
