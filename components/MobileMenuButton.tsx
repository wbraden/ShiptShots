'use client';

import { Menu } from 'lucide-react';

interface MobileMenuButtonProps {
  onClick: () => void;
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
      aria-label="Open menu"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
} 