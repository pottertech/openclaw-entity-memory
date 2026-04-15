export class StaticWorkflowsSource {
    async listWorkflowDependencies() {
        return [
            {
                workflowName: "Order Workflow",
                dependsOn: "Auth Service",
                sourceRef: "static:workflow:order-workflow",
            },
        ];
    }
}
