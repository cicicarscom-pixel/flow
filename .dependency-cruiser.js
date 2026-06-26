/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-layer-isolation',
      comment: 'Domain layer cannot depend on application, infrastructure, or presentation layers.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/domain/' },
      to: { path: '^src/modules/[^/]+/(application|infrastructure|presentation)/' }
    },
    {
      name: 'application-layer-isolation',
      comment: 'Application layer cannot depend on infrastructure or presentation layers.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/application/' },
      to: { path: '^src/modules/[^/]+/(infrastructure|presentation)/' }
    },
    {
      name: 'infrastructure-layer-isolation',
      comment: 'Infrastructure layer cannot depend on presentation layer.',
      severity: 'error',
      from: { path: '^src/modules/[^/]+/infrastructure/' },
      to: { path: '^src/modules/[^/]+/presentation/' }
    },
    {
      name: 'cross-module-isolation',
      comment: 'Modules cannot deeply import from other modules. They must use the public API (index.ts).',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: { 
        path: '^src/modules/([^/]+)/',
        pathNot: '^src/modules/$1/|^src/modules/[^/]+/index\\.ts$'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    }
  }
};
