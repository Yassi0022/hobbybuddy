package com.example.demo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PagesController {

    @GetMapping("/")
    public String getHomePage() {
        return "home";
    }

    @GetMapping("/register")
    public String getRegisterPage() {
        return "register";
    }

    @GetMapping("/login")
    public String getLoginPage() {
        return "login";
    }

    @GetMapping("/quiz")
    public String getQuizPage() {
        return "quiz";
    }

    @GetMapping("/dashboard")
    public String getDashboardPage() {
        return "dashboard";
    }
}
