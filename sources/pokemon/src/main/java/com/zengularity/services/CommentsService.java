package com.zengularity.services;

import com.zengularity.exceptions.ResourceNotFound;
import com.zengularity.model.Comment;
import com.zengularity.model.PokemonComments;
import com.zengularity.repository.CommentsRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Twitter service
 * <p>
 * Retrieve list of tweets related of given word
 */
@Slf4j
@Service
public class CommentsService {


    @Autowired
    CommentsRepository commentsRepository;

    /**
     * Add a comment to a pokemon profile
     *
     * @param pokemonId
     * @param comment
     */
    public void addComment(String pokemonId, Comment comment) {

        // Test if repository already contains an entry
        PokemonComments pokemonComments = commentsRepository.findByIdPokemon(pokemonId);
        if (pokemonComments != null) {
            pokemonComments.getComments().add(comment);
            commentsRepository.save(pokemonComments);
        } else {
            List comments = new ArrayList<Comment>();
            comments.add(comment);
            PokemonComments newPokemonComments = PokemonComments.builder().idPokemon(pokemonId).comments(comments).build();
            commentsRepository.save(newPokemonComments);
        }
    }

    /**
     * Retrieve comments related to Pokemon
     *
     * @param pokemonId
     * @return the comments
     */
    public List<Comment> getComments(String pokemonId) {
        PokemonComments pokemonComments = commentsRepository.findByIdPokemon(pokemonId);
        if (pokemonComments != null) {
            return pokemonComments.getComments();
        } else {
            throw new ResourceNotFound();
        }
    }
}
