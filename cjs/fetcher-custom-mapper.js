"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomMapperFetcher = void 0;
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const variables_generator_js_1 = require("./variables-generator.js");
class CustomMapperFetcher {
    constructor(visitor, customFetcher) {
        this.visitor = visitor;
        if (typeof customFetcher === 'string') {
            customFetcher = { func: customFetcher };
        }
        this._mapper = (0, visitor_plugin_common_1.parseMapper)(customFetcher.func);
        this._isReactHook = customFetcher.isReactHook;
    }
    getFetcherFnName(operationResultType, operationVariablesTypes) {
        return `${this._mapper.type}<${operationResultType}, ${operationVariablesTypes}>`;
    }
    generateFetcherImplementaion() {
        if (this._mapper.isExternal) {
            return (0, visitor_plugin_common_1.buildMapperImport)(this._mapper.source, [
                {
                    identifier: this._mapper.type,
                    asDefault: this._mapper.default,
                },
            ], this.visitor.config.useTypeImports);
        }
        return null;
    }
    generateInfiniteQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = `variables${hasRequiredVariables ? '' : '?'}: ${operationVariablesTypes}`;
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.infiniteQuery.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.infiniteQuery.options);
        const options = `options?: ${hookConfig.infiniteQuery.options}<${operationResultType}, TError, TData>`;
        const typedFetcher = this.getFetcherFnName(operationResultType, operationVariablesTypes);
        const implHookOuter = this._isReactHook ? `const query = ${typedFetcher}(${documentVariableName})` : '';
        const impl = this._isReactHook
            ? `(metaData) => query({...variables, ...(metaData.pageParam ?? {})}, metaData)`
            : `(metaData) => ${typedFetcher}(${documentVariableName}, {...variables, ...(metaData.pageParam ?? {})}, metaData)()`;
        return `export const useInfinite${operationName} = <
      TData = ${operationResultType},
      TError = ${this.visitor.config.errorType}
    >(
      ${variables},
      ${options}
    ) =>{
    ${implHookOuter}
    return ${hookConfig.infiniteQuery.hook}<${operationResultType}, TError, TData>(
      ${(0, variables_generator_js_1.generateInfiniteQueryKey)(node, hasRequiredVariables)},
      ${impl},
      options
    )};`;
    }
    generateQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = `variables${hasRequiredVariables ? '' : '?'}: ${operationVariablesTypes}`;
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.query.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.query.options);
        const options = `options?: ${hookConfig.query.options}<${operationResultType}, TError, TData>`;
        const typedFetcher = this.getFetcherFnName(operationResultType, operationVariablesTypes);
        const impl = this._isReactHook
            ? `${typedFetcher}(${documentVariableName}).bind(null, variables)`
            : `${typedFetcher}(${documentVariableName}, variables)`;
        return `export const use${operationName} = <
      TData = ${operationResultType},
      TError = ${this.visitor.config.errorType}
    >(
      ${variables},
      ${options}
    ) =>
    ${hookConfig.query.hook}<${operationResultType}, TError, TData>(
      ${(0, variables_generator_js_1.generateQueryKey)(node, hasRequiredVariables)},
      ${impl},
      options
    );`;
    }
    generateMutationHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        const variables = `variables?: ${operationVariablesTypes}`;
        const hookConfig = this.visitor.queryMethodMap;
        this.visitor.reactQueryHookIdentifiersInUse.add(hookConfig.mutation.hook);
        this.visitor.reactQueryOptionsIdentifiersInUse.add(hookConfig.mutation.options);
        const options = `options?: ${hookConfig.mutation.options}<${operationResultType}, TError, ${operationVariablesTypes}, TContext>`;
        const typedFetcher = this.getFetcherFnName(operationResultType, operationVariablesTypes);
        const impl = this._isReactHook
            ? `${typedFetcher}(${documentVariableName})`
            : `(${variables}) => ${typedFetcher}(${documentVariableName}, variables)()`;
        return `export const use${operationName} = <
      TError = ${this.visitor.config.errorType},
      TContext = unknown
    >(${options}) =>
    ${hookConfig.mutation.hook}<${operationResultType}, TError, ${operationVariablesTypes}, TContext>(
      ${(0, variables_generator_js_1.generateMutationKey)(node)},
      ${impl},
      options
    );`;
    }
    generateFetcherFetch(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        // We can't generate a fetcher field since we can't call react hooks outside of a React Fucntion Component
        // Related: https://reactjs.org/docs/hooks-rules.html
        if (this._isReactHook)
            return '';
        const variables = `variables${hasRequiredVariables ? '' : '?'}: ${operationVariablesTypes}`;
        const typedFetcher = this.getFetcherFnName(operationResultType, operationVariablesTypes);
        const impl = `${typedFetcher}(${documentVariableName}, variables, options)`;
        return `\nuse${operationName}.fetcher = (${variables}, options?: RequestInit['headers']) => ${impl};`;
    }
}
exports.CustomMapperFetcher = CustomMapperFetcher;
