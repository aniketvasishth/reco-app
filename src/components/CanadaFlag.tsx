import React from 'react';

interface CanadaFlagProps {
  className?: string;
}

export const CanadaFlag: React.FC<CanadaFlagProps> = ({
  className = 'w-4.5 h-3 inline-block rounded-xs overflow-hidden shadow-2xs shrink-0 align-middle -mt-0.5 border border-black/10',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 32"
      className={className}
      aria-label="Canada"
      role="img"
    >
      {/* Red Left Band */}
      <rect x="0" y="0" width="16" height="32" fill="#D80621" />
      {/* White Center Band */}
      <rect x="16" y="0" width="32" height="32" fill="#FFFFFF" />
      {/* Red Right Band */}
      <rect x="48" y="0" width="16" height="32" fill="#D80621" />
      {/* Canadian Maple Leaf */}
      <path
        fill="#D80621"
        d="M32 26.8l.6-4.5 1.5.8-.7-3.1 2.9 1.6-.2-2.2 2.3.3-1-2.1 2.5-.9-2.1-1.5 1.1-1.3-2.7.1.6-1.6-2.2.9.4-2.7-2 1.8-.5-.8-.5.8-2-1.8.4 2.7-2.2-.9.6 1.6-2.7-.1 1.1 1.3-2.1 1.5 2.5.9-1 2.1 2.3-.3-.2 2.2 2.9-1.6-.7 3.1 1.5-.8.6 4.5h-.9z"
      />
    </svg>
  );
};

export default CanadaFlag;
