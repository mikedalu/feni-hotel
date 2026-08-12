package com.backend.feni;

import org.springframework.boot.SpringApplication;

public class TestFeniApplication {

    public static void main(String[] args) {
        SpringApplication.from(FeniApplication::main).with(TestcontainersConfiguration.class).run(args);
    }

}
