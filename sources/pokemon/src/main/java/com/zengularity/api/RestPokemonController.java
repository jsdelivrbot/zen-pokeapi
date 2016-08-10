package com.zengularity.api;

import com.zengularity.model.Comment;
import com.zengularity.model.Pokemon;
import com.zengularity.model.Tweet;
import com.zengularity.services.CommentsService;
import com.zengularity.services.PokemonService;
import com.zengularity.services.TwitterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller par défaut pour l'exposition de l'API
 */
@RestController
@RequestMapping(value = "/api")
public class RestPokemonController {

    @Autowired
    PokemonService pokemonService;

    @Autowired
    TwitterService twitterService;

    @Autowired
    CommentsService commentsService;

    @RequestMapping(value = "/pokemons", method = RequestMethod.GET)
    public List<Pokemon> pokemons() {
        return pokemonService.getPokemonsList();
    }

    @RequestMapping(value = "/pokemons/{name}", method = RequestMethod.GET)
    public Pokemon pokemon(@PathVariable String name) {
        return pokemonService.getPokemon(name);
    }

    @RequestMapping(value = "/tweets/{search}", method = RequestMethod.GET)
    public List<Tweet> getTweets(@PathVariable String search) {
        return twitterService.getTweets(search);
    }


    @RequestMapping(value = "/pokemons/{pokemonName}/comments", method = RequestMethod.POST)
    public ResponseEntity<Void> postComment(@PathVariable String pokemonName, @RequestBody Comment comment) {
        if (comment == null || StringUtils.isEmpty(comment.getAuthor()) || StringUtils.isEmpty(comment.getComment()))
            return new ResponseEntity<Void>(HttpStatus.BAD_REQUEST);

        commentsService.addComment(pokemonName, comment);
        return new ResponseEntity<Void>(HttpStatus.CREATED);
    }

    @RequestMapping(value = "/pokemons/{pokemonName}/comments", method = RequestMethod.GET)
    public List<Comment> getComments(@PathVariable String pokemonName) {
        return commentsService.getComments(pokemonName);
    }

}