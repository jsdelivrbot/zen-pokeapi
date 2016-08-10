package com.zengularity.exceptions;

import org.springframework.http.HttpStatus;

/**
 * Created by louis on 13/07/2016.
 */
public class InternalServerError extends AbstractException {

    public InternalServerError() {
        this.httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    }
}
