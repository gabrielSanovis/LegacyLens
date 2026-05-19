/** @param {import('plop').NodePlopAPI} plop */
export default function (plop) {
  // =============================================
  // BACKEND: Gerador de Feature (Clean Architecture)
  // =============================================
  plop.setGenerator('backend-feature', {
    description: 'Gera um módulo NestJS completo (entity, use-case, controller, module)',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nome da feature (ex: project, chat, artifact):',
      },
    ],
    actions: [
      // Entity
      {
        type: 'add',
        path: 'backend/src/domain/entities/{{dashCase name}}.entity.ts',
        templateFile: 'plop-templates/backend/entity.hbs',
      },
      // Use Case
      {
        type: 'add',
        path: 'backend/src/domain/use-cases/{{dashCase name}}/create-{{dashCase name}}.use-case.ts',
        templateFile: 'plop-templates/backend/use-case.hbs',
      },
      // Controller
      {
        type: 'add',
        path: 'backend/src/api/v1/{{dashCase name}}/{{dashCase name}}.controller.ts',
        templateFile: 'plop-templates/backend/controller.hbs',
      },
      // Service
      {
        type: 'add',
        path: 'backend/src/api/v1/{{dashCase name}}/{{dashCase name}}.service.ts',
        templateFile: 'plop-templates/backend/service.hbs',
      },
      // Module
      {
        type: 'add',
        path: 'backend/src/api/v1/{{dashCase name}}/{{dashCase name}}.module.ts',
        templateFile: 'plop-templates/backend/module.hbs',
      },
    ],
  });

  // =============================================
  // FRONTEND: Gerador de Componente React
  // =============================================
  plop.setGenerator('component', {
    description: 'Gera um componente React com CSS Module',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Nome do componente (ex: ChatWindow, ActionGraph):',
      },
    ],
    actions: [
      // Component file
      {
        type: 'add',
        path: 'frontend/src/components/{{pascalCase name}}/{{pascalCase name}}.tsx',
        templateFile: 'plop-templates/frontend/component.hbs',
      },
      // CSS Module
      {
        type: 'add',
        path: 'frontend/src/components/{{pascalCase name}}/{{pascalCase name}}.module.css',
        templateFile: 'plop-templates/frontend/style.hbs',
      },
      // Barrel export
      {
        type: 'add',
        path: 'frontend/src/components/{{pascalCase name}}/index.ts',
        templateFile: 'plop-templates/frontend/index.hbs',
      },
    ],
  });
}
