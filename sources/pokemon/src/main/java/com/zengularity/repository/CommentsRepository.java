package com.zengularity.repository;

import com.zengularity.model.PokemonComments;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * Repository to store comments
 */
public interface CommentsRepository extends MongoRepository<PokemonComments, String> {

    /**
     * Get all comments for a pokemon
     * @param idPokemon the pokemon to retrieve
     * @return
     */
    PokemonComments findByIdPokemon(String idPokemon);
}
