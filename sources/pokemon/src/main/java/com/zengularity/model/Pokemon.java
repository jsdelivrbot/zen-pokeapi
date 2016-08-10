package com.zengularity.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Pokemon object model
 */
@Data
@Builder
public class Pokemon {

    @Id
    private String id;

    private String name;

    private String img;

    private List<Stat> stats;

    private List<String> types;

    private Map<String, Map<String, Integer>> averageByType;

    @LastModifiedDate
    private LocalDateTime lastModifiedDate;


}
