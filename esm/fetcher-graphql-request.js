import { generateInfiniteQueryKey, generateMutationKey, generateQueryKey, generateQueryVariablesSignature, } from './variables-generator.js';
export class GraphQLRequestClientFetcher {
    constructor(visitor) {
        this.visitor = visitor;
    }
    generateFetcherImplementaion() {
        return `
function fetcher<TData, TVariables>(client: GraphQLClient, query: string, variables?: TVariables, headers?: RequestInit['headers']) {
  return async (): Promise<TData> => client.request<TData, TVariables>(query, variables, headers);
}`;
    }
    generateInfiniteQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = generateQueryVariablesSignature(hasRequiredVariables, operationVariablesTypes);
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        this.visitor.imports.add(`${typeImport} { GraphQLClient } from 'graphql-request';`);
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.infiniteQuery.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.infiniteQuery.options);
        const options = `options?: ${hookConfig.infiniteQuery.options}<${operationResultType}, TError, TData>`;
        return `export const useInfinite${operationName} = <
      TData = ${operationResultType},
      TError = ${this.visitor.config.errorType}
    >(
      _pageParamKey: keyof ${operationVariablesTypes},
      client: GraphQLClient,
      ${variables},
      ${options},
      headers?: RequestInit['headers']
    ) =>
    ${hookConfig.infiniteQuery.hook}<${operationResultType}, TError, TData>(
      ${generateInfiniteQueryKey(node, hasRequiredVariables)},
      (metaData) => fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, {...variables, ...(metaData.pageParam ?? {})}, headers)(),
      options
    );`;
    }
    generateQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = generateQueryVariablesSignature(hasRequiredVariables, operationVariablesTypes);
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        this.visitor.imports.add(`${typeImport} { GraphQLClient } from 'graphql-request';`);
        this.visitor.imports.add(`${typeImport} { RequestInit } from 'graphql-request/dist/types.dom';`);
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.query.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.query.options);
        const options = `options?: ${hookConfig.query.options}<${operationResultType}, TError, TData>`;
        return `export const use${operationName} = <
      TData = ${operationResultType},
      TError = ${this.visitor.config.errorType}
    >(
      client: GraphQLClient,
      ${variables},
      ${options},
      headers?: RequestInit['headers']
    ) =>
    ${hookConfig.query.hook}<${operationResultType}, TError, TData>(
      ${generateQueryKey(node, hasRequiredVariables)},
      fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, variables, headers),
      options
    );`;
    }
    generateMutationHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = `variables?: ${operationVariablesTypes}`;
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        this.visitor.imports.add(`${typeImport} { GraphQLClient } from 'graphql-request';`);
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.mutation.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.mutation.options);
        const options = `options?: ${hookConfig.mutation.options}<${operationResultType}, TError, ${operationVariablesTypes}, TContext>`;
        return `export const use${operationName} = <
      TError = ${this.visitor.config.errorType},
      TContext = unknown
    >(
      client: GraphQLClient,
      ${options},
      headers?: RequestInit['headers']
    ) =>
    ${hookConfig.mutation.hook}<${operationResultType}, TError, ${operationVariablesTypes}, TContext>(
      ${generateMutationKey(node)},
      (${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, variables, headers)(),
      options
    );`;
    }
    generateFetcherFetch(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = generateQueryVariablesSignature(hasRequiredVariables, operationVariablesTypes);
        const typeImport = this.visitor.config.useTypeImports ? 'import type' : 'import';
        this.visitor.imports.add(`${typeImport} { RequestInit } from 'graphql-request/dist/types.dom';`);
        return `\nuse${operationName}.fetcher = (client: GraphQLClient, ${variables}, headers?: RequestInit['headers']) => fetcher<${operationResultType}, ${operationVariablesTypes}>(client, ${documentVariableName}, variables, headers);`;
    }
}
