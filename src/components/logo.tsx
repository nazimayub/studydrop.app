import Image from 'next/image';
import { cn } from '@/lib/utils';
import { BrainCircuit } from 'lucide-react';

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
      <Image src="/logo-icon.png" alt="opendesk icon" width={32} height={32} />
      <span className="text-xl font-bold font-headline">opendesk</span>
    </div>
  );
}
