// Workaround for Cypress types
declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const cy: any;

describe('Student User Flow', () => {
  beforeEach(() => {
    // Log in as a student before each test in this suite
    cy.visit('/#/login');
    cy.get('input[id="login-email"]').type('lucia@example.com');
    cy.get('input[id="login-password"]').type('password123');
    cy.get('button[type="submit"]').contains('Entrar').click();
    cy.url().should('include', '/app/dashboard');
  });

  it('should update progress after watching a video', () => {
    // 1. Check initial state on dashboard
    // The test user 'lucia' starts with 5 watched videos.
    cy.contains('Vídeos Vistos').parent().parent().contains('5').should('be.visible');

    // 2. Navigate to a new video
    // 'eso_m_2' is "Teorema de Pitágoras" and is not in lucia's initial watched list.
    cy.visit('/#/app/video/eso_m_2');
    cy.contains('Teorema de Pitágoras').should('be.visible');

    // 3. Go back to dashboard and verify progress
    cy.visit('/#/app/dashboard');
    
    // The count should now be 6
    cy.contains('Vídeos Vistos').parent().parent().contains('6').should('be.visible');

    // The recently watched list should now contain the new video
    cy.contains('Vistos Recientemente')
      .parent()
      .contains('Teorema de Pitágoras')
      .should('be.visible');
  });

  it('should be able to send a message to the AI Tutor and receive a response', () => {
    // 1. Navigate to the AI Tutor page
    cy.visit('/#/app/tutor-ia');

    // 2. Type a message and send
    const userMessage = '¿Puedes explicarme las leyes de Newton?';
    cy.get('textarea[placeholder="Escribe tu duda aquí..."]').type(userMessage);
    cy.get('button[aria-label="Enviar mensaje"]').click();

    // 3. Assert the user's message appears in the chat
    cy.contains(userMessage).should('be.visible');

    // 4. Assert that a response from the model appears.
    // We wait for the loading indicator to disappear and for the response bubble to show up.
    // The mock API has a delay, so we might need to increase the timeout.
    cy.get('div[class*="bg-white text-black rounded-bl-none border"]', { timeout: 10000 }).should('not.contain', 'Pensando...');
    // Check for any response from the model. The mock returns a static response.
    // The `getTutorResponse` mock returns `response.text`, so we check that a `model` role div exists.
    cy.get('div[class*="bg-white text-black rounded-bl-none border"]').should('exist');
  });
});
// FIX: Add an empty export to treat this file as a module, which prevents
// "Cannot redeclare block-scoped variable" errors for Cypress globals.
export {};