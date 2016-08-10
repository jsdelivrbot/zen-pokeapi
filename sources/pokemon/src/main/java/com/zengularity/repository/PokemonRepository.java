package com.zengularity.repository;

import com.zengularity.model.Pokemon;
import org.springframework.data.mongodb.repository.MongoRepository;

/**
 * Repository to store the pokemons
 */
public interface PokemonRepository extends MongoRepository<Pokemon, String> {


    /**
     * Retrieve a Pokemon by id
     * @param id the id of Pokemon
     * @return the pokemon
     */
    Pokemon findById(String id);
}
