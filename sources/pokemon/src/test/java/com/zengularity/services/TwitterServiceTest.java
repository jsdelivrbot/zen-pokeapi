package com.zengularity.services;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.*;
import org.mockito.runners.MockitoJUnitRunner;
import twitter4j.*;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.mockito.Matchers.any;
import static org.mockito.Mockito.*;

/**
 * Created by louis on 07/08/2016.
 */
@RunWith(MockitoJUnitRunner.class)
public class TwitterServiceTest {


    @InjectMocks
    private TwitterService service;

    @Mock
    Twitter twitter;


    @Captor
    ArgumentCaptor argCaptor;

    @Before
    public void init() throws TwitterException {
        MockitoAnnotations.initMocks(this);

        QueryResult queryResult = mock(QueryResult.class);
        List<Status> listTweets = new ArrayList<>();
        when(queryResult.getTweets()).thenReturn(listTweets);
        when(twitter.search(any(Query.class))).thenReturn(queryResult);
    }

    @Test
    public void testGetTweets() throws Exception {

        // given

        QueryResult queryResult = mock(QueryResult.class);
        List<Status> listTweets = new ArrayList<>();
        when(queryResult.getTweets()).thenReturn(listTweets);

        String search = "bulbasaur";


        // when
        service.getTweets(search);

        // then
        verify(twitter).search((Query) argCaptor.capture());
        Query arg = (Query) argCaptor.getValue();
        assertEquals(search, arg.getQuery());
    }
}