import { ClientSideBaseVisitor, DocumentMode, getConfigValue, } from '@graphql-codegen/visitor-plugin-common';
import { generateMutationKeyMaker, generateQueryKeyMaker, generateInfiniteQueryKeyMaker, } from './variables-generator.js';
import { CustomMapperFetcher } from './fetcher-custom-mapper.js';
import { FetchFetcher } from './fetcher-fetch.js';
import { GraphQLRequestClientFetcher } from './fetcher-graphql-request.js';
import { HardcodedFetchFetcher } from './fetcher-fetch-hardcoded.js';
import autoBind from 'auto-bind';
import { pascalCase } from 'change-case-all';
export class ReactQueryVisitor extends ClientSideBaseVisitor {
    constructor(schema, fragments, rawConfig, documents) {
        super(schema, fragments, rawConfig, {
            documentMode: DocumentMode.string,
            errorType: getConfigValue(rawConfig.errorType, 'unknown'),
            exposeDocument: getConfigValue(rawConfig.exposeDocument, false),
            exposeQueryKeys: getConfigValue(rawConfig.exposeQueryKeys, false),
            exposeMutationKeys: getConfigValue(rawConfig.exposeMutationKeys, false),
            exposeFetcher: getConfigValue(rawConfig.exposeFetcher, false),
            addInfiniteQuery: getConfigValue(rawConfig.addInfiniteQuery, false),
            legacyMode: getConfigValue(rawConfig.legacyMode, false),
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
        autoBind(this);
    }
    get imports() {
        return this._imports;
    }
    createFetcher(raw) {
        if (raw === 'fetch') {
            return new FetchFetcher(this);
        }
        if (typeof raw === 'object' && 'endpoint' in raw) {
            return new HardcodedFetchFetcher(this, raw);
        }
        if (raw === 'graphql-request') {
            return new GraphQLRequestClientFetcher(this);
        }
        return new CustomMapperFetcher(this, raw);
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
            return pascalCase(operationType);
        }
        if (name.includes('Query') || name.includes('Mutation') || name.includes('Subscription')) {
            return '';
        }
        return pascalCase(operationType);
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
                query += `\n${generateQueryKeyMaker(node, operationName, operationVariablesTypes, hasRequiredVariables)};\n`;
            }
            if (this.config.addInfiniteQuery) {
                query += `\n${this.fetcher.generateInfiniteQueryHook(node, documentVariableName, operationName, operationResultType, operationVariablesTypes, hasRequiredVariables)}\n`;
                if (this.config.exposeQueryKeys) {
                    query += `\n${generateInfiniteQueryKeyMaker(node, operationName, operationVariablesTypes, hasRequiredVariables)};\n`;
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
                query += generateMutationKeyMaker(node, operationName);
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
