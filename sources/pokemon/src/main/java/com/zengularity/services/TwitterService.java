package com.zengularity.services;

import com.zengularity.exceptions.InternalServerError;
import com.zengularity.model.Tweet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import twitter4j.*;
import twitter4j.conf.ConfigurationBuilder;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;

/**
 * Twitter service
 *
 * Retrieve list of tweets related of given word
 */
@Slf4j
@Service
public class TwitterService {


    @Value("${twitter.consumer.key}")
    private String consumerKey;
    @Value("${twitter.consumer.secret}")
    private String consumerSecret;
    @Value("${twitter.access.tokenSecret}")
    private String accessTokenSecret;
    @Value("${twitter.access.token}")
    private String accessToken;

    Twitter twitter;


    /**
     * Init method to construct the client
     */
    @PostConstruct
    private void init() {

        log.info("Configure Twitter client");
        ConfigurationBuilder cb = new ConfigurationBuilder();
        cb.setDebugEnabled(true)
                .setOAuthConsumerKey(consumerKey)
                .setOAuthConsumerSecret(consumerSecret)
                .setOAuthAccessToken(accessToken)
                .setOAuthAccessTokenSecret(accessTokenSecret);
        TwitterFactory tf = new TwitterFactory(cb.build());
        twitter = tf.getInstance();
        log.info("Twitter client configured");

    }

    /**
     * Retrieve tweets from Twitter
     *
     * @param search the string to search
     * @return list of {@Tweet}
     */
    public List<Tweet> getTweets(String search) {
        try {
            Query query = new Query(search);
            query.setCount(5);
            QueryResult result;
            List<Tweet> tweets = new ArrayList<>();
            result = twitter.search(query);

            for (Status tweet : result.getTweets()) {
                tweets.add(Tweet.builder().img(tweet.getUser().getMiniProfileImageURL()).author(tweet.getUser().getName()).text(tweet.getText()).build());
            }
            return tweets;

        } catch (TwitterException te) {
            throw new InternalServerError();
        }
    }


}
