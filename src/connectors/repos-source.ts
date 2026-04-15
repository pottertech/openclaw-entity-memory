export type RepoServiceRecord = {
  repoName: string;
  serviceName: string;
  sourceRef: string;
};

export interface ReposSource {
  listRepoServiceMappings(): Promise<RepoServiceRecord[]>;
}

export class StaticReposSource implements ReposSource {
  async listRepoServiceMappings(): Promise<RepoServiceRecord[]> {
    return [
      {
        repoName: "auth-repo",
        serviceName: "Auth Service",
        sourceRef: "static:repo:auth-repo",
      },
    ];
  }
}