
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: "./schema.graphql",
  generates: {
    "src/__generated__/types.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        avoidOptionals: {
          query: true,
          mutation: true,
          subscription: true,
        }
      },
    },
    "./graphql.schema.json": {
      plugins: ["introspection"]
    },

  }
};

export default config;
