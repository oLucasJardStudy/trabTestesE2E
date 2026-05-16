const VALID_EMAIL = "aluno@teste.com";
const VALID_PASSWORD = "Senha123!";

describe("Login E2E", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("login com sucesso: redireciona para /home e exibe mensagem", () => {
    cy.get('[data-cy="email-input"]').type(VALID_EMAIL);
    cy.get('[data-cy="password-input"]').type(VALID_PASSWORD);
    cy.get('[data-cy="submit-btn"]').click();
    cy.url().should("include", "/home");
    cy.get('[data-cy="success-message"]').should(
      "contain",
      "Login efetuado com sucesso!"
    );
  });

  it("login com erro: permanece em /login e exibe Credenciais inválidas", () => {
    cy.get('[data-cy="email-input"]').type("naoexiste@teste.com");
    cy.get('[data-cy="password-input"]').type("senhaerrada");
    cy.get('[data-cy="submit-btn"]').click();
    cy.url().should("include", "/login");
    cy.get('[data-cy="api-error"]').should("contain", "Credenciais inválidas");
  });

  it("botão Entrar desabilitado até ambos os campos preenchidos", () => {
    cy.get('[data-cy="submit-btn"]').should("be.disabled");
    cy.get('[data-cy="email-input"]').type(VALID_EMAIL);
    cy.get('[data-cy="submit-btn"]').should("be.disabled");
    cy.get('[data-cy="password-input"]').type(VALID_PASSWORD);
    cy.get('[data-cy="submit-btn"]').should("not.be.disabled");
  });

  it("campos obrigatórios ao enviar formulário vazio", () => {
    cy.get('[data-cy="login-form"]').submit();
    cy.get('[data-cy="email-error"]').should("contain", "E-mail é obrigatório");
    cy.get('[data-cy="password-error"]').should("contain", "Senha é obrigatória");
  });

  it("e-mail existente e senha incorreta exibe Credenciais inválidas", () => {
    cy.get('[data-cy="email-input"]').type(VALID_EMAIL);
    cy.get('[data-cy="password-input"]').type("senha-totalmente-errada");
    cy.get('[data-cy="submit-btn"]').click();
    cy.url().should("include", "/login");
    cy.get('[data-cy="api-error"]').should("contain", "Credenciais inválidas");
  });

  it("após erro de API, login válido redireciona para /home", () => {
    cy.get('[data-cy="email-input"]').type("inexistente@teste.com");
    cy.get('[data-cy="password-input"]').type("qualquer");
    cy.get('[data-cy="submit-btn"]').click();
    cy.get('[data-cy="api-error"]').should("be.visible");

    cy.get('[data-cy="email-input"]').clear().type(VALID_EMAIL);
    cy.get('[data-cy="password-input"]').clear().type(VALID_PASSWORD);
    cy.get('[data-cy="submit-btn"]').click();
    cy.url().should("include", "/home");
    cy.get('[data-cy="success-message"]').should(
      "contain",
      "Login efetuado com sucesso!"
    );
  });

  it("aceita e-mail com espaços laterais (trim no envio)", () => {
    cy.get('[data-cy="email-input"]').type(`  ${VALID_EMAIL}  `);
    cy.get('[data-cy="password-input"]').type(VALID_PASSWORD);
    cy.get('[data-cy="submit-btn"]').click();
    cy.url().should("include", "/home");
  });

  it("só senha preenchida: exige e-mail obrigatório", () => {
    cy.get('[data-cy="password-input"]').type("algumaSenha");
    cy.get('[data-cy="login-form"]').submit();
    cy.get('[data-cy="email-error"]').should("contain", "E-mail é obrigatório");
    cy.get('[data-cy="password-error"]').should("not.exist");
  });

  it("só e-mail preenchido: exige senha obrigatória", () => {
    cy.get('[data-cy="email-input"]').type(VALID_EMAIL);
    cy.get('[data-cy="login-form"]').submit();
    cy.get('[data-cy="password-error"]').should("contain", "Senha é obrigatória");
    cy.get('[data-cy="email-error"]').should("not.exist");
  });

  it("na Home, Voltar ao login navega para /login", () => {
    cy.get('[data-cy="email-input"]').type(VALID_EMAIL);
    cy.get('[data-cy="password-input"]').type(VALID_PASSWORD);
    cy.get('[data-cy="submit-btn"]').click();
    cy.url().should("include", "/home");

    cy.get('[data-cy="back-login"]').click();
    cy.url().should("include", "/login");
    cy.contains("h1", "Entrar");
  });
});

describe("Rotas da aplicação", () => {
  it("/ redireciona para /login", () => {
    cy.visit("/");
    cy.url().should("include", "/login");
  });

  it("URL inexistente redireciona para /login", () => {
    cy.visit("/pagina-inexistente-xyz");
    cy.url().should("include", "/login");
  });
});

describe("API (smoke)", () => {
  it("GET /health responde 200", () => {
    cy.request("GET", "http://127.0.0.1:3000/health")
      .its("status")
      .should("eq", 200);
  });

  it("POST /login com credenciais válidas retorna 200 e mensagem de sucesso", () => {
    cy.request({
      method: "POST",
      url: "http://127.0.0.1:3000/login",
      body: { email: VALID_EMAIL, password: VALID_PASSWORD },
      headers: { "Content-Type": "application/json" },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.message).to.eq("Login efetuado com sucesso!");
    });
  });

  it("POST /login com credenciais inválidas retorna 401", () => {
    cy.request({
      method: "POST",
      url: "http://127.0.0.1:3000/login",
      body: { email: VALID_EMAIL, password: "errado" },
      headers: { "Content-Type": "application/json" },
      failOnStatusCode: false,
    })
      .its("status")
      .should("eq", 401);
  });
});
