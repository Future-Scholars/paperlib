import { Eventable } from "@/base/event";
import { createDecorator } from "@/base/injection/injection";
import {
  CategorizerRepository,
  ICategorizerRepository,
} from "@/service/repositories/db-repository/categorizer-repository";

export interface IPaperRemoteRepositoryState {}

export const IPaperRemoteRepository = createDecorator("paperRemoteRepository");

export class PaperRemoteRepository extends Eventable<IPaperRemoteRepositoryState> {
  constructor(
    @ICategorizerRepository
    private readonly _categorizerRepository: CategorizerRepository
  ) {
    super("paperRemoteRepository", {});
  }

  /**
   * Load all papers from the remote repository.
   */
  async loadAllPapers() {
    
  }
}
