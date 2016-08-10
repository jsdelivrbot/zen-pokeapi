package com.zengularity.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Created by louis on 13/07/2016.
 */
public class ResourceNotFound extends AbstractException {

    public ResourceNotFound() {
        this.httpStatus = HttpStatus.NOT_FOUND;
    }
}
