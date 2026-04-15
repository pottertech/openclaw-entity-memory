import { AuthorityRepository } from "../db/postgres/repositories/authority-repository.js";

export class AuthorityService {
  constructor(private readonly authorityRepository: AuthorityRepository) {}

  async getMinimumRank(minAuthorityTier?: string): Promise<number> {
    if (!minAuthorityTier) {
      return 0;
    }

    const rank = await this.authorityRepository.getRankForTier(minAuthorityTier);
    return rank ?? 0;
  }
}