package com.example.demo.controller;

import com.example.demo.model.MatchRequest;
import com.example.demo.model.Message;
import com.example.demo.model.User;
import com.example.demo.repository.MatchRequestRepository;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.PasswordResetTokenRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import java.net.URLEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.messaging.simp.stomp.StompFrameHandler;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandler;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;
import org.springframework.web.socket.sockjs.client.SockJsClient;
import org.springframework.web.socket.sockjs.client.Transport;
import org.springframework.web.socket.sockjs.client.WebSocketTransport;

import java.lang.reflect.Type;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

/**
 * Focused integration test proving that the WebSocket/STOMP messaging path
 * enforces the confirmed-match authorization on the BACKEND — independently of
 * any frontend guard.
 *
 * Flow under test (live, over the wire):
 *   1. JwtChannelInterceptor validates the JWT on STOMP CONNECT and sets the
 *      principal. Without a valid token the CONNECT is rejected (return null).
 *   2. For every later frame (incl. SEND) the interceptor requires a non-null
 *      authenticated principal.
 *   3. MessageController.handleWebSocketMessage derives the sender from the
 *      authenticated principal (never client input) and only persists/broadcasts
 *      when existsConfirmedMatchBetween(sender, receiver) is true. Unmatched
 *      sends are dropped server-side (not persisted, not broadcast).
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WebSocketMessagingSecurityIT {

    @LocalServerPort
    private int port;

    @Autowired private UserRepository userRepository;
    @Autowired private MessageRepository messageRepository;
    @Autowired private MatchRequestRepository matchRequestRepository;
    @Autowired private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;

    private Long userAId;
    private Long userBId;
    private Long userCId;
    private String userCToken;

    @BeforeEach
    void setUp() {
        // Clean up in FK-safe order (H2 DB is shared across test classes).
        messageRepository.deleteAll();
        matchRequestRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        userRepository.deleteAll();

        User a = new User();
        a.setEmail("a@test.com");
        a.setPassword(passwordEncoder.encode("pass123"));
        a.setEmailVerified(true);
        a.setName("Alice");
        a = userRepository.save(a);
        userAId = a.getId();

        User b = new User();
        b.setEmail("b@test.com");
        b.setPassword(passwordEncoder.encode("pass456"));
        b.setEmailVerified(true);
        b.setName("Bob");
        b = userRepository.save(b);
        userBId = b.getId();

        // A and B are CONFIRMED matched. C is NOT matched with anyone.
        MatchRequest confirmed = new MatchRequest(a, b);
        confirmed.setStatus(MatchRequest.Status.CONFIRMED);
        matchRequestRepository.save(confirmed);

        User c = new User();
        c.setEmail("c@test.com");
        c.setPassword(passwordEncoder.encode("pass789"));
        c.setEmailVerified(true);
        c.setName("Charlie");
        c = userRepository.save(c);
        userCId = c.getId();
        userCToken = jwtUtil.generateToken(c.getEmail());
    }

    @Test
    void unmatchedUserCannotSendStompMessageToMatchedPair() throws Exception {
        WebSocketStompClient client = buildClient();

        // Connect as unmatched user C with a valid JWT.
        StompSession session = connect(client, userCToken);
        assertNotNull(session, "C should authenticate and connect over STOMP (JWT CONNECT accepted)");
        assertTrue(session.isConnected(), "C session should be connected");

        // C subscribes to A's inbox topic — if the server wrongly broadcast, C would see it here.
        ConcurrentLinkedQueue<Message> received = new ConcurrentLinkedQueue<>();
        session.subscribe("/topic/chat/" + userAId, frameHandler(received));

        // C attempts to SEND a message to A over /app/chat.send (no confirmed match exists).
        Message payload = new Message();
        payload.setReceiverId(userAId);
        payload.setContent("hi from C — should be blocked");
        session.send("/app/chat.send", payload);

        // Give the broker time to deliver IF it had broadcast (it must not).
        Thread.sleep(2000);

        assertEquals(0, received.size(),
                "Unmatched user C must NOT receive any broadcast after SEND to matched user A");
        assertEquals(0, messageRepository.count(),
                "Unmatched user C's SEND must NOT be persisted to the database");

        session.disconnect();
    }

    @Test
    void matchedUserCanSendStompMessage() throws Exception {
        // Positive control: proves the STOMP channel + handler run end-to-end for a
        // CONFIRMED pair, so the negative test above is meaningful (not a false pass).
        // Persistence is the authoritative, deterministic proof that the authorized
        // branch executed (sender derived from auth, confirmed-match passed, saved,
        // and convertAndSend was reached).
        WebSocketStompClient client = buildClient();

        // Connect as matched user A.
        StompSession session = connect(client, jwtUtil.generateToken("a@test.com"));
        assertNotNull(session);
        assertTrue(session.isConnected());

        // A sends to B (confirmed match) over /app/chat.send.
        Message payload = new Message();
        payload.setReceiverId(userBId);
        payload.setContent("hello B from A");
        session.send("/app/chat.send", payload);

        // Allow async processing.
        Thread.sleep(1000);

        assertEquals(1, messageRepository.count(),
                "Matched user A's STOMP SEND must be persisted through the WebSocket handler");
        Message saved = messageRepository.findAll().get(0);
        assertEquals("hello B from A", saved.getContent());
        assertEquals(userAId, saved.getSenderId(), "Sender must be derived from JWT principal, not client input");
        assertEquals(userBId, saved.getReceiverId());

        session.disconnect();
    }

    private WebSocketStompClient buildClient() {
        List<Transport> transports = List.of(new WebSocketTransport(new StandardWebSocketClient()));
        WebSocketStompClient client = new WebSocketStompClient(new SockJsClient(transports));
        MappingJackson2MessageConverter converter = new MappingJackson2MessageConverter();
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        converter.setObjectMapper(mapper);
        client.setMessageConverter(converter);
        return client;
    }

    private StompSession connect(WebSocketStompClient client, String token) throws Exception {
        // The JWT is delivered as a `?token=` query parameter on the SockJS URL, mirroring
        // how the production frontend connects. determineUser() (handshake) reads it and binds
        // the Principal to the whole session. The Authorization header is also supplied as a
        // fallback for the handshake's extractToken() path.
        String url = "http://localhost:" + port + "/ws-chat?token=" + URLEncoder.encode(token, "UTF-8");
        WebSocketHttpHeaders handshakeHeaders = new WebSocketHttpHeaders();
        handshakeHeaders.set("Authorization", "Bearer " + token);
        StompHeaders connectHeaders = new StompHeaders();
        connectHeaders.set("Authorization", "Bearer " + token);

        CompletableFuture<StompSession> future = new CompletableFuture<>();
        ListenableFuture<StompSession> listenable = client.connect(url, handshakeHeaders, connectHeaders,
                new StompSessionHandler() {
                    @Override
                    public void afterConnected(StompSession session, StompHeaders connectedHeaders) { }

                    @Override
                    public void handleException(StompSession session, org.springframework.messaging.simp.stomp.StompCommand command,
                                                StompHeaders headers, byte[] payload, Throwable exception) { }

                    @Override
                    public void handleTransportError(StompSession session, Throwable exception) {
                        future.completeExceptionally(exception);
                    }

                    @Override
                    public Type getPayloadType(StompHeaders headers) {
                        return String.class;
                    }

                    @Override
                    public void handleFrame(StompHeaders headers, Object payload) { }
                });
        listenable.addCallback(future::complete, future::completeExceptionally);
        try {
            return future.get(15, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            fail("STOMP connect timed out: " + e.getMessage());
            return null;
        }
    }

    private StompFrameHandler frameHandler(ConcurrentLinkedQueue<Message> sink) {
        return new StompFrameHandler() {
            @Override
            public Type getPayloadType(StompHeaders headers) {
                return Message.class;
            }

            @Override
            public void handleFrame(StompHeaders headers, Object payload) {
                if (payload instanceof Message) {
                    sink.add((Message) payload);
                }
            }
        };
    }
}
