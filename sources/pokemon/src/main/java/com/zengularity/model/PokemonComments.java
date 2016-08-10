package com.zengularity.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;

import java.util.List;

/**
 * Object to store comments for a Pokemon
 */
@Data
@Builder
public class PokemonComments {

    @Id
    private String idPokemon;

    private List<Comment> comments;

}
