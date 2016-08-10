package com.zengularity.services;


import com.zengularity.model.Comment;
import com.zengularity.model.PokemonComments;
import com.zengularity.repository.CommentsRepository;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.*;
import org.mockito.runners.MockitoJUnitRunner;

import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Created by louis on 07/08/2016.
 */
@RunWith(MockitoJUnitRunner.class)
public class CommentsServiceTest {

    @InjectMocks
    private CommentsService commentsService;

    @Mock
    private CommentsRepository commentsRepository;

    @Captor
    ArgumentCaptor argCaptor;

    @Before
    public void init() {
        MockitoAnnotations.initMocks(this);
    }

    @Test
    public void testAddComment() throws Exception {

        // given
        Comment comment = new Comment();
        comment.setComment("Super commentaire");
        comment.setAuthor("author");
        String pokemonId = "bulbasaur";

        // when
        commentsService.addComment(pokemonId, comment);

        // then
        verify(commentsRepository).save((PokemonComments) argCaptor.capture());

        assertEquals(pokemonId, ((PokemonComments) argCaptor.getValue()).getIdPokemon());
        assertEquals(comment, ((PokemonComments) argCaptor.getValue()).getComments().get(0));
    }

    @Test
    public void testGetComments() throws Exception {

        // given
        Comment comment = new Comment();
        comment.setComment("Super commentaire");
        comment.setAuthor("author");
        List<Comment> comments = new ArrayList<>();
        comments.add(comment);
        String pokemonId = "bulbasaur";

        PokemonComments pokemonComments = PokemonComments.builder().idPokemon(pokemonId).comments(comments).build();
        when(commentsRepository.findByIdPokemon(pokemonId)).thenReturn(pokemonComments);

        // when
        List<Comment> commentsOuput = commentsService.getComments(pokemonId);

        // then
        assertEquals(comment, commentsOuput.get(0));

    }
}