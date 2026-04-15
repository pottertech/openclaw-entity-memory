export type WorkflowDependencyRecord = {
  workflowName: string;
  dependsOn: string;
  sourceRef: string;
};

export interface WorkflowsSource {
  listWorkflowDependencies(): Promise<WorkflowDependencyRecord[]>;
}

export class StaticWorkflowsSource implements WorkflowsSource {
  async listWorkflowDependencies(): Promise<WorkflowDependencyRecord[]> {
    return [
      {
        workflowName: "Order Workflow",
        dependsOn: "Auth Service",
        sourceRef: "static:workflow:order-workflow",
      },
    ];
  }
}