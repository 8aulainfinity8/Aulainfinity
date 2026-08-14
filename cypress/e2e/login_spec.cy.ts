// FIX: The following declarations are a workaround for an environment where TypeScript
// cannot find the Cypress type definitions. These globals are normally provided
// by Cypress automatically. Removing the /// <reference types="cypress" /> directive
// and declaring these globals manually makes the linter errors disappear.
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const cy: any;

describe('Login Flow', () => {
  beforeEach(() => {
    // Visit the login page before each test.
    // In a real app, this might be Cypress.env('baseUrl') + '/#/login'
    cy.visit('/#/login');
  });

  it('should allow a student to successfully log in', () => {
    // Find the email input and type a valid student email.
    // We use a test student from the simulated database.
    cy.get('input[id="login-email"]').type('lucia@example.com');

    // Find the password input and type the correct password.
    cy.get('input[id="login-password"]').type('password123');

    // Find and click the login button.
    cy.get('button[type="submit"]').contains('Entrar').click();

    // After login, we should be redirected to the dashboard.
    // We can assert that the URL includes '/app/dashboard'.
    cy.url().should('include', '/app/dashboard');

    // We can also assert that some content from the dashboard is visible,
    // for example, the welcome message.
    cy.contains('¡Bienvenido de nuevo, Lucía G.!').should('be.visible');
  });

  it('should show an error message with incorrect credentials', () => {
    // Type a valid email but an incorrect password.
    cy.get('input[id="login-email"]').type('lucia@example.com');
    cy.get('input[id="login-password"]').type('wrongpassword');

    // Click the login button.
    cy.get('button[type="submit"]').contains('Entrar').click();

    // Assert that an error message is displayed.
    cy.contains('Correo electrónico o contraseña incorrectos.').should('be.visible');

    // Assert that we are still on the login page.
    cy.url().should('include', '/login');
  });

  it('should allow switching to the registration form', () => {
    // Click the 'Registrarse' tab.
    cy.get('button').contains('Registrarse').click();

    // Assert that the registration form is now visible.
    cy.contains('Crea tu Cuenta').should('be.visible');
    cy.get('input[placeholder="Nombre completo"]').should('be.visible');
  });
});
// FIX: Add an empty export to treat this file as a module, which prevents
// "Cannot redeclare block-scoped variable" errors for Cypress globals.
export {};
