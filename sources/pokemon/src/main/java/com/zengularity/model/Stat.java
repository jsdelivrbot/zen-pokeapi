package com.zengularity.model;

import lombok.Builder;
import lombok.Data;


/**
 * Stat object model
 */
@Builder
@Data
public class Stat {

    private String name;

    private Integer baseStat;

    private Double maxStat;

}
