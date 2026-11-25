package com.echogrove;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

// No default in-memory user: accounts live in the database and log in with JWT.
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class EchoGroveApplication {

    public static void main(String[] args) {
        SpringApplication.run(EchoGroveApplication.class, args);
    }
}
