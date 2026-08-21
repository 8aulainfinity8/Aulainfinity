/**
 * @vitest-environment jsdom
 */
// Note: In a real setup, these would be imported from '@testing-library/react', 'vitest',
// and '@testing-library/jest-dom' and would require installing them as dev dependencies.
// This file is for demonstration purposes.
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';

import { PasswordCriteriaItem } from '../components/PasswordCriteriaItem';

describe('PasswordCriteriaItem Component', () => {
  it('should render correctly when the criteria is not met (invalid)', () => {
    // 1. Arrange: Set up the component with props for the "invalid" state.
    const text = "Al menos 8 caracteres";
    render(<PasswordCriteriaItem isValid={false} text={text} />);

    // 2. Act: Find the elements on the screen.
    const textElement = screen.getByText(text);
    const containerDiv = textElement.parentElement;

    // 3. Assert: Check if the component has the correct content and styles.
    expect(textElement).toBeInTheDocument();
    // It should have gray text color for the invalid state.
    expect(containerDiv).toHaveClass('text-gray-500');
    // It should not have the green color class.
    expect(containerDiv).not.toHaveClass('text-green-600');
  });

  it('should render correctly when the criteria is met (valid)', () => {
    // 1. Arrange: Set up the component with props for the "valid" state.
    const text = "Una letra mayúscula (A-Z)";
    render(<PasswordCriteriaItem isValid={true} text={text} />);
    
    // 2. Act: Find the elements on the screen.
    const textElement = screen.getByText(text);
    const containerDiv = textElement.parentElement;

    // 3. Assert: Check if the component has the correct content and styles.
    expect(textElement).toBeInTheDocument();
    // It should have green text color for the valid state.
    expect(containerDiv).toHaveClass('text-green-600');
    // It should not have the gray color class.
    expect(containerDiv).not.toHaveClass('text-gray-500');
  });
});
