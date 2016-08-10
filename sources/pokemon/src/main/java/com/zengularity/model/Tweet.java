package com.zengularity.model;

import lombok.Builder;
import lombok.Data;

/**
 * Tweet object model
 */
@Data
@Builder
public class Tweet {

    private String img;

    private String text;

    private String author;
}
