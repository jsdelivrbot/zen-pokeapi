package com.zengularity.services;

import com.zengularity.client.PokemonClientWrapper;
import com.zengularity.exceptions.ResourceNotFound;
import com.zengularity.model.Pokemon;
import com.zengularity.model.Stat;
import com.zengularity.repository.PokemonRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Optional;

/**
 * Pokemon Service
 *
 * gets all Pokemons from mongo or from pokeapi.co
 */

@Slf4j
@Service
public class PokemonService {

    private PokemonClientWrapper pokemonClient;

    private List<Pokemon> pokemonsList;

    @Autowired
    private StatsService statsService;

    private PokemonRepository repository;


    @Autowired
    public PokemonService(PokemonRepository repository, PokemonClientWrapper pokemonClient) {

        this.repository = repository;
        this.pokemonClient = pokemonClient;

        if (repository.count() == 0) {
            log.info("Retrieve all pokemons ID from Pokapi.co");
            try {
                pokemonsList = pokemonClient.getPokemons(true);
                repository.save(pokemonsList);
            } catch (InterruptedException e) {
                log.error("Une erreur est survenue lors de la récupération des Pokemons");
                throw new InternalError();
            }
        } else {
            log.info("Retrieve all pokemons ID from Mongo");
            pokemonsList = repository.findAll(new Sort(Sort.Direction.ASC, "name"));
        }

    }

    public List<Pokemon> getPokemonsList() {
        return pokemonsList;
    }

    /**
     * Get a pokemon by name in Mongo
     *
     * Retrieve the pokemon resource and add stats informations
     *
     * @param name
     * @return
     */
    public Pokemon getPokemon(String name) {
        Optional<Pokemon> pokemon = pokemonsList.stream().filter(p -> p.getName().equals(name)).findFirst();
        if (pokemon.isPresent()) {

            Pokemon p = pokemon.get();


            // Add stats informations by type
            if (p.getTypes() != null && p.getStats() != null) {

                if (p.getAverageByType() == null) {
                    p.setAverageByType(new HashMap<>());
                }

                for (String type : p.getTypes()) {
                    p.getAverageByType().putIfAbsent(type, new HashMap<>());

                    for (Stat stat : p.getStats()) {
                        p.getAverageByType().get(type).putIfAbsent(stat.getName(), statsService.getAverageStats(type, stat.getName()).intValue());

                    }
                }

                for (Stat stat : p.getStats()) {
                    stat.setMaxStat(statsService.getMaxStats(stat.getName()));
                }
            }

            return p;
        } else {
            throw new ResourceNotFound();
        }
    }

    /**
     * Update a pokemon from pokapi.co every 1 second
     */
    @Scheduled(fixedRate = 10000)
    private void updatePokemonList() {

        log.info("Updating pokemon list");
        Pokemon pokFromDB = repository.findAll(new Sort(Sort.Direction.ASC, "lastModifiedDate")).get(0);

        log.info("Pokemon selected : {} ", pokFromDB.getId());

        // Replace old pokemon from list
        Optional<Pokemon> pokemonOptional = pokemonsList.stream().filter(p -> p.getId().equals(pokFromDB.getId())).findFirst();
        if (pokemonOptional.isPresent()) {
            Pokemon pokFromList = pokemonOptional.get();

            // get pokemon
            Pokemon pokUpdated = pokemonClient.getPokemon(pokFromDB, true);

            // Remove from list
            pokemonsList.remove(pokFromList);

            // Update list and repo
            pokemonsList.add(pokUpdated);
            repository.save(pokUpdated);

            log.info("Pokemon updated");

            // Update stats
            statsService.updateStats(repository.findAll());

        }
    }
}
