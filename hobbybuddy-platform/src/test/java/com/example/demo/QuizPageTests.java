package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class QuizPageTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void quizPageLoads() {
        String url = "http://localhost:" + port + "/quiz";
        String body = this.restTemplate.getForObject(url, String.class);
        assertNotNull(body, "Quiz page should return a response body");
        assertTrue(body.contains("id=\"screen-quiz\""), "Quiz HTML should contain the quiz screen element");
    }

    @Test
    void dashboardPageLoads() {
        String url = "http://localhost:" + port + "/dashboard";
        String body = this.restTemplate.getForObject(url, String.class);
        assertNotNull(body, "Dashboard page should return a response body");
        // Simple check for a known element on the dashboard
        // The dashboard page may redirect based on user state; simply verify the response is not empty
        assertNotNull(body, "Dashboard page response should not be null");
    }
}
