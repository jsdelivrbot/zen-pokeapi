package com.zengularity.services;

import com.zengularity.exceptions.StatNotFound;
import com.zengularity.model.Pokemon;
import com.zengularity.model.Stat;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Stats service
 *
 * Maintain a map with all stats to process the average by stat
 */
@Slf4j
@Service
public class StatsService {


    private PokemonService pokemonService;

    // Map to store the average by type and stat
    private Map<String, Map<String, Double>> mapAverageStats = new HashMap<>();

    // Map to store the max stat
    private Map<String, Double> mapMaxStats = new HashMap<>();

    @Autowired
    private StatsService(PokemonService pokemonService) throws InterruptedException {

        this.pokemonService = pokemonService;

        log.info("Building initial stats");
        List<Pokemon> pokemonsList;

        log.info("Retrieve all pokemons ID with Stats");
        pokemonsList = this.pokemonService.getPokemonsList();


        log.info("Build map for stats");
        updateStats(pokemonsList);


    }

    /**
     * Update stats from fresh list of pokemons
     *
     * @param pokemonsList
     */
    public void updateStats(List<Pokemon> pokemonsList) {
        log.info("Starting update stats");
        Map<String, Map<String, Set<Integer>>> mapAverageStatsTmp = new HashMap<>();
        Map<String, Set<Integer>> mapMaxStatsTmp = new HashMap<>();

        // Constructs tempory maps
        for (Pokemon p : pokemonsList) {
            for (Stat pokStat : p.getStats()) {

                // Process the average by type and stat
                for (String type : p.getTypes()) {
                    mapAverageStatsTmp.putIfAbsent(type, new HashMap<>());

                    mapAverageStatsTmp.get(type).putIfAbsent(pokStat.getName(), new TreeSet<>());
                    mapAverageStatsTmp.get(type).get(pokStat.getName()).add(pokStat.getBaseStat());

                }

                mapMaxStatsTmp.putIfAbsent(pokStat.getName(), new TreeSet<>());
                mapMaxStatsTmp.get(pokStat.getName()).add(pokStat.getBaseStat());
            }
        }

        // Create the average map
        for (String type : mapAverageStatsTmp.keySet()) {

            for (String stat : mapAverageStatsTmp.get(type).keySet()) {
                OptionalDouble average = mapAverageStatsTmp.get(type).get(stat).stream().mapToDouble(s -> s).average();
                mapAverageStats.putIfAbsent(type, new HashMap<>());
                mapAverageStats.get(type).put(stat, average.isPresent() ? average.getAsDouble() : 0);


            }
        }

        // Create the max map
        for (String stat : mapMaxStatsTmp.keySet()) {
            OptionalDouble max = mapMaxStatsTmp.get(stat).stream().mapToDouble(s -> s).max();
            mapMaxStats.putIfAbsent(stat, max.isPresent() ? max.getAsDouble() : 0);
        }


        log.info("Ending update stats");

    }


    /**
     * Give the average of given type/stat
     *
     * @param type
     * @param stat
     * @return
     */
    public Double getAverageStats(String type, String stat) {
        if (mapAverageStats.get(type) != null && mapAverageStats.get(type).get(stat) != null) {
            return mapAverageStats.get(type).get(stat);
        }

        throw new StatNotFound();
    }

    /**
     * Give the max of given stat
     *
     * @param stat
     * @return
     */
    public Double getMaxStats(String stat) {
        if (mapMaxStats.get(stat) != null) {
            return mapMaxStats.get(stat);
        }

        throw new StatNotFound();
    }


}
