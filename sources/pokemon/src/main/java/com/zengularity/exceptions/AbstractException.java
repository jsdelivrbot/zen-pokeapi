package com.zengularity.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Created by louis on 13/07/2016.
 */
public abstract class AbstractException extends RuntimeException {

    HttpStatus httpStatus;
}
