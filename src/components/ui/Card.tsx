
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`border-b border-slate-200 pb-4 mb-6 ${className}`}>
        {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
    return (
        <h2 className={`text-lg font-semibold text-slate-900 ${className}`}>
            {children}
        </h2>
    );
};


export default Card;