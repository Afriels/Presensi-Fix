
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`border-b pb-4 mb-4 ${className}`}>
        {children}
    </div>
  );
};

export const CardTitle: React.FC<CardProps> = ({ children, className }) => {
    return (
        <h2 className={`text-xl font-semibold text-gray-800 ${className}`}>
            {children}
        </h2>
    );
};


export default Card;