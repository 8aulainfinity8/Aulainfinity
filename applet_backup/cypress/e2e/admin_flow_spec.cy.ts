// Workaround for Cypress types
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const cy: any;

describe('Admin User Flow', () => {
  beforeEach(() => {
    // Log in as an admin before each test
    cy.visit('/#/login');
    cy.contains('Acceso para administradores').click();
    cy.get('input[id="admin-username"]').type('admin');
    cy.get('input[id="admin-password"]').type('password');
    cy.get('button[type="submit"]').contains('Entrar').click();
    cy.url().should('include', '/admin/dashboard');
  });

  it('should successfully change and persist a setting', () => {
    // 1. Navigate to the settings page
    cy.visit('/#/admin/settings');

    // 2. Find the input, clear it, and type a new value
    const newPrice = '25';
    cy.get('input[id="subscriptionPrice"]')
      .should('be.visible')
      .clear()
      .type(newPrice);

    // 3. Save the changes
    cy.get('button[type="submit"]').contains('Guardar Cambios').click();

    // 4. Assert that a success toast appears
    cy.contains('Ajustes guardados con éxito').should('be.visible');

    // 5. Reload the page to check for persistence
    cy.reload();

    // 6. Assert that the input field still contains the new value
    cy.get('input[id="subscriptionPrice"]').should('have.value', newPrice);
  });
});
// FIX: Add an empty export to treat this file as a module, which prevents
// "Cannot redeclare block-scoped variable" errors for Cypress globals.
export {};