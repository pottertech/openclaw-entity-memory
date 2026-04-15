export class StaticOwnersSource {
    async listOwnerProjectMappings() {
        return [
            {
                ownerName: "Alice",
                projectName: "Project Atlas",
                sourceRef: "static:owner:alice-atlas",
            },
        ];
    }
}
