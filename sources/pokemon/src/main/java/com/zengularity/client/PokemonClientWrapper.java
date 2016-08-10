package com.zengularity.client;


import com.zengularity.model.Pokemon;
import com.zengularity.model.Stat;
import lombok.extern.slf4j.Slf4j;
import me.sargunvohra.lib.pokekotlin.client.PokeApi;
import me.sargunvohra.lib.pokekotlin.client.PokeApiClient;
import me.sargunvohra.lib.pokekotlin.model.NamedApiResource;
import me.sargunvohra.lib.pokekotlin.model.NamedApiResourceList;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * Client pour PokeApi
 */
@Slf4j
@Component
public class PokemonClientWrapper {


    private PokeApi client;

    private ExecutorService executorService;

    @PostConstruct
    private void init() {

        client = new PokeApiClient();

        executorService = Executors.newFixedThreadPool(5);

    }

    /**
     * Gets all pokemons list
     * @param withStatsAndTypes true get the pokemon with stats and types objects
     * @return
     * @throws InterruptedException
     */
    public List<Pokemon> getPokemons(boolean withStatsAndTypes) throws InterruptedException {

        NamedApiResourceList pokemonListResponse = client.getPokemonList(0, 1000);

        final CountDownLatch latch = new CountDownLatch(pokemonListResponse.getResults().size());

        List<Pokemon> pokemons = new ArrayList<>();
        for (NamedApiResource pok : pokemonListResponse.getResults()) {

            // Create pokemon in another thread to optimize
            executorService.submit(() -> {
                createPokemon(latch, pokemons, pok, withStatsAndTypes);
            });

        }

        latch.await();


        return pokemons;
    }

    /**
     * Private method for create pokemon in multiple thread
     *
     * @param latch counter for waiting all thread active are finished
     * @param pokemons the list of pokemons objects
     * @param pok the resource return by Pokeapi
     * @param withStatsAndTypes true get the pokemon with stats and types objects
     */
    private void createPokemon(CountDownLatch latch, List<Pokemon> pokemons, NamedApiResource pok, boolean withStatsAndTypes) {

         // Create the pokemon without stats
        Pokemon pokemon = Pokemon.builder().name(pok.getName()).id(String.valueOf(pok.getId())).averageByType(new HashMap<>()).build();

        // Add stats to the pokemon if needed
        if (withStatsAndTypes) {
            addStatsAndTypes(pokemon);
        }

        pokemons.add(pokemon);
        latch.countDown();

    }

    /**
     * Add stats and type from pokemon resource
     *
     * @param pokemon
     */
    public void addStatsAndTypes(Pokemon pokemon) {
        me.sargunvohra.lib.pokekotlin.model.Pokemon pokemonResource = client.getPokemon(Integer.parseInt(pokemon.getId()));
        List<Stat> stats = pokemonResource.getStats().stream().map(p -> Stat.builder().baseStat(p.getBaseStat()).name(p.getStat().getName()).build()).collect(Collectors.toList());
        pokemon.setStats(stats);

        List<String> types = pokemonResource.getTypes().stream().map(t -> t.getType().getName()).collect(Collectors.toList());
        pokemon.setTypes(types);
    }

    /**
     * Get the pokemon resource and add sprite and stats/types if needed
     * @param p the pokemon
     * @param withStatsAndTypes true get the pokemon with stats and types objects
     * @return
     */
    public Pokemon getPokemon(Pokemon p, boolean withStatsAndTypes) {
        me.sargunvohra.lib.pokekotlin.model.Pokemon pok = client.getPokemon(Integer.valueOf(p.getId()));
        p.setImg(pok.getSprites().getFrontDefault());

        if (withStatsAndTypes) {
            addStatsAndTypes(p);
        }
        return p;
    }

    public PokemonClientWrapper() {
    }
}
