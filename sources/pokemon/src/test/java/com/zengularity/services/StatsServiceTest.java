package com.zengularity.services;

import com.zengularity.model.Pokemon;
import com.zengularity.model.Stat;
import org.junit.Before;
import org.junit.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.when;

/**
 * Created by louis on 09/08/2016.
 */
public class StatsServiceTest {

    @InjectMocks
    private StatsService statsService;

    @Mock
    private PokemonService pokemonService;


    private List<Pokemon> pokemonList;

    @Before
    public void init() {
        MockitoAnnotations.initMocks(this);

        pokemonList = new ArrayList<>();

        List<Stat> statsBulbasaur = new ArrayList<>();
        statsBulbasaur.add(Stat.builder().name("special-defense").baseStat(10).build());
        statsBulbasaur.add(Stat.builder().name("hp").baseStat(20).build());
        List<String> typesBulbasaur = new ArrayList<>();
        typesBulbasaur.add("poison");
        typesBulbasaur.add("grass");
        Pokemon bulbasaur = Pokemon.builder().name("bulbasaur").id("1").stats(statsBulbasaur).types(typesBulbasaur).build();
        pokemonList.add(bulbasaur);

        List<Stat> statsIvysaur = new ArrayList<>();
        statsIvysaur.add(Stat.builder().name("special-defense").baseStat(30).build());
        statsIvysaur.add(Stat.builder().name("hp").baseStat(15).build());
        List<String> typesIvysaur = new ArrayList<>();
        typesIvysaur.add("poison");
        typesIvysaur.add("grass");
        Pokemon ivysaur = Pokemon.builder().name("ivysaur").id("2").stats(statsIvysaur).types(typesIvysaur).build();
        pokemonList.add(ivysaur);


        when(pokemonService.getPokemonsList()).thenReturn(pokemonList);

    }


    @Test
    public void testStatsServiceWith2Pokemons() {

        //given

        //when
        statsService.updateStats(pokemonList);

        //then
        assertEquals(new Double(20), statsService.getAverageStats("poison", "special-defense"));
        assertEquals(new Double(20), statsService.getAverageStats("grass", "special-defense"));

        assertEquals(new Double(17.5), statsService.getAverageStats("poison", "hp"));
        assertEquals(new Double(17.5), statsService.getAverageStats("grass", "hp"));


    }

    @Test
    public void testStatsServiceWith3Pokemons() {

        //given
        List<Stat> statsCloyster = new ArrayList<>();
        statsCloyster.add(Stat.builder().name("special-defense").baseStat(35).build());
        statsCloyster.add(Stat.builder().name("hp").baseStat(55).build());
        List<String> typesCloyster = new ArrayList<>();
        typesCloyster.add("poison");
        typesCloyster.add("fighting");

        Pokemon cloyster = Pokemon.builder().name("cloyster").id("3").stats(statsCloyster).types(typesCloyster).build();
        pokemonList.add(cloyster);


        //when
        statsService.updateStats(pokemonList);

        //then
        assertEquals(new Double(25), statsService.getAverageStats("poison", "special-defense"));
        assertEquals(new Double(20), statsService.getAverageStats("grass", "special-defense"));
        assertEquals(new Double(35), statsService.getAverageStats("fighting", "special-defense"));

        assertEquals(new Double(30), statsService.getAverageStats("poison", "hp"));
        assertEquals(new Double(17.5), statsService.getAverageStats("grass", "hp"));
        assertEquals(new Double(55), statsService.getAverageStats("fighting", "hp"));


    }


}