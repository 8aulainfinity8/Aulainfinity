
import React from 'react';
import { CheckCircleIcon, XCircleIcon } from './icons';

export const PasswordCriteriaItem: React.FC<{ isValid: boolean; text: string }> = React.memo(({ isValid, text }) => (
    <div className={`flex items-center text-xs transition-colors duration-300 ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
        {isValid ? <CheckCircleIcon className="w-4 h-4 mr-2" /> : <XCircleIcon className="w-4 h-4 mr-2" />}
        <span>{text}</span>
    </div>
));
