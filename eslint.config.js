// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const i18nextPlugin = require("eslint-plugin-i18next");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ["src/modules/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": [
              "../domain", "../domain/**", "../../domain/**", "../../../domain/**",
              "../application", "../application/**", "../../application/**", "../../../application/**",
              "../infrastructure", "../infrastructure/**", "../../infrastructure/**", "../../../infrastructure/**",
              "../presentation", "../presentation/**", "../../presentation/**", "../../../presentation/**"
            ],
            "message": "Anti-Bypass: Katmanlar arası geçişlerde relative path kullanımı yasaktır. TSConfig alias'larını (@domain, @application vb.) kullanın."
          }
        ]
      }]
    }
  },
  {
    files: ["src/modules/*/domain/**/*.ts", "src/modules/*/domain/**/*.tsx", "src/modules/*/domain/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        "paths": [
          { "name": "react", "message": "Domain Purity: Domain katmanında UI kütüphaneleri (react) kullanılamaz." },
          { "name": "react-native", "message": "Domain Purity: Domain katmanında UI kütüphaneleri (react-native) kullanılamaz." },
          { "name": "axios", "message": "Domain Purity: Domain katmanında HTTP istemcileri kullanılamaz." }
        ],
        "patterns": [
          { "group": ["../*"], "message": "Domain Purity: Domain katmanı dış katmanlardan hiçbir şey import edemez." },
          { "group": ["@application/*", "@infrastructure/*", "@presentation/*", "@/*"], "message": "Domain Purity: Domain katmanı dış katmanlardan hiçbir şey import edemez." },
          { "group": ["*supabase*", "@supabase/*"], "message": "Domain Purity: Domain katmanında altyapı/veritabanı bağımlılıkları barınamaz." }
        ]
      }]
    }
  },
  {
    files: ["src/modules/*/application/**/*.ts", "src/modules/*/application/**/*.tsx", "src/modules/*/application/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        "paths": [
          { "name": "react", "message": "Application layer cannot use React Hooks." }
        ],
        "patterns": [
          { "group": ["../infrastructure/*", "../presentation/*", "@infrastructure/*", "@presentation/*"], "message": "Application layer cannot import from infrastructure or presentation." }
        ]
      }]
    }
  },
  {
    files: ["src/modules/*/presentation/screens/**/*.{js,jsx,tsx}", "src/modules/*/presentation/components/**/*.{js,jsx,tsx}"],
    plugins: {
      "i18next": i18nextPlugin
    },
    rules: {
      "i18next/no-literal-string": ["error", { "markupOnly": true }]
    }
  }
]);
