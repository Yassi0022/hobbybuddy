package com.example.demo;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
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
        // The app serves a React SPA; verify the SPA shell is returned
        assertTrue(body.contains("<div id=\"root\"></div>"), "Quiz page should contain the React root element");
    }

    @Test
    void dashboardPageLoads() {
        String url = "http://localhost:" + port + "/dashboard";
        String body = this.restTemplate.getForObject(url, String.class);
        assertNotNull(body, "Dashboard page should return a response body");
        // The app serves a React SPA; verify the SPA shell is returned
        assertTrue(body.contains("<div id=\"root\"></div>"), "Dashboard page should contain the React root element");
    }
}
