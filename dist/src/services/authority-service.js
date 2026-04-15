export class AuthorityService {
    authorityRepository;
    constructor(authorityRepository) {
        this.authorityRepository = authorityRepository;
    }
    async getMinimumRank(minAuthorityTier) {
        if (!minAuthorityTier) {
            return 0;
        }
        const rank = await this.authorityRepository.getRankForTier(minAuthorityTier);
        return rank ?? 0;
    }
}
