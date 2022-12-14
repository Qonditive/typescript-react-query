"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HardcodedFetchFetcher = void 0;
const variables_generator_js_1 = require("./variables-generator.js");
class HardcodedFetchFetcher {
    constructor(visitor, config) {
        this.visitor = visitor;
        this.config = config;
    }
    getEndpoint() {
        try {
            new URL(this.config.endpoint);
            return JSON.stringify(this.config.endpoint);
        }
        catch (e) {
            return `${this.config.endpoint} as string`;
        }
    }
    getFetchParams() {
        let fetchParamsPartial = '';
        if (this.config.fetchParams) {
            const fetchParamsString = typeof this.config.fetchParams === 'string' ? this.config.fetchParams : JSON.stringify(this.config.fetchParams);
            fetchParamsPartial = `\n    ...(${fetchParamsString}),`;
        }
        return `    method: "POST",${fetchParamsPartial}`;
    }
    generateFetcherImplementaion() {
        return `
function fetcher<TData, TVariables>(query: string, variables?: TVariables) {
  return async (): Promise<TData> => {
    const res = await fetch(${this.getEndpoint()}, {
${this.getFetchParams()}
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      const { message } = json.errors[0];

      throw new Error(message);
    }

    return json.data;
  }
}`;
    }
    generateInfiniteQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = (0, variables_generator_js_1.generateQueryVariablesSignature)(hasRequiredVariables, operationVariablesTypes);
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.infiniteQuery.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.infiniteQuery.options);
        const options = `options?: ${hookConfig.infiniteQuery.options}<${operationResultType}, TError, TData>`;
        return `export const useInfinite${operationName} = <
      TData = ${operationResultType},
      TError = ${this.visitor.config.errorType}
    >(
      _pageParamKey: keyof ${operationVariablesTypes},
      ${variables},
      ${options}
    ) =>
    ${hookConfig.infiniteQuery.hook}<${operationResultType}, TError, TData>(
      ${(0, variables_generator_js_1.generateInfiniteQueryKey)(node, hasRequiredVariables)},
      (metaData) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, {...variables, ...(metaData.pageParam ?? {})})(),
      options
    );`;
    }
    generateQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = (0, variables_generator_js_1.generateQueryVariablesSignature)(hasRequiredVariables, operationVariablesTypes);
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.query.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.query.options);
        const options = `options?: ${hookConfig.query.options}<${operationResultType}, TError, TData>`;
        return `export const use${operationName} = <
      TData = ${operationResultType},
      TError = ${this.visitor.config.errorType}
    >(
      ${variables},
      ${options}
    ) =>
    ${hookConfig.query.hook}<${operationResultType}, TError, TData>(
      ${(0, variables_generator_js_1.generateQueryKey)(node, hasRequiredVariables)},
      fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables),
      options
    );`;
    }
    generateMutationHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = `variables?: ${operationVariablesTypes}`;
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.mutation.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.mutation.options);
        const options = `options?: ${hookConfig.mutation.options}<${operationResultType}, TError, ${operationVariablesTypes}, TContext>`;
        return `export const use${operationName} = <
      TError = ${this.visitor.config.errorType},
      TContext = unknown
    >(${options}) =>
    ${hookConfig.mutation.hook}<${operationResultType}, TError, ${operationVariablesTypes}, TContext>(
      ${(0, variables_generator_js_1.generateMutationKey)(node)},
      (${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables)(),
      options
    );`;
    }
    generateFetcherFetch(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = (0, variables_generator_js_1.generateQueryVariablesSignature)(hasRequiredVariables, operationVariablesTypes);
        return `\nuse${operationName}.fetcher = (${variables}) => fetcher<${operationResultType}, ${operationVariablesTypes}>(${documentVariableName}, variables);`;
    }
}
exports.HardcodedFetchFetcher = HardcodedFetchFetcher;
