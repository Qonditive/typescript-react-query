import { FetcherRenderer } from './fetcher.cjs';
import { OperationDefinitionNode } from 'graphql';
import { ReactQueryVisitor } from './visitor.cjs';
export declare class GraphQLRequestClientFetcher implements FetcherRenderer {
    private visitor;
    constructor(visitor: ReactQueryVisitor);
    generateFetcherImplementaion(): string;
    generateInfiniteQueryHook(node: OperationDefinitionNode, documentVariableName: string, operationName: string, operationResultType: string, operationVariablesTypes: string, hasRequiredVariables: boolean): string;
    generateQueryHook(node: OperationDefinitionNode, documentVariableName: string, operationName: string, operationResultType: string, operationVariablesTypes: string, hasRequiredVariables: boolean): string;
    generateMutationHook(node: OperationDefinitionNode, documentVariableName: string, operationName: string, operationResultType: string, operationVariablesTypes: string, hasRequiredVariables: boolean): string;
    generateFetcherFetch(node: OperationDefinitionNode, documentVariableName: string, operationName: string, operationResultType: string, operationVariablesTypes: string, hasRequiredVariables: boolean): string;
}
