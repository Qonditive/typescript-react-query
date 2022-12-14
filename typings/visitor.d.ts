import { ClientSideBasePluginConfig, ClientSideBaseVisitor, LoadedFragment } from '@graphql-codegen/visitor-plugin-common';
import { GraphQLSchema, OperationDefinitionNode } from 'graphql';
import { FetcherRenderer } from './fetcher.js';
import { ReactQueryRawPluginConfig } from './config.js';
import { Types } from '@graphql-codegen/plugin-helpers';
export interface ReactQueryPluginConfig extends ClientSideBasePluginConfig {
    errorType: string;
    exposeDocument: boolean;
    exposeQueryKeys: boolean;
    exposeMutationKeys: boolean;
    exposeFetcher: boolean;
    addInfiniteQuery: boolean;
    legacyMode: boolean;
}
export interface ReactQueryMethodMap {
    infiniteQuery: {
        hook: string;
        options: string;
    };
    query: {
        hook: string;
        options: string;
    };
    mutation: {
        hook: string;
        options: string;
    };
}
export declare class ReactQueryVisitor extends ClientSideBaseVisitor<ReactQueryRawPluginConfig, ReactQueryPluginConfig> {
    protected rawConfig: ReactQueryRawPluginConfig;
    private _externalImportPrefix;
    fetcher: FetcherRenderer;
    reactQueryHookIdentifiersInUse: Set<string>;
    reactQueryOptionsIdentifiersInUse: Set<string>;
    queryMethodMap: ReactQueryMethodMap;
    constructor(schema: GraphQLSchema, fragments: LoadedFragment[], rawConfig: ReactQueryRawPluginConfig, documents: Types.DocumentFile[]);
    get imports(): Set<string>;
    private createFetcher;
    get hasOperations(): boolean;
    getImports(): string[];
    getFetcherImplementation(): string;
    private _getHookSuffix;
    protected buildOperation(node: OperationDefinitionNode, documentVariableName: string, operationType: string, operationResultType: string, operationVariablesTypes: string, hasRequiredVariables: boolean): string;
}
