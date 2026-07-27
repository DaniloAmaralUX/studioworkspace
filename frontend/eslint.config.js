import jsxA11y from 'eslint-plugin-jsx-a11y'
import tsParser from '@typescript-eslint/parser'

// Lint ESCOPADO da F5: só jsx-a11y, só nos componentes do ciclo core
// (achar → decidir → abrir). Lint de repo inteiro é churn gigante — fica
// para quando houver gatilho (ver docs/plans/automode-2026-07-24.md § F5).
export default [
  // ESLint 9 não ignora dist/ por padrão: sem isto, `eslint .` parseia os
  // bundles minificados e um artefato improvável quebra o gate por motivo
  // alheio a a11y.
  { ignores: ['dist'] },
  {
    files: [
      'src/routes/ProjectsScreen.tsx',
      'src/routes/ProjectDetail.tsx',
      'src/components/ProjectRow.tsx',
      'src/components/NextActionInput.tsx',
      'src/components/OpenWithButtons.tsx',
      'src/components/AddProjectDialog.tsx',
      'src/components/EmptyState.tsx',
    ],
    plugins: { 'jsx-a11y': jsxA11y },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...jsxA11y.configs.recommended.rules,
    },
  },
]
