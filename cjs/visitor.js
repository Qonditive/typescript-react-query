"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactQueryVisitor = void 0;
const tslib_1 = require("tslib");
const visitor_plugin_common_1 = require("@graphql-codegen/visitor-plugin-common");
const variables_generator_js_1 = require("./variables-generator.js");
const fetcher_custom_mapper_js_1 = require("./fetcher-custom-mapper.js");
const fetcher_fetch_js_1 = require("./fetcher-fetch.js");
const fetcher_graphql_request_js_1 = require("./fetcher-graphql-request.js");
const fetcher_fetch_hardcoded_js_1 = require("./fetcher-fetch-hardcoded.js");
const auto_bind_1 = tslib_1.__importDefault(require("auto-bind"));
const change_case_all_1 = require("change-case-all");
class ReactQueryVisitor extends visitor_plugin_common_1.ClientSideBaseVisitor {
    constructor(schema, fragments, rawConfig, documents) {
        super(schema, fragments, rawConfig, {
            documentMode: visitor_plugin_common_1.DocumentMode.string,
            errorType: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.errorType, 'unknown'),
            exposeDocument: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeDocument, false),
            exposeQueryKeys: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeQueryKeys, false),
            exposeMutationKeys: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeMutationKeys, false),
            exposeFetcher: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.exposeFetcher, false),
            addInfiniteQuery: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.addInfiniteQuery, false),
            legacyMode: (0, visitor_plugin_common_1.getConfigValue)(rawConfig.legacyMode, false),
        });
        this.rawConfig = rawConfig;
        this.reactQueryHookIdentifiersInUse = new Set();
        this.reactQueryOptionsIdentifiersInUse = new Set();
        this.queryMethodMap = {
            infiniteQuery: {
                hook: 'useInfiniteQuery',
                options: 'UseInfiniteQueryOptions',
            },
            query: {
                hook: 'useQuery',
                options: 'UseQueryOptions',
            },
            mutation: {
                hook: 'useMutation',
                options: 'UseMutationOptions',
            },
        };
        this._externalImportPrefix = this.config.importOperationTypesFrom ? `${this.config.importOperationTypesFrom}.` : '';
        this._documents = documents;
        this.fetcher = this.createFetcher(rawConfig.fetcher || 'fetch');
        (0, auto_bind_1.default)(this);
    }
    get imports() {
        return this._imports;
    }
    createFetcher(raw) {
        if (raw === 'fetch') {
            return new fetcher_fetch_js_1.FetchFetcher(this);
        }
        if (typeof raw === 'object' && 'endpoint' in raw) {
            return new fetcher_fetch_hardcoded_js_1.HardcodedFetchFetcher(this, raw);
        }
        if (raw === 'graphql-request') {
            return new fetcher_graphql_request_js_1.GraphQLRequestClientFetcher(this);
        }
        return new fetcher_custom_mapper_js_1.CustomMapperFetcher(this, raw);
    }
    get hasOperations() {
        return this._collectedOperations.length > 0;
    }
    getImports() {
        const baseImports = super.getImports();
        if (!this.hasOperations) {
            return baseImports;
        }
        const hookAndTypeImports = [
            ...Array.from(this.reactQueryHookIdentifiersInUse),
            ...Array.from(this.reactQueryOptionsIdentifiersInUse).map(identifier => `${this.config.useTypeImports ? 'type ' : ''}${identifier}`),
        ];
        const moduleName = this.config.legacyMode ? 'react-query' : '@tanstack/react-query';
        return [...baseImports, `import { ${hookAndTypeImports.join(', ')} } from '${moduleName}';`];
    }
    getFetcherImplementation() {
        return this.fetcher.generateFetcherImplementaion();
    }
    _getHookSuffix(name, operationType) {
        if (this.config.omitOperationSuffix) {
            return '';
        }
        if (!this.config.dedupeOperationSuffix) {
            return (0, change_case_all_1.pascalCase)(operationType);
        }
        if (name.includes('Query') || name.includes('Mutation') || name.includes('Subscription')) {
            return '';
        }
        return (0, change_case_all_1.pascalCase)(operationType);
    }
    buildOperation(node, documentVariableName, operationType, operationResultType, operationVariablesTypes, hasRequiredVariables) {
        var _a, _b;
        const nodeName = (_b = (_a = node.name) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : '';
        const suffix = this._getHookSuffix(nodeName, operationType);
        const operationName = this.convertName(nodeName, {
            suffix,
            useTypesPrefix: false,
            useTypesSuffix: false,
        });
        operationResultType = this._externalImportPrefix + operationResultType;
        operationVariablesTypes = this._externalImportPrefix + operationVariablesTypes;
        if (operationType === 'Query') {
            let query = this.fetcher.generateQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables);
            if (this.config.exposeDocument) {
                query += `\nuse${operationName}.document = ${documentVariableName};\n`;
            }
            if (this.config.exposeQueryKeys) {
                query += `\n${(0, variables_generator_js_1.generateQueryKeyMaker)(node, operationName, operationVariablesTypes, hasRequiredVariables)};\n`;
            }
            if (this.config.addInfiniteQuery) {
                query += `\n${this.fetcher.generateInfiniteQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables)}\n`;
                if (this.config.exposeQueryKeys) {
                    query += `\n${(0, variables_generator_js_1.generateInfiniteQueryKeyMaker)(node, operationName, operationVariablesTypes, hasRequiredVariables)};\n`;
                }
            }
            // The reason we're looking at the private field of the CustomMapperFetcher to see if it's a react hook
            // is to prevent calling generateFetcherFetch for each query since all the queries won't be able to generate
            // a fetcher field anyways.
            if (this.config.exposeFetcher && !this.fetcher._isReactHook) {
                query += this.fetcher.generateFetcherFetch(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables);
            }
            return query;
        }
        if (operationType === 'Mutation') {
            let query = this.fetcher.generateMutationHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables);
            if (this.config.exposeMutationKeys) {
                query += (0, variables_generator_js_1.generateMutationKeyMaker)(node, operationName);
            }
            if (this.config.exposeFetcher && !this.fetcher._isReactHook) {
                query += this.fetcher.generateFetcherFetch(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables);
            }
            return query;
        }
        if (operationType === 'Subscription') {
            // eslint-disable-next-line no-console
            console.warn(`Plugin "typescript-react-query" does not support GraphQL Subscriptions at the moment! Ignoring "${node.name.value}"...`);
        }
        return null;
    }
}
exports.ReactQueryVisitor = ReactQueryVisitor;
