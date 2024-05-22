describe('Whole file campaign creation', () => {
    beforeEach(() => {
        cy.session_login('admin', 'osmose29')
    })

    it('create', () => {
        cy.contains('New annotation campaign', {matchCase: false}).click()
        cy.get('#cac-name').type(Cypress.env('wholeFileCampaign'))
        cy.get("#cac-desc").type("Testing campaign creation");
        cy.get("#cac-dataset").select("Test Dataset");
        cy.get("#cac-spectro").select("4096_4096_90");
        cy.get("#cac-annotation-set").select("Test SPM campaign");
        cy.get("#cac-confidence-indicator-set").select("Confident/NotConfident");
        cy.get("#cac-annotation-mode").select("Whole file");
        cy.get("#cac-user").select("admin@osmose.xyz");
        cy.get("#cac-user").select("TestUser1@osmose.xyz");
        cy.get("#cac-user").select("TestUser2@osmose.xyz");
        cy.get("#cac-annotation-method").select("Sequential");
        cy.get('input[type=submit]').click(); // cy.contains('submit', {matchCase: false}).click()
        cy.get("h1").should('include.text', 'Annotation Campaigns')
    })

    describe('should be as created', () => {
        it('name', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).click();
            cy.get("h1").should('include.text', Cypress.env('wholeFileCampaign'))
        })

        it('description', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).click();
            cy.contains('Description').parentsUntil('div').parent().should('include.text', "Testing campaign creation")
        })

        it('dataset', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).parentsUntil('tr').parent().contains('My tasks').click()
            cy.get("tbody").should('include.text', "Test Dataset");
        })

        it('spectro', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).parentsUntil('tr').parent().contains('My tasks').click()
            cy.contains('Task link').click()
            cy.get('select:first').should('have.text', 'nfft: 4096 / winsize: 4096 / overlap: 90')
        })

        it('annotation set', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).parentsUntil('tr').parent()
                .contains("Test SPM campaign")
        })

        it('confidence set', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).parentsUntil('tr').parent()
                .contains("Confident/NotConfident")
        })

        it('annotation mode', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).parentsUntil('tr').parent().contains('My tasks').click()
            cy.contains('Task link').click()
            cy.get('.card').should('include.text', 'Presence / Absence');
        })

        //TODO: check annotation method = "Sequential"
        // Not done for now because random should soon be removed

        it('has 3 annotators', () => {
            cy.contains(Cypress.env('wholeFileCampaign')).click();

            cy.get("h1").should('include.text', Cypress.env('wholeFileCampaign'))
            cy.get("tbody").within(() => {
                cy.get('tr').should('have.length', 3)
            })

            cy.get('tr').should('include.text', 'admin@osmose.xyz')
            cy.get('tr').should('include.text', 'TestUser1@osmose.xyz')
            cy.get('tr').should('include.text', 'TestUser1@osmose.xyz')
        })
    })
})
