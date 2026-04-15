export class StaticReposSource {
    async listRepoServiceMappings() {
        return [
            {
                repoName: "auth-repo",
                serviceName: "Auth Service",
                sourceRef: "static:repo:auth-repo",
            },
        ];
    }
}
